import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';

import {
  pool
} from '../config/database';

import {
  EstadoPago,
  MetodoPago,
  Pago
} from '../models/pago.model';


interface PagoRow extends RowDataPacket {
  id_pago: number;
  venta_id: number;

  metodo_pago: MetodoPago;

  monto:
    string | number;

  estado_pago:
    EstadoPago;

  referencia_transaccion:
    string | null;

  referencia_reembolso:
    string | null;

  fecha_pago:
    Date | null;

  fecha_reembolso:
    Date | null;

  motivo_reembolso:
    string | null;

  fecha_creacion:
    Date;
}

export interface VentaPagoRow
  extends RowDataPacket {

  id_venta: number;

  cliente_id: number | null;

  canal_venta:
    | 'WEB'
    | 'TIENDA';

  estado:
    | 'PENDIENTE_PAGO'
    | 'PAGADA'
    | 'EN_PREPARACION'
    | 'LISTA_PARA_RECOGER'
    | 'ENTREGADA'
    | 'ANULADA';

  total: string | number;
}


export class PagoRepository {

  async marcarPagoReembolsado(
  connection: PoolConnection,

  pagoId: number,

  referenciaReembolso: string,

  motivo: string
): Promise<void> {

  await connection.execute(
    `
    UPDATE TB_PAGO

    SET
      estado_pago = 'REEMBOLSADO',

      referencia_reembolso = ?,

      fecha_reembolso =
        CURRENT_TIMESTAMP,

      motivo_reembolso = ?

    WHERE id_pago = ?
    `,
    [
      referenciaReembolso,
      motivo,
      pagoId
    ]
  );
}

async obtenerPagoAprobadoVentaConBloqueo(
  connection: PoolConnection,
  ventaId: number
): Promise<PagoRow | null> {

  const [rows] =
    await connection.query<PagoRow[]>(
      `
      SELECT
        id_pago,
          venta_id,
          metodo_pago,
          monto,
          estado_pago,
          referencia_transaccion,
          referencia_reembolso,
          fecha_pago,
          fecha_reembolso,

          motivo_reembolso,
          fecha_creacion

      FROM TB_PAGO

      WHERE
        venta_id = ?
        AND estado_pago = 'APROBADO'

      LIMIT 1

      FOR UPDATE
      `,
      [ventaId]
    );


  return rows.length > 0
    ? rows[0]
    : null;
}


  async obtenerPorId(
    id: number
  ): Promise<Pago | null> {

    const [rows] =
      await pool.query<PagoRow[]>(
        `
        SELECT
          id_pago,
          venta_id,
          metodo_pago,
          monto,
          estado_pago,
          referencia_transaccion,
          referencia_reembolso,
          fecha_pago,
          fecha_reembolso,

          motivo_reembolso,
          fecha_creacion
        FROM TB_PAGO
        WHERE id_pago = ?
        LIMIT 1
        `,
        [id]
      );


    if (rows.length === 0) {
      return null;
    }


    return this.mapearPago(
      rows[0]
    );
  }


  async obtenerPagosVenta(
    ventaId: number
  ): Promise<Pago[]> {

    const [rows] =
      await pool.query<PagoRow[]>(
        `
        SELECT
          id_pago,
          venta_id,
          metodo_pago,
          monto,
          estado_pago,
          referencia_transaccion,
          referencia_reembolso,
          fecha_pago,
          fecha_reembolso,

          motivo_reembolso,
          fecha_creacion
        FROM TB_PAGO
        WHERE venta_id = ?
        ORDER BY fecha_creacion DESC
        `,
        [ventaId]
      );


    return rows.map(
      row =>
        this.mapearPago(row)
    );
  }


  async obtenerVentaCliente(
    ventaId: number,
    clienteId: number
  ): Promise<VentaPagoRow | null> {

    const [rows] =
      await pool.query<VentaPagoRow[]>(
        `
        SELECT
          id_venta,
          cliente_id,
          canal_venta,
          estado,
          total
        FROM TB_VENTA
        WHERE
          id_venta = ?
          AND cliente_id = ?
          AND canal_venta = 'WEB'
        LIMIT 1
        `,
        [
          ventaId,
          clienteId
        ]
      );


    return rows.length > 0
      ? rows[0]
      : null;
  }


  async obtenerPagoPendienteVenta(
    ventaId: number
  ): Promise<Pago | null> {

    const [rows] =
      await pool.query<PagoRow[]>(
        `
        SELECT
          id_pago,
          venta_id,
          metodo_pago,
          monto,
          estado_pago,
          referencia_transaccion,
          referencia_reembolso,
          fecha_pago,
          fecha_reembolso,

          motivo_reembolso,
          fecha_creacion
        FROM TB_PAGO
        WHERE
          venta_id = ?
          AND estado_pago = 'PENDIENTE'
        LIMIT 1
        `,
        [ventaId]
      );


    if (rows.length === 0) {
      return null;
    }


    return this.mapearPago(
      rows[0]
    );
  }


