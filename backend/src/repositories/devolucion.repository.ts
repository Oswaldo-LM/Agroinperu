import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';

import {
  pool
} from '../config/database';


interface VentaRow
  extends RowDataPacket {

  id_venta: number;

  codigo_venta: string;

  estado: string;

  canal_venta:
    'WEB' | 'TIENDA';

  cliente_id:
    number | null;
}


interface DetalleVentaRow
  extends RowDataPacket {

  id_detalle_venta: number;

  venta_id: number;

  producto_id: number;

  producto_nombre: string;

  unidad_medida:
    'UNIDAD'
    | 'METRO'
    | 'ROLLO'
    | 'CAJA';

  precio_unitario:
    string | number;

  cantidad:
    string | number;

  cantidad_devuelta:
    string | number;
}


interface ProductoStockRow
  extends RowDataPacket {

  id_producto: number;

  stock_disponible:
    string | number;

  stock_reservado:
    string | number;
}


export class DevolucionRepository {

  async obtenerVentaConBloqueo(
    connection: PoolConnection,
    ventaId: number
  ): Promise<VentaRow | null> {

    const [rows] =
      await connection.execute<VentaRow[]>(
        `
        SELECT
          id_venta,
          codigo_venta,
          estado,
          canal_venta,
          cliente_id

        FROM TB_VENTA

        WHERE id_venta = ?

        FOR UPDATE
        `,
        [
          ventaId
        ]
      );


    return rows[0] ?? null;
  }


  async obtenerDetalleConDevuelto(
    connection: PoolConnection,
    ventaId: number,
    detalleVentaId: number
  ): Promise<DetalleVentaRow | null> {

    const [rows] =
      await connection.execute<
        DetalleVentaRow[]
      >(
        `
        SELECT
          dv.id_detalle_venta,
          dv.venta_id,
          dv.producto_id,
          dv.producto_nombre,
          dv.unidad_medida,
          dv.precio_unitario,
          dv.cantidad,

          COALESCE(
            SUM(dd.cantidad),
            0
          ) AS cantidad_devuelta

        FROM TB_DETALLE_VENTA dv

        LEFT JOIN TB_DETALLE_DEVOLUCION dd
          ON dd.detalle_venta_id =
             dv.id_detalle_venta

        WHERE dv.id_detalle_venta = ?
          AND dv.venta_id = ?

        GROUP BY
          dv.id_detalle_venta,
          dv.venta_id,
          dv.producto_id,
          dv.producto_nombre,
          dv.unidad_medida,
          dv.precio_unitario,
          dv.cantidad

        LIMIT 1
        `,
        [
          detalleVentaId,
          ventaId
        ]
      );


    return rows[0] ?? null;
  }


  async obtenerProductoConBloqueo(
    connection: PoolConnection,
    productoId: number
  ): Promise<ProductoStockRow | null> {

    const [rows] =
      await connection.execute<
        ProductoStockRow[]
      >(
        `
        SELECT
          id_producto,
          stock_disponible,
          stock_reservado

        FROM TB_PRODUCTO

        WHERE id_producto = ?

        FOR UPDATE
        `,
        [
          productoId
        ]
      );


    return rows[0] ?? null;
  }


