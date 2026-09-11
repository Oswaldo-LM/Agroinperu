import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';

import {
  pool
} from '../config/database';


export interface CajaSesionRow
  extends RowDataPacket {

  id_caja_sesion: number;

  usuario_id: number;

  monto_apertura:
    string | number;

  fecha_apertura: Date;

  estado:
    'ABIERTA'
    | 'CERRADA';

  fecha_cierre:
    Date | null;

  cantidad_ventas:
    number | null;

  total_ventas:
    string | number | null;

  total_efectivo:
    string | number | null;

  total_tarjeta:
    string | number | null;

  total_yape:
    string | number | null;

  total_plin:
    string | number | null;

  total_transferencia:
    string | number | null;

  efectivo_esperado:
    string | number | null;

  efectivo_declarado:
    string | number | null;

  diferencia:
    string | number | null;

  observacion_cierre:
    string | null;
}


interface ResumenCajaRow
  extends RowDataPacket {

  cantidad_ventas:
    string | number;

  total_ventas:
    string | number;

  total_efectivo:
    string | number;

  total_tarjeta:
    string | number;

  total_yape:
    string | number;

  total_plin:
    string | number;

  total_transferencia:
    string | number;
}


export class CajaRepository {

  async obtenerCajaAbierta(
    usuarioId: number
  ): Promise<CajaSesionRow | null> {

    const [rows] =
      await pool.execute<
        CajaSesionRow[]
      >(
        `
        SELECT *

        FROM TB_CAJA_SESION

        WHERE usuario_id = ?
          AND estado = 'ABIERTA'

        ORDER BY
          id_caja_sesion DESC

        LIMIT 1
        `,
        [
          usuarioId
        ]
      );


    return rows[0] ?? null;
  }


  async obtenerCajaAbiertaConBloqueo(
    connection: PoolConnection,
    usuarioId: number
  ): Promise<CajaSesionRow | null> {

    const [rows] =
      await connection.execute<
        CajaSesionRow[]
      >(
        `
        SELECT *

        FROM TB_CAJA_SESION

        WHERE usuario_id = ?
          AND estado = 'ABIERTA'

        ORDER BY
          id_caja_sesion DESC

        LIMIT 1

        FOR UPDATE
        `,
        [
          usuarioId
        ]
      );


    return rows[0] ?? null;
  }


  async crear(
    connection: PoolConnection,
    usuarioId: number,
    montoApertura: number
  ): Promise<number> {

    const [resultado] =
      await connection.execute<
        ResultSetHeader
      >(
        `
        INSERT INTO TB_CAJA_SESION (

          usuario_id,
          monto_apertura,
          estado

        ) VALUES (?, ?, 'ABIERTA')
        `,
        [
          usuarioId,
          montoApertura
        ]
      );


    return resultado.insertId;
  }


  async obtenerPorId(
    id: number
  ) {

    const [rows] =
      await pool.execute<
        RowDataPacket[]
      >(
        `
        SELECT
          cs.*,

          u.nombre
            AS usuario_nombre,

          u.email
            AS usuario_email

        FROM TB_CAJA_SESION cs

        INNER JOIN TB_USUARIO u
          ON u.id_usuario =
             cs.usuario_id

        WHERE cs.id_caja_sesion = ?

        LIMIT 1
        `,
        [
          id
        ]
      );


    return rows[0] ?? null;
  }