  async crearPagoWeb(
    ventaId: number,
    metodoPago: MetodoPago,
    monto: number,
    referencia: string
  ): Promise<number> {

    const [resultado] =
      await pool.execute<ResultSetHeader>(
        `
        INSERT INTO TB_PAGO (
          venta_id,
          metodo_pago,
          monto,
          estado_pago,
          referencia_transaccion
        )
        VALUES (
          ?,
          ?,
          ?,
          'PENDIENTE',
          ?
        )
        `,
        [
          ventaId,
          metodoPago,
          monto,
          referencia
        ]
      );


    return resultado.insertId;
  }


  /*
  |--------------------------------------------------------------------------
  | Métodos para aprobación / rechazo
  |--------------------------------------------------------------------------
  */


  async obtenerPagoConBloqueo(
    connection: PoolConnection,
    pagoId: number
  ): Promise<PagoRow | null> {

    const [rows] =
      await connection.query<PagoRow[]>(
        `
        SELECT
          id_pago,
          venta_id,
          metodo_pago,
          monto,
          estado_pago,
          referencia_transaccion,
          referencia_reembolso,
          fecha_pago,
          fecha_reembolso,

          motivo_reembolso,
          fecha_creacion
        FROM TB_PAGO
        WHERE id_pago = ?
        LIMIT 1
        FOR UPDATE
        `,
        [pagoId]
      );


    return rows.length > 0
      ? rows[0]
      : null;
  }


  async obtenerVentaConBloqueo(
    connection: PoolConnection,
    ventaId: number
  ): Promise<VentaPagoRow | null> {

    const [rows] =
      await connection.query<VentaPagoRow[]>(
        `
        SELECT
          id_venta,
          cliente_id,
          canal_venta,
          estado,
          total
        FROM TB_VENTA
        WHERE id_venta = ?
        LIMIT 1
        FOR UPDATE
        `,
        [ventaId]
      );


    return rows.length > 0
      ? rows[0]
      : null;
  }


  async aprobarPago(
    connection: PoolConnection,
    pagoId: number
  ): Promise<void> {

    await connection.execute(
      `
      UPDATE TB_PAGO
      SET
        estado_pago = 'APROBADO',
        fecha_pago = CURRENT_TIMESTAMP
      WHERE id_pago = ?
      `,
      [pagoId]
    );
  }


  async rechazarPago(
    connection: PoolConnection,
    pagoId: number
  ): Promise<void> {

    await connection.execute(
      `
      UPDATE TB_PAGO
      SET
        estado_pago = 'RECHAZADO'
      WHERE id_pago = ?
      `,
      [pagoId]
    );
  }


  async marcarVentaPagada(
    connection: PoolConnection,
    ventaId: number
  ): Promise<void> {

    await connection.execute(
      `
      UPDATE TB_VENTA
      SET estado = 'PAGADA'
      WHERE id_venta = ?
      `,
      [ventaId]
    );
  }


  async registrarHistorialPago(
    connection: PoolConnection,
    ventaId: number,
    usuarioId: number
  ): Promise<void> {

    await connection.execute(
      `
      INSERT INTO TB_HISTORIAL_ESTADO_VENTA (
        venta_id,
        usuario_id,
        cliente_id,
        tipo_actor,
        estado_anterior,
        estado_nuevo,
        observacion
      )
      VALUES (
        ?,
        ?,
        NULL,
        'USUARIO',
        'PENDIENTE_PAGO',
        'PAGADA',
        'Pago aprobado por personal autorizado'
      )
      `,
      [
        ventaId,
        usuarioId
      ]
    );
  }


  private mapearPago(
  row: PagoRow
): Pago {

  return {
    id_pago:
      row.id_pago,

    venta_id:
      row.venta_id,

    metodo_pago:
      row.metodo_pago,

    monto:
      Number(row.monto),

    estado_pago:
      row.estado_pago,

    referencia_transaccion:
      row.referencia_transaccion,

    referencia_reembolso:
      row.referencia_reembolso,

    fecha_pago:
      row.fecha_pago,

    fecha_reembolso:
      row.fecha_reembolso,

    motivo_reembolso:
      row.motivo_reembolso,

    fecha_creacion:
      row.fecha_creacion
  };
}

async crearPagoTiendaAprobado(
  connection: PoolConnection,

  ventaId: number,

  metodoPago: MetodoPago,

  monto: number,

  referencia: string | null
): Promise<number> {

  const [resultado] =
    await connection.execute<ResultSetHeader>(
      `
      INSERT INTO TB_PAGO (
        venta_id,
        metodo_pago,
        monto,

        estado_pago,

        referencia_transaccion,

        fecha_pago
      )

      VALUES (
        ?,
        ?,
        ?,

        'APROBADO',

        ?,

        CURRENT_TIMESTAMP
      )
      `,
      [
        ventaId,
        metodoPago,
        monto,
        referencia
      ]
    );


  return resultado.insertId;
}

}