  async crearCabecera(
    connection: PoolConnection,
    datos: {

      codigo_temporal: string;

      venta_id: number;

      usuario_id: number;

      motivo: string;

      subtotal: number;

      igv: number;

      total: number;
    }
  ): Promise<number> {

    const [resultado] =
      await connection.execute<ResultSetHeader>(
        `
        INSERT INTO TB_DEVOLUCION (

          codigo_devolucion,
          venta_id,
          usuario_id,
          motivo,
          subtotal,
          igv,
          total

        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          datos.codigo_temporal,
          datos.venta_id,
          datos.usuario_id,
          datos.motivo,
          datos.subtotal,
          datos.igv,
          datos.total
        ]
      );


    return resultado.insertId;
  }


  async actualizarCodigo(
    connection: PoolConnection,
    devolucionId: number,
    codigo: string
  ): Promise<void> {

    await connection.execute(
      `
      UPDATE TB_DEVOLUCION

      SET codigo_devolucion = ?

      WHERE id_devolucion = ?
      `,
      [
        codigo,
        devolucionId
      ]
    );
  }


  async crearDetalle(
    connection: PoolConnection,
    datos: {

      devolucion_id: number;

      detalle_venta_id: number;

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
      INSERT INTO TB_DETALLE_DEVOLUCION (

        devolucion_id,
        detalle_venta_id,
        producto_id,
        producto_nombre,
        unidad_medida,
        precio_unitario,
        cantidad,
        subtotal

      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        datos.devolucion_id,
        datos.detalle_venta_id,
        datos.producto_id,
        datos.producto_nombre,
        datos.unidad_medida,
        datos.precio_unitario,
        datos.cantidad,
        datos.subtotal
      ]
    );
  }


  async actualizarStockDisponible(
    connection: PoolConnection,
    productoId: number,
    nuevoStockDisponible: number
  ): Promise<void> {

    await connection.execute(
      `
      UPDATE TB_PRODUCTO

      SET stock_disponible = ?

      WHERE id_producto = ?
      `,
      [
        nuevoStockDisponible,
        productoId
      ]
    );
  }


  async registrarMovimientoStock(
    connection: PoolConnection,
    datos: {

      producto_id: number;

      venta_id: number;

      usuario_id: number;

      cantidad: number;

      disponible_anterior: number;

      disponible_nuevo: number;

      reservado_anterior: number;

      reservado_nuevo: number;

      motivo: string;
    }
  ): Promise<void> {

    await connection.execute(
      `
      INSERT INTO TB_MOVIMIENTO_STOCK (

        producto_id,
        venta_id,
        usuario_id,
        tipo_movimiento,
        cantidad,

        stock_disponible_anterior,
        stock_disponible_nuevo,

        stock_reservado_anterior,
        stock_reservado_nuevo,

        motivo

      ) VALUES (

        ?,
        ?,
        ?,
        'DEVOLUCION',
        ?,
        ?,
        ?,
        ?,
        ?,
        ?

      )
      `,
      [
        datos.producto_id,
        datos.venta_id,
        datos.usuario_id,
        datos.cantidad,

        datos.disponible_anterior,
        datos.disponible_nuevo,

        datos.reservado_anterior,
        datos.reservado_nuevo,

        datos.motivo
      ]
    );
  }


  async listar() {

    const [rows] =
      await pool.execute(
        `
        SELECT
          d.id_devolucion,
          d.codigo_devolucion,

          d.venta_id,
          v.codigo_venta,

          d.usuario_id,
          u.nombre
            AS usuario_nombre,

          d.motivo,
          d.subtotal,
          d.igv,
          d.total,
          d.fecha_creacion

        FROM TB_DEVOLUCION d

        INNER JOIN TB_VENTA v
          ON v.id_venta =
             d.venta_id

        INNER JOIN TB_USUARIO u
          ON u.id_usuario =
             d.usuario_id

        ORDER BY
          d.id_devolucion DESC
        `
      );


    return rows;
  }


  async obtenerPorId(
    devolucionId: number
  ) {

    const [rows] =
      await pool.execute<RowDataPacket[]>(
        `
        SELECT
          d.id_devolucion,
          d.codigo_devolucion,

          d.venta_id,
          v.codigo_venta,
          v.canal_venta,

          d.usuario_id,
          u.nombre
            AS usuario_nombre,

          d.motivo,
          d.subtotal,
          d.igv,
          d.total,
          d.fecha_creacion

        FROM TB_DEVOLUCION d

        INNER JOIN TB_VENTA v
          ON v.id_venta =
             d.venta_id

        INNER JOIN TB_USUARIO u
          ON u.id_usuario =
             d.usuario_id

        WHERE d.id_devolucion = ?

        LIMIT 1
        `,
        [
          devolucionId
        ]
      );


    return rows[0] ?? null;
  }


  async listarDetalles(
    devolucionId: number
  ) {

    const [rows] =
      await pool.execute(
        `
        SELECT
          id_detalle_devolucion,
          detalle_venta_id,
          producto_id,
          producto_nombre,
          unidad_medida,
          precio_unitario,
          cantidad,
          subtotal

        FROM TB_DETALLE_DEVOLUCION

        WHERE devolucion_id = ?

        ORDER BY
          id_detalle_devolucion
        `,
        [
          devolucionId
        ]
      );


    return rows;
  }


  async listarDetallesDisponiblesVenta(
    ventaId: number
  ) {

    const [rows] =
      await pool.execute(
        `
        SELECT
          dv.id_detalle_venta,

          dv.producto_id,
          dv.producto_nombre,
          dv.unidad_medida,
          dv.precio_unitario,

          dv.cantidad
            AS cantidad_vendida,

          COALESCE(
            SUM(dd.cantidad),
            0
          ) AS cantidad_devuelta,

          (
            dv.cantidad -
            COALESCE(
              SUM(dd.cantidad),
              0
            )
          ) AS cantidad_disponible_devolucion

        FROM TB_DETALLE_VENTA dv

        INNER JOIN TB_VENTA v
          ON v.id_venta =
             dv.venta_id

        LEFT JOIN TB_DETALLE_DEVOLUCION dd
          ON dd.detalle_venta_id =
             dv.id_detalle_venta

        WHERE dv.venta_id = ?
          AND v.estado = 'ENTREGADA'

        GROUP BY
          dv.id_detalle_venta,
          dv.producto_id,
          dv.producto_nombre,
          dv.unidad_medida,
          dv.precio_unitario,
          dv.cantidad

        ORDER BY
          dv.id_detalle_venta
        `,
        [
          ventaId
        ]
      );


    return rows;
  }

  async listarVentasEntregadas(
  buscar = ''
) {

  const termino =
    buscar.trim();


  if (termino) {

    const patron =
      `%${termino}%`;


    const [rows] =
      await pool.execute(
        `
        SELECT
          v.id_venta,
          v.codigo_venta,
          v.canal_venta,
          v.cliente_id,

          CASE

            WHEN v.cliente_id IS NULL
              THEN 'Cliente general'

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

          v.total,
          v.fecha_creacion

        FROM TB_VENTA v

        LEFT JOIN TB_CLIENTE c
          ON c.id_cliente =
             v.cliente_id

        WHERE v.estado = 'ENTREGADA'

          AND (
            CAST(
              v.id_venta AS CHAR
            ) LIKE ?

            OR v.codigo_venta LIKE ?

            OR c.numero_documento LIKE ?

            OR c.nombres LIKE ?

            OR c.apellidos LIKE ?

            OR c.razon_social LIKE ?
          )

        ORDER BY
          v.fecha_creacion DESC,
          v.id_venta DESC
        `,
        [
          patron,
          patron,
          patron,
          patron,
          patron,
          patron
        ]
      );


    return rows;
  }


  const [rows] =
    await pool.execute(
      `
      SELECT
        v.id_venta,
        v.codigo_venta,
        v.canal_venta,
        v.cliente_id,

        CASE

          WHEN v.cliente_id IS NULL
            THEN 'Cliente general'

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

        v.total,
        v.fecha_creacion

      FROM TB_VENTA v

      LEFT JOIN TB_CLIENTE c
        ON c.id_cliente =
           v.cliente_id

      WHERE v.estado = 'ENTREGADA'

      ORDER BY
        v.fecha_creacion DESC,
        v.id_venta DESC
      `
    );


  return rows;
}
}