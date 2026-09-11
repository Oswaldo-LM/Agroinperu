import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';

import {
  pool
} from '../config/database';


interface ClienteRow
  extends RowDataPacket {

  id_cliente: number;

  estado: string;
}


interface ProductoRow
  extends RowDataPacket {

  id_producto: number;

  codigo: string;

  nombre: string;

  unidad_medida:
    'UNIDAD'
    | 'METRO'
    | 'ROLLO'
    | 'CAJA';

  precio: string | number;

  estado: string;
}


interface ProformaEstadoRow
  extends RowDataPacket {

  id_proforma: number;

  estado:
    'VIGENTE'
    | 'VENCIDA'
    | 'ANULADA';
}


export class ProformaRepository {

  async actualizarVencidas():
    Promise<void> {

    await pool.execute(
      `
      UPDATE TB_PROFORMA

      SET estado = 'VENCIDA'

      WHERE estado = 'VIGENTE'
        AND fecha_vencimiento < CURDATE()
      `
    );
  }


  async obtenerClienteActivo(
    connection: PoolConnection,
    clienteId: number
  ): Promise<ClienteRow | null> {

    const [rows] =
      await connection.execute<ClienteRow[]>(
        `
        SELECT
          id_cliente,
          estado

        FROM TB_CLIENTE

        WHERE id_cliente = ?
          AND estado = 'ACTIVO'

        LIMIT 1
        `,
        [
          clienteId
        ]
      );


    return (
      rows[0] ??
      null
    );
  }


  async obtenerProductoActivo(
    connection: PoolConnection,
    productoId: number
  ): Promise<ProductoRow | null> {

    const [rows] =
      await connection.execute<ProductoRow[]>(
        `
        SELECT
          id_producto,
          codigo,
          nombre,
          unidad_medida,
          precio,
          estado

        FROM TB_PRODUCTO

        WHERE id_producto = ?
          AND estado = 'ACTIVO'

        LIMIT 1
        `,
        [
          productoId
        ]
      );


    return (
      rows[0] ??
      null
    );
  }


  async crearCabecera(
    connection: PoolConnection,
    datos: {

      numero_temporal: string;

      cliente_id: number;

      usuario_id: number;

      subtotal: number;

      igv: number;

      total: number;

      fecha_vencimiento: string;

      observacion:
        string | null;
    }
  ): Promise<number> {

    const [resultado] =
      await connection.execute<ResultSetHeader>(
        `
        INSERT INTO TB_PROFORMA (

          serie,
          numero,
          cliente_id,
          usuario_id,
          subtotal,
          igv,
          total,
          fecha_vencimiento,
          estado,
          observacion

        ) VALUES (

          'P001',
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          'VIGENTE',
          ?

        )
        `,
        [
          datos.numero_temporal,
          datos.cliente_id,
          datos.usuario_id,
          datos.subtotal,
          datos.igv,
          datos.total,
          datos.fecha_vencimiento,
          datos.observacion
        ]
      );


    return resultado.insertId;
  }


  async actualizarNumero(
    connection: PoolConnection,
    proformaId: number,
    numero: string
  ): Promise<void> {

    await connection.execute(
      `
      UPDATE TB_PROFORMA

      SET numero = ?

      WHERE id_proforma = ?
      `,
      [
        numero,
        proformaId
      ]
    );
  }


