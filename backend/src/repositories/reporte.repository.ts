import {
  RowDataPacket
} from 'mysql2/promise';

import {
  pool
} from '../config/database';

import {
  ReporteMetodoPago,
  ReporteProductoVendido,
  ReporteResumenVentas,
  ReporteVentaCanal,
  ReporteVentaDetalle
} from '../models/reporte.model';

import {
  EstadoVenta
} from '../models/venta.model';


/*
|--------------------------------------------------------------------------
| Interfaces internas de MySQL
|--------------------------------------------------------------------------
*/

interface ResumenVentasRow
  extends RowDataPacket {

  cantidad_ventas:
    string | number;

  subtotal:
    string | number;

  igv:
    string | number;

  total_vendido:
    string | number;
}


interface VentaCanalRow
  extends RowDataPacket {

  canal_venta:
    'WEB' | 'TIENDA';

  cantidad_ventas:
    string | number;

  total_vendido:
    string | number;
}


interface ProductoVendidoRow
  extends RowDataPacket {

  producto_id: number;

  codigo: string;

  nombre: string;

  unidad_medida: string;

  cantidad_vendida:
    string | number;

  monto_vendido:
    string | number;
}


interface MetodoPagoRow
  extends RowDataPacket {

  metodo_pago:
    | 'EFECTIVO'
    | 'TARJETA'
    | 'YAPE'
    | 'PLIN'
    | 'TRANSFERENCIA';

  cantidad_pagos:
    string | number;

  monto_total:
    string | number;
}


interface VentaDetalleRow
  extends RowDataPacket {

  id_venta: number;

  codigo_venta: string;

  canal_venta:
    'WEB' | 'TIENDA';

  estado:
    EstadoVenta;

  cliente_nombre:
    string | null;

  usuario_nombre:
    string | null;

  subtotal:
    string | number;

  igv:
    string | number;

  total:
    string | number;

  fecha_creacion:
    Date;
}


export class ReporteRepository {


  /*
  |--------------------------------------------------------------------------
  | Resumen general
  |--------------------------------------------------------------------------
  */

