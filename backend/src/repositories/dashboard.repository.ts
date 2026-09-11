import {
  RowDataPacket
} from 'mysql2/promise';

import {
  pool
} from '../config/database';

import {
  ProductoBajoStock,
  ResumenPagosDia,
  ResumenPedidosWeb,
  ResumenVentasDia,
  UltimaVenta
} from '../models/dashboard.model';

import {
  EstadoVenta
} from '../models/venta.model';


/*
|--------------------------------------------------------------------------
| Filas internas MySQL
|--------------------------------------------------------------------------
*/

interface ResumenVentasRow
  extends RowDataPacket {

  fecha: string;

  cantidad_ventas:
    string | number;

  total_vendido:
    string | number;

  ventas_web:
    string | number;

  total_web:
    string | number;

  ventas_tienda:
    string | number;

  total_tienda:
    string | number;
}


interface PedidosWebRow
  extends RowDataPacket {

  pendiente_pago:
    string | number;

  pagada:
    string | number;

  en_preparacion:
    string | number;

  lista_para_recoger:
    string | number;
}


interface PagosDiaRow
  extends RowDataPacket {

  pendientes:
    string | number;

  aprobados:
    string | number;

  rechazados:
    string | number;

  anulados:
    string | number;

  reembolsados:
    string | number;

  monto_aprobado:
    string | number;
}


interface ProductoBajoStockRow
  extends RowDataPacket {

  id_producto: number;

  codigo: string;

  nombre: string;

  stock_disponible:
    string | number;

  stock_reservado:
    string | number;

  stock_minimo:
    string | number;
}


interface UltimaVentaRow
  extends RowDataPacket {

  id_venta: number;

  codigo_venta: string;

  canal_venta:
    | 'WEB'
    | 'TIENDA';

  estado:
    EstadoVenta;

  cliente_nombre:
    string | null;

  usuario_nombre:
    string | null;

  total:
    string | number;

  fecha_creacion:
    Date;
}


export class DashboardRepository {


  /*
  |--------------------------------------------------------------------------
  | Ventas realizadas hoy
  |--------------------------------------------------------------------------
  |
  | Solo contamos ventas que realmente llegaron a estar pagadas.
  |
  | Excluimos:
  | PENDIENTE_PAGO
  | ANULADA
  |
  */