  async crearDetalle(
    connection: PoolConnection,
    datos: {

      proforma_id: number;

      producto_id: number;

      producto_nombre: string;

      unidad_medida:
        'UNIDAD'
        | 'METRO'
        | 'ROLLO'
        | 'CAJA';

      precio_unitario: number;

      cantidad: number;

      subtotal: number;
    }
  ): Promise<void> {

    await connection.execute(
      `
      INSERT INTO TB_DETALLE_PROFORMA (

        proforma_id,
        producto_id,
        producto_nombre,
        unidad_medida,
        precio_unitario,
        cantidad,
        subtotal

      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        datos.proforma_id,
        datos.producto_id,
        datos.producto_nombre,
        datos.unidad_medida,
        datos.precio_unitario,
        datos.cantidad,
        datos.subtotal
      ]
    );
  }


  async listar() {

    const [rows] =
      await pool.execute(
        `
        SELECT
          p.id_proforma,

          CONCAT(
            p.serie,
            '-',
            p.numero
          ) AS codigo_proforma,

          p.serie,
          p.numero,

          p.cliente_id,

          CASE

            WHEN c.tipo_cliente = 'EMPRESA'
              THEN c.razon_social

            ELSE
              TRIM(
                CONCAT_WS(
                  ' ',
                  c.nombres,
                  c.apellidos
                )
              )

          END AS cliente_nombre,

          p.usuario_id,

          u.nombre
            AS usuario_nombre,

          p.subtotal,
          p.igv,
          p.total,

          p.fecha_vencimiento,
          p.estado,
          p.observacion,
          p.fecha_creacion

        FROM TB_PROFORMA p

        INNER JOIN TB_CLIENTE c
          ON c.id_cliente =
             p.cliente_id

        INNER JOIN TB_USUARIO u
          ON u.id_usuario =
             p.usuario_id

        ORDER BY
          p.id_proforma DESC
        `
      );


    return rows;
  }


  async obtenerPorId(
    id: number
  ) {

    const [rows] =
      await pool.execute<RowDataPacket[]>(
        `
        SELECT
          p.id_proforma,

          CONCAT(
            p.serie,
            '-',
            p.numero
          ) AS codigo_proforma,

          p.serie,
          p.numero,

          p.cliente_id,

          c.tipo_cliente,
          c.tipo_documento,
          c.numero_documento,
          c.nombres,
          c.apellidos,
          c.razon_social,
          c.email,
          c.telefono,
          c.direccion,

          p.usuario_id,

          u.nombre
            AS usuario_nombre,

          p.subtotal,
          p.igv,
          p.total,

          p.fecha_vencimiento,
          p.estado,
          p.observacion,

          p.usuario_anulacion_id,
          p.fecha_anulacion,
          p.motivo_anulacion,

          p.fecha_creacion

        FROM TB_PROFORMA p

        INNER JOIN TB_CLIENTE c
          ON c.id_cliente =
             p.cliente_id

        INNER JOIN TB_USUARIO u
          ON u.id_usuario =
             p.usuario_id

        WHERE p.id_proforma = ?

        LIMIT 1
        `,
        [
          id
        ]
      );


    return (
      rows[0] ??
      null
    );
  }


  async listarDetalles(
    proformaId: number
  ) {

    const [rows] =
      await pool.execute(
        `
        SELECT
          id_detalle_proforma,
          producto_id,
          producto_nombre,
          unidad_medida,
          precio_unitario,
          cantidad,
          subtotal

        FROM TB_DETALLE_PROFORMA

        WHERE proforma_id = ?

        ORDER BY
          id_detalle_proforma
        `,
        [
          proformaId
        ]
      );


    return rows;
  }


  async obtenerEstado(
    connection: PoolConnection,
    proformaId: number
  ): Promise<ProformaEstadoRow | null> {

    const [rows] =
      await connection.execute<
        ProformaEstadoRow[]
      >(
        `
        SELECT
          id_proforma,
          estado

        FROM TB_PROFORMA

        WHERE id_proforma = ?

        FOR UPDATE
        `,
        [
          proformaId
        ]
      );


    return (
      rows[0] ??
      null
    );
  }


  async anular(
    connection: PoolConnection,
    proformaId: number,
    usuarioId: number,
    motivo: string
  ): Promise<void> {

    await connection.execute(
      `
      UPDATE TB_PROFORMA

      SET
        estado = 'ANULADA',

        usuario_anulacion_id = ?,

        fecha_anulacion =
          CURRENT_TIMESTAMP,

        motivo_anulacion = ?

      WHERE id_proforma = ?
      `,
      [
        usuarioId,
        motivo,
        proformaId
      ]
    );
  }
}