  async obtenerResumenVentas(
    desde: string,
    hasta: string
  ): Promise<ReporteResumenVentas> {

    const [rows] =
      await pool.query<
        ResumenVentasRow[]
      >(
        `
        SELECT

          COUNT(*) AS cantidad_ventas,

          COALESCE(
            SUM(subtotal),
            0
          ) AS subtotal,

          COALESCE(
            SUM(igv),
            0
          ) AS igv,

          COALESCE(
            SUM(total),
            0
          ) AS total_vendido

        FROM TB_VENTA

        WHERE
          fecha_creacion >= ?

          AND fecha_creacion <
            DATE_ADD(
              ?,
              INTERVAL 1 DAY
            )

          AND estado IN (
            'PAGADA',
            'EN_PREPARACION',
            'LISTA_PARA_RECOGER',
            'ENTREGADA'
          )
        `,
        [
          desde,
          hasta
        ]
      );


    const row =
      rows[0];


    return {

      desde,

      hasta,

      cantidad_ventas:
        Number(
          row.cantidad_ventas ?? 0
        ),

      subtotal:
        Number(
          row.subtotal ?? 0
        ),

      igv:
        Number(
          row.igv ?? 0
        ),

      total_vendido:
        Number(
          row.total_vendido ?? 0
        )
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Ventas WEB vs TIENDA
  |--------------------------------------------------------------------------
  */

  async obtenerVentasPorCanal(
    desde: string,
    hasta: string
  ): Promise<ReporteVentaCanal[]> {

    const [rows] =
      await pool.query<
        VentaCanalRow[]
      >(
        `
        SELECT

          canal_venta,

          COUNT(*) AS cantidad_ventas,

          COALESCE(
            SUM(total),
            0
          ) AS total_vendido

        FROM TB_VENTA

        WHERE
          fecha_creacion >= ?

          AND fecha_creacion <
            DATE_ADD(
              ?,
              INTERVAL 1 DAY
            )

          AND estado IN (
            'PAGADA',
            'EN_PREPARACION',
            'LISTA_PARA_RECOGER',
            'ENTREGADA'
          )

        GROUP BY
          canal_venta

        ORDER BY
          canal_venta
        `,
        [
          desde,
          hasta
        ]
      );


    return rows.map(
      row => ({

        canal_venta:
          row.canal_venta,

        cantidad_ventas:
          Number(
            row.cantidad_ventas
          ),

        total_vendido:
          Number(
            row.total_vendido
          )
      })
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Productos más vendidos
  |--------------------------------------------------------------------------
  */

  async obtenerProductosMasVendidos(
    desde: string,
    hasta: string
  ): Promise<ReporteProductoVendido[]> {

    const [rows] =
      await pool.query<
        ProductoVendidoRow[]
      >(
        `
        SELECT

          dv.producto_id,

          p.codigo,

          dv.producto_nombre
            AS nombre,

          dv.unidad_medida,

          SUM(
            dv.cantidad
          ) AS cantidad_vendida,

          SUM(
            dv.subtotal
          ) AS monto_vendido

        FROM TB_DETALLE_VENTA dv

        INNER JOIN TB_VENTA v
          ON v.id_venta =
             dv.venta_id

        INNER JOIN TB_PRODUCTO p
          ON p.id_producto =
             dv.producto_id

        WHERE
          v.fecha_creacion >= ?

          AND v.fecha_creacion <
            DATE_ADD(
              ?,
              INTERVAL 1 DAY
            )

          AND v.estado IN (
            'PAGADA',
            'EN_PREPARACION',
            'LISTA_PARA_RECOGER',
            'ENTREGADA'
          )

        GROUP BY
          dv.producto_id,
          p.codigo,
          dv.producto_nombre,
          dv.unidad_medida

        ORDER BY
          cantidad_vendida DESC,
          monto_vendido DESC

        LIMIT 10
        `,
        [
          desde,
          hasta
        ]
      );


    return rows.map(
      row => ({

        producto_id:
          row.producto_id,

        codigo:
          row.codigo,

        nombre:
          row.nombre,

        unidad_medida:
          row.unidad_medida,

        cantidad_vendida:
          Number(
            row.cantidad_vendida
          ),

        monto_vendido:
          Number(
            row.monto_vendido
          )
      })
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Métodos de pago utilizados
  |--------------------------------------------------------------------------
  |
  | Solo contamos pagos actualmente APROBADOS.
  | Los REEMBOLSADOS no cuentan como ingreso.
  |--------------------------------------------------------------------------
  */

  async obtenerMetodosPago(
    desde: string,
    hasta: string
  ): Promise<ReporteMetodoPago[]> {

    const [rows] =
      await pool.query<
        MetodoPagoRow[]
      >(
        `
        SELECT

          p.metodo_pago,

          COUNT(*) AS cantidad_pagos,

          COALESCE(
            SUM(p.monto),
            0
          ) AS monto_total

        FROM TB_PAGO p

        INNER JOIN TB_VENTA v
          ON v.id_venta =
             p.venta_id

        WHERE
          v.fecha_creacion >= ?

          AND v.fecha_creacion <
            DATE_ADD(
              ?,
              INTERVAL 1 DAY
            )

          AND p.estado_pago =
            'APROBADO'

          AND v.estado IN (
            'PAGADA',
            'EN_PREPARACION',
            'LISTA_PARA_RECOGER',
            'ENTREGADA'
          )

        GROUP BY
          p.metodo_pago

        ORDER BY
          monto_total DESC
        `,
        [
          desde,
          hasta
        ]
      );


    return rows.map(
      row => ({

        metodo_pago:
          row.metodo_pago,

        cantidad_pagos:
          Number(
            row.cantidad_pagos
          ),

        monto_total:
          Number(
            row.monto_total
          )
      })
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Detalle de ventas
  |--------------------------------------------------------------------------
  */

  async obtenerVentas(
    desde: string,
    hasta: string
  ): Promise<ReporteVentaDetalle[]> {

    const [rows] =
      await pool.query<
        VentaDetalleRow[]
      >(
        `
        SELECT

          v.id_venta,

          v.codigo_venta,

          v.canal_venta,

          v.estado,


          CASE

            WHEN c.tipo_cliente =
              'EMPRESA'

            THEN c.razon_social


            WHEN c.id_cliente
              IS NOT NULL

            THEN CONCAT_WS(
              ' ',
              c.nombres,
              c.apellidos
            )


            ELSE NULL

          END AS cliente_nombre,


          u.nombre
            AS usuario_nombre,


          v.subtotal,

          v.igv,

          v.total,

          v.fecha_creacion


        FROM TB_VENTA v


        LEFT JOIN TB_CLIENTE c
          ON c.id_cliente =
             v.cliente_id


        LEFT JOIN TB_USUARIO u
          ON u.id_usuario =
             v.usuario_id


        WHERE
          v.fecha_creacion >= ?

          AND v.fecha_creacion <
            DATE_ADD(
              ?,
              INTERVAL 1 DAY
            )

          AND v.estado IN (
            'PAGADA',
            'EN_PREPARACION',
            'LISTA_PARA_RECOGER',
            'ENTREGADA'
          )


        ORDER BY
          v.fecha_creacion DESC,
          v.id_venta DESC
        `,
        [
          desde,
          hasta
        ]
      );


    return rows.map(
      row => ({

        id_venta:
          row.id_venta,

        codigo_venta:
          row.codigo_venta,

        canal_venta:
          row.canal_venta,

        estado:
          row.estado,

        cliente_nombre:
          row.cliente_nombre,

        usuario_nombre:
          row.usuario_nombre,

        subtotal:
          Number(
            row.subtotal
          ),

        igv:
          Number(
            row.igv
          ),

        total:
          Number(
            row.total
          ),

        fecha_creacion:
          row.fecha_creacion
      })
    );
  }
}