  async obtenerResumenVentasHoy():
    Promise<ResumenVentasDia> {

    const [rows] =
      await pool.query<
        ResumenVentasRow[]
      >(
        `
        SELECT

          DATE_FORMAT(
            CURRENT_DATE(),
            '%Y-%m-%d'
          ) AS fecha,

          COUNT(*) AS cantidad_ventas,

          COALESCE(
            SUM(total),
            0
          ) AS total_vendido,


          SUM(
            CASE
              WHEN canal_venta = 'WEB'
              THEN 1
              ELSE 0
            END
          ) AS ventas_web,

          COALESCE(
            SUM(
              CASE
                WHEN canal_venta = 'WEB'
                THEN total
                ELSE 0
              END
            ),
            0
          ) AS total_web,


          SUM(
            CASE
              WHEN canal_venta = 'TIENDA'
              THEN 1
              ELSE 0
            END
          ) AS ventas_tienda,

          COALESCE(
            SUM(
              CASE
                WHEN canal_venta = 'TIENDA'
                THEN total
                ELSE 0
              END
            ),
            0
          ) AS total_tienda


        FROM TB_VENTA

        WHERE
          DATE(fecha_creacion) =
            CURRENT_DATE()

          AND estado IN (
            'PAGADA',
            'EN_PREPARACION',
            'LISTA_PARA_RECOGER',
            'ENTREGADA'
          )
        `
      );


    const row =
      rows[0];


    return {

      fecha:
        row.fecha,

      cantidad_ventas:
        Number(
          row.cantidad_ventas
        ),

      total_vendido:
        Number(
          row.total_vendido
        ),

      ventas_web:
        Number(
          row.ventas_web
        ),

      total_web:
        Number(
          row.total_web
        ),

      ventas_tienda:
        Number(
          row.ventas_tienda
        ),

      total_tienda:
        Number(
          row.total_tienda
        )
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Pedidos WEB todavía activos
  |--------------------------------------------------------------------------
  */

  async obtenerPedidosWebPendientes():
    Promise<ResumenPedidosWeb> {

    const [rows] =
      await pool.query<
        PedidosWebRow[]
      >(
        `
        SELECT

          SUM(
            CASE
              WHEN estado =
                'PENDIENTE_PAGO'
              THEN 1
              ELSE 0
            END
          ) AS pendiente_pago,


          SUM(
            CASE
              WHEN estado =
                'PAGADA'
              THEN 1
              ELSE 0
            END
          ) AS pagada,


          SUM(
            CASE
              WHEN estado =
                'EN_PREPARACION'
              THEN 1
              ELSE 0
            END
          ) AS en_preparacion,


          SUM(
            CASE
              WHEN estado =
                'LISTA_PARA_RECOGER'
              THEN 1
              ELSE 0
            END
          ) AS lista_para_recoger


        FROM TB_VENTA

        WHERE
          canal_venta = 'WEB'

          AND estado IN (
            'PENDIENTE_PAGO',
            'PAGADA',
            'EN_PREPARACION',
            'LISTA_PARA_RECOGER'
          )
        `
      );


    const row =
      rows[0];


    const pendientePago =
      Number(
        row.pendiente_pago ?? 0
      );

    const pagada =
      Number(
        row.pagada ?? 0
      );

    const enPreparacion =
      Number(
        row.en_preparacion ?? 0
      );

    const listaParaRecoger =
      Number(
        row.lista_para_recoger ?? 0
      );


    return {

      pendiente_pago:
        pendientePago,

      pagada,

      en_preparacion:
        enPreparacion,

      lista_para_recoger:
        listaParaRecoger,

      total_pendientes:
        pendientePago +
        pagada +
        enPreparacion +
        listaParaRecoger
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Pagos registrados hoy
  |--------------------------------------------------------------------------
  |
  | Se usa fecha_creacion para saber
  | cuándo entró el intento de pago.
  |--------------------------------------------------------------------------
  */

  async obtenerResumenPagosHoy():
    Promise<ResumenPagosDia> {

    const [rows] =
      await pool.query<
        PagosDiaRow[]
      >(
        `
        SELECT

          SUM(
            CASE
              WHEN estado_pago =
                'PENDIENTE'
              THEN 1
              ELSE 0
            END
          ) AS pendientes,


          SUM(
            CASE
              WHEN estado_pago =
                'APROBADO'
              THEN 1
              ELSE 0
            END
          ) AS aprobados,


          SUM(
            CASE
              WHEN estado_pago =
                'RECHAZADO'
              THEN 1
              ELSE 0
            END
          ) AS rechazados,


          SUM(
            CASE
              WHEN estado_pago =
                'ANULADO'
              THEN 1
              ELSE 0
            END
          ) AS anulados,


          SUM(
            CASE
              WHEN estado_pago =
                'REEMBOLSADO'
              THEN 1
              ELSE 0
            END
          ) AS reembolsados,


          COALESCE(
            SUM(
              CASE
                WHEN estado_pago =
                  'APROBADO'
                THEN monto
                ELSE 0
              END
            ),
            0
          ) AS monto_aprobado


        FROM TB_PAGO

        WHERE
          DATE(fecha_creacion) =
            CURRENT_DATE()
        `
      );


    const row =
      rows[0];


    return {

      pendientes:
        Number(
          row.pendientes ?? 0
        ),

      aprobados:
        Number(
          row.aprobados ?? 0
        ),

      rechazados:
        Number(
          row.rechazados ?? 0
        ),

      anulados:
        Number(
          row.anulados ?? 0
        ),

      reembolsados:
        Number(
          row.reembolsados ?? 0
        ),

      monto_aprobado:
        Number(
          row.monto_aprobado ?? 0
        )
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Productos con stock bajo
  |--------------------------------------------------------------------------
  */

  async obtenerProductosBajoStock():
    Promise<ProductoBajoStock[]> {

    const [rows] =
      await pool.query<
        ProductoBajoStockRow[]
      >(
        `
        SELECT

          id_producto,

          codigo,

          nombre,

          stock_disponible,

          stock_reservado,

          stock_minimo

        FROM TB_PRODUCTO

        WHERE
          estado = 'ACTIVO'

          AND stock_disponible
              <= stock_minimo

        ORDER BY
          stock_disponible ASC,
          nombre ASC
        `
      );


    return rows.map(
      row => {

        const disponible =
          Number(
            row.stock_disponible
          );

        const reservado =
          Number(
            row.stock_reservado
          );


        return {

          id_producto:
            row.id_producto,

          codigo:
            row.codigo,

          nombre:
            row.nombre,

          stock_disponible:
            disponible,

          stock_reservado:
            reservado,

          stock_minimo:
            Number(
              row.stock_minimo
            ),

          stock_fisico:
            disponible +
            reservado
        };
      }
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Últimas 10 ventas
  |--------------------------------------------------------------------------
  */

  async obtenerUltimasVentas():
    Promise<UltimaVenta[]> {

    const [rows] =
      await pool.query<
        UltimaVentaRow[]
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


          u.nombre AS usuario_nombre,


          v.total,

          v.fecha_creacion


        FROM TB_VENTA v


        LEFT JOIN TB_CLIENTE c

          ON c.id_cliente =
             v.cliente_id


        LEFT JOIN TB_USUARIO u

          ON u.id_usuario =
             v.usuario_id


        ORDER BY

          v.fecha_creacion DESC,

          v.id_venta DESC


        LIMIT 10
        `
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