import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';

import {
  pool
} from '../config/database';

import {
  Comprobante,
  EstadoComprobante,
  TipoComprobante
} from '../models/comprobante.model';

import {
  EstadoVenta
} from '../models/venta.model';


/*
|--------------------------------------------------------------------------
| Venta utilizada para emitir comprobante
|--------------------------------------------------------------------------
*/

export interface VentaComprobanteRow
  extends RowDataPacket {

  id_venta: number;

  cliente_id:
    number | null;

  estado:
    EstadoVenta;

  subtotal:
    string | number;

  igv:
    string | number;

  total:
    string | number;

  tipo_cliente:
    'PERSONA' | 'EMPRESA' | null;

  tipo_documento:
    string | null;

  numero_documento:
    string | null;

  nombres:
    string | null;

  apellidos:
    string | null;

  razon_social:
    string | null;

  direccion:
    string | null;
}


/*
|--------------------------------------------------------------------------
| Fila de comprobante
|--------------------------------------------------------------------------
*/

export interface ComprobanteRow
  extends RowDataPacket {

  id_comprobante: number;

  venta_id: number;

  usuario_id:
    number | null;

  usuario_anulacion_id:
    number | null;

  tipo_comprobante:
    TipoComprobante;

  serie: string;

  numero: string;

  tipo_documento_cliente:
    string | null;

  documento_cliente:
    string | null;

  nombre_cliente:
    string | null;

  direccion_cliente:
    string | null;

  subtotal:
    string | number;

  igv:
    string | number;

  total:
    string | number;

  estado:
    EstadoComprobante;

  fecha_emision:
    Date;

  fecha_anulacion:
    Date | null;

  motivo_anulacion:
    string | null;
}

export class ComprobanteRepository {


  /*
  |--------------------------------------------------------------------------
  | Obtener venta y bloquearla
  |--------------------------------------------------------------------------
  */

  async obtenerVentaConBloqueo(
    connection: PoolConnection,
    ventaId: number
  ): Promise<VentaComprobanteRow | null> {

    const [rows] =
      await connection.query<
        VentaComprobanteRow[]
      >(
        `
        SELECT
          v.id_venta,
          v.cliente_id,
          v.estado,

          v.subtotal,
          v.igv,
          v.total,

          c.tipo_cliente,
          c.tipo_documento,
          c.numero_documento,

          c.nombres,
          c.apellidos,
          c.razon_social,

          c.direccion

        FROM TB_VENTA v

        LEFT JOIN TB_CLIENTE c
          ON c.id_cliente =
             v.cliente_id

        WHERE v.id_venta = ?

        LIMIT 1

        FOR UPDATE
        `,
        [ventaId]
      );


    return rows.length > 0
      ? rows[0]
      : null;
  }


  /*
  |--------------------------------------------------------------------------
  | Buscar comprobante actualmente emitido
  |--------------------------------------------------------------------------
  */

  async obtenerComprobanteEmitidoVenta(
    connection: PoolConnection,
    ventaId: number
  ): Promise<ComprobanteRow | null> {

    const [rows] =
      await connection.query<
        ComprobanteRow[]
      >(
        `
        SELECT
          id_comprobante,
          venta_id,

          usuario_id,
          usuario_anulacion_id,

          tipo_comprobante,

          serie,
          numero,

          tipo_documento_cliente,
          documento_cliente,
          nombre_cliente,
          direccion_cliente,

          subtotal,
          igv,
          total,

          estado,

          fecha_emision,
          fecha_anulacion,
          motivo_anulacion

        FROM TB_COMPROBANTE

        WHERE
          venta_id = ?
          AND estado = 'EMITIDO'

        LIMIT 1

        FOR UPDATE
        `,
        [ventaId]
      );


    return rows.length > 0
      ? rows[0]
      : null;
  }


  /*
  |--------------------------------------------------------------------------
  | Crear comprobante con número temporal
  |--------------------------------------------------------------------------
  */

  async crear(
    connection: PoolConnection,

    ventaId: number,

    usuarioId: number,

    tipoComprobante: TipoComprobante,

    serie: string,

    numeroTemporal: string,

    tipoDocumentoCliente:
      string | null,

    documentoCliente:
      string | null,

    nombreCliente:
      string | null,

    direccionCliente:
      string | null,

    subtotal: number,

    igv: number,

    total: number
  ): Promise<number> {

    const [resultado] =
      await connection.execute<
        ResultSetHeader
      >(
        `
        INSERT INTO TB_COMPROBANTE (
          venta_id,
          usuario_id,

          tipo_comprobante,

          serie,
          numero,

          tipo_documento_cliente,
          documento_cliente,
          nombre_cliente,
          direccion_cliente,

          subtotal,
          igv,
          total,

          estado
        )

        VALUES (
          ?,
          ?,

          ?,

          ?,
          ?,

          ?,
          ?,
          ?,
          ?,

          ?,
          ?,
          ?,

          'EMITIDO'
        )
        `,
        [
          ventaId,
          usuarioId,

          tipoComprobante,

          serie,
          numeroTemporal,

          tipoDocumentoCliente,
          documentoCliente,
          nombreCliente,
          direccionCliente,

          subtotal,
          igv,
          total
        ]
      );


    return resultado.insertId;
  }