  async calcularResumen(
    connection: PoolConnection,
    usuarioId: number,
    fechaApertura: Date
  ): Promise<ResumenCajaRow> {

    const [rows] =
      await connection.execute<
        ResumenCajaRow[]
      >(
        `
        SELECT

          COUNT(
            DISTINCT v.id_venta
          ) AS cantidad_ventas,

          COALESCE(
            SUM(
              CASE
                WHEN p.id_pago IS NOT NULL
                  THEN p.monto
                ELSE 0
              END
            ),
            0
          ) AS total_ventas,

          COALESCE(
            SUM(
              CASE
                WHEN p.metodo_pago = 'EFECTIVO'
                  THEN p.monto
                ELSE 0
              END
            ),
            0
          ) AS total_efectivo,

          COALESCE(
            SUM(
              CASE
                WHEN p.metodo_pago = 'TARJETA'
                  THEN p.monto
                ELSE 0
              END
            ),
            0
          ) AS total_tarjeta,

          COALESCE(
            SUM(
              CASE
                WHEN p.metodo_pago = 'YAPE'
                  THEN p.monto
                ELSE 0
              END
            ),
            0
          ) AS total_yape,

          COALESCE(
            SUM(
              CASE
                WHEN p.metodo_pago = 'PLIN'
                  THEN p.monto
                ELSE 0
              END
            ),
            0
          ) AS total_plin,

          COALESCE(
            SUM(
              CASE
                WHEN p.metodo_pago = 'TRANSFERENCIA'
                  THEN p.monto
                ELSE 0
              END
            ),
            0
          ) AS total_transferencia

        FROM TB_VENTA v

        LEFT JOIN TB_PAGO p
          ON p.venta_id =
             v.id_venta

          AND p.estado_pago =
              'APROBADO'

        WHERE v.usuario_id = ?

          AND v.canal_venta =
              'TIENDA'

          AND v.estado =
              'ENTREGADA'

          AND v.fecha_creacion >= ?
        `,
        [
          usuarioId,
          fechaApertura
        ]
      );


    return rows[0];
  }


  async cerrar(
    connection: PoolConnection,
    cajaId: number,
    datos: {

      cantidad_ventas: number;

      total_ventas: number;

      total_efectivo: number;

      total_tarjeta: number;

      total_yape: number;

      total_plin: number;

      total_transferencia: number;

      efectivo_esperado: number;

      efectivo_declarado: number;

      diferencia: number;

      observacion:
        string | null;
    }
  ): Promise<void> {

    await connection.execute(
      `
      UPDATE TB_CAJA_SESION

      SET
        estado = 'CERRADA',

        fecha_cierre =
          CURRENT_TIMESTAMP,

        cantidad_ventas = ?,

        total_ventas = ?,

        total_efectivo = ?,

        total_tarjeta = ?,

        total_yape = ?,

        total_plin = ?,

        total_transferencia = ?,

        efectivo_esperado = ?,

        efectivo_declarado = ?,

        diferencia = ?,

        observacion_cierre = ?

      WHERE id_caja_sesion = ?
        AND estado = 'ABIERTA'
      `,
      [
        datos.cantidad_ventas,

        datos.total_ventas,

        datos.total_efectivo,

        datos.total_tarjeta,

        datos.total_yape,

        datos.total_plin,

        datos.total_transferencia,

        datos.efectivo_esperado,

        datos.efectivo_declarado,

        datos.diferencia,

        datos.observacion,

        cajaId
      ]
    );
  }


  async listarHistorialUsuario(
    usuarioId: number
  ) {

    const [rows] =
      await pool.execute(
        `
        SELECT
          id_caja_sesion,

          usuario_id,

          monto_apertura,

          fecha_apertura,

          estado,

          fecha_cierre,

          cantidad_ventas,

          total_ventas,

          total_efectivo,

          total_tarjeta,

          total_yape,

          total_plin,

          total_transferencia,

          efectivo_esperado,

          efectivo_declarado,

          diferencia,

          observacion_cierre

        FROM TB_CAJA_SESION

        WHERE usuario_id = ?

        ORDER BY
          id_caja_sesion DESC
        `,
        [
          usuarioId
        ]
      );


    return rows;
  }


  async listarHistorialGeneral() {

    const [rows] =
      await pool.execute(
        `
        SELECT
          cs.id_caja_sesion,

          cs.usuario_id,

          u.nombre
            AS usuario_nombre,

          u.rol,

          cs.monto_apertura,

          cs.fecha_apertura,

          cs.estado,

          cs.fecha_cierre,

          cs.cantidad_ventas,

          cs.total_ventas,

          cs.total_efectivo,

          cs.total_tarjeta,

          cs.total_yape,

          cs.total_plin,

          cs.total_transferencia,

          cs.efectivo_esperado,

          cs.efectivo_declarado,

          cs.diferencia,

          cs.observacion_cierre

        FROM TB_CAJA_SESION cs

        INNER JOIN TB_USUARIO u
          ON u.id_usuario =
             cs.usuario_id

        ORDER BY
          cs.id_caja_sesion DESC
        `
      );


    return rows;
  }
}