  /*
  |--------------------------------------------------------------------------
  | Colocar número definitivo
  |--------------------------------------------------------------------------
  */

  async actualizarNumero(
    connection: PoolConnection,

    comprobanteId: number,

    numero: string
  ): Promise<void> {

    await connection.execute(
      `
      UPDATE TB_COMPROBANTE

      SET numero = ?

      WHERE id_comprobante = ?
      `,
      [
        numero,
        comprobanteId
      ]
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Obtener comprobante
  |--------------------------------------------------------------------------
  */

  async obtenerPorId(
    id: number
  ): Promise<Comprobante | null> {

    const [rows] =
      await pool.query<
        ComprobanteRow[]
      >(
        `
        SELECT
          id_comprobante,
          venta_id,

          usuario_id,
          usuario_anulacion_id,

          tipo_comprobante,

          serie,
          numero,

          tipo_documento_cliente,
          documento_cliente,
          nombre_cliente,
          direccion_cliente,

          subtotal,
          igv,
          total,

          estado,

          fecha_emision,
          fecha_anulacion,
          motivo_anulacion

        FROM TB_COMPROBANTE

        WHERE id_comprobante = ?

        LIMIT 1
        `,
        [id]
      );


    if (rows.length === 0) {
      return null;
    }


    return this.mapearComprobante(
      rows[0]
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Listar comprobantes de una venta
  |--------------------------------------------------------------------------
  */

  async obtenerPorVenta(
    ventaId: number
  ): Promise<Comprobante[]> {

    const [rows] =
      await pool.query<
        ComprobanteRow[]
      >(
        `
        SELECT
          id_comprobante,
          venta_id,

          usuario_id,
          usuario_anulacion_id,

          tipo_comprobante,

          serie,
          numero,

          tipo_documento_cliente,
          documento_cliente,
          nombre_cliente,
          direccion_cliente,

          subtotal,
          igv,
          total,

          estado,

          fecha_emision,
          fecha_anulacion,
          motivo_anulacion

        FROM TB_COMPROBANTE

        WHERE venta_id = ?

        ORDER BY fecha_emision DESC
        `,
        [ventaId]
      );


    return rows.map(
      row =>
        this.mapearComprobante(row)
    );
  }


private mapearComprobante(
  row: ComprobanteRow
): Comprobante {

  return {

    id_comprobante:
      row.id_comprobante,

    venta_id:
      row.venta_id,

    usuario_id:
      row.usuario_id,

    usuario_anulacion_id:
      row.usuario_anulacion_id,

    tipo_comprobante:
      row.tipo_comprobante,

    serie:
      row.serie,

    numero:
      row.numero,

    tipo_documento_cliente:
      row.tipo_documento_cliente,

    documento_cliente:
      row.documento_cliente,

    nombre_cliente:
      row.nombre_cliente,

    direccion_cliente:
      row.direccion_cliente,

    subtotal:
      Number(row.subtotal),

    igv:
      Number(row.igv),

    total:
      Number(row.total),

    estado:
      row.estado,

    fecha_emision:
      row.fecha_emision,

    fecha_anulacion:
      row.fecha_anulacion,

    motivo_anulacion:
      row.motivo_anulacion
  };
}

async obtenerConBloqueo(
  connection: PoolConnection,
  comprobanteId: number
): Promise<ComprobanteRow | null> {

  const [rows] =
    await connection.query<
      ComprobanteRow[]
    >(
      `
      SELECT
        id_comprobante,
          venta_id,

          usuario_id,
          usuario_anulacion_id,

          tipo_comprobante,

          serie,
          numero,

          tipo_documento_cliente,
          documento_cliente,
          nombre_cliente,
          direccion_cliente,

          subtotal,
          igv,
          total,

          estado,

          fecha_emision,
          fecha_anulacion,
          motivo_anulacion

      FROM TB_COMPROBANTE

      WHERE id_comprobante = ?

      LIMIT 1

      FOR UPDATE
      `,
      [comprobanteId]
    );


  return rows.length > 0
    ? rows[0]
    : null;
}

async anular(
  connection: PoolConnection,

  comprobanteId: number,

  usuarioId: number,

  motivo: string
): Promise<void> {

  await connection.execute(
    `
    UPDATE TB_COMPROBANTE

    SET
      estado = 'ANULADO',

      usuario_anulacion_id = ?,

      fecha_anulacion =
        CURRENT_TIMESTAMP,

      motivo_anulacion = ?

    WHERE id_comprobante = ?
    `,
    [
      usuarioId,
      motivo,
      comprobanteId
    ]
  );
}

async anularEmitidosPorVenta(
  connection: PoolConnection,

  ventaId: number,

  usuarioId: number,

  motivo: string
): Promise<void> {

  await connection.execute(
    `
    UPDATE TB_COMPROBANTE

    SET
      estado = 'ANULADO',

      usuario_anulacion_id = ?,

      fecha_anulacion =
        CURRENT_TIMESTAMP,

      motivo_anulacion = ?

    WHERE
      venta_id = ?
      AND estado = 'EMITIDO'
    `,
    [
      usuarioId,
      motivo,
      ventaId
    ]
  );
}





}