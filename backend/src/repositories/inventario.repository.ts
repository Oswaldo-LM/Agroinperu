import {
  PoolConnection,
  RowDataPacket
} from 'mysql2/promise';

import {
  pool
} from '../config/database';

import {
  MovimientoStock,
  TipoMovimientoStock
} from '../models/inventario.model';


export interface ProductoStockRow
  extends RowDataPacket {

  id_producto: number;

  codigo: string;

  nombre: string;

  unidad_medida:
    | 'UNIDAD'
    | 'METRO'
    | 'ROLLO'
    | 'CAJA';

  stock_disponible:
    string | number;

  stock_reservado:
    string | number;

  estado:
    | 'ACTIVO'
    | 'INACTIVO';
}


interface MovimientoStockRow
  extends RowDataPacket {

  id_movimiento: number;

  producto_id: number;

  codigo_producto: string;

  nombre_producto: string;

  venta_id:
    number | null;

  usuario_id:
    number | null;

  tipo_movimiento:
    TipoMovimientoStock;

  cantidad:
    string | number;

  stock_disponible_anterior:
    string | number;

  stock_disponible_nuevo:
    string | number;

  stock_reservado_anterior:
    string | number;

  stock_reservado_nuevo:
    string | number;

  motivo:
    string | null;

  fecha_movimiento:
    Date;
}


export class InventarioRepository {


  /*
  |--------------------------------------------------------------------------
  | Obtener producto y bloquearlo
  |--------------------------------------------------------------------------
  */

  async obtenerProductoConBloqueo(
    connection: PoolConnection,
    productoId: number
  ): Promise<ProductoStockRow | null> {

    const [rows] =
      await connection.query<
        ProductoStockRow[]
      >(
        `
        SELECT
          id_producto,
          codigo,
          nombre,
          unidad_medida,
          stock_disponible,
          stock_reservado,
          estado

        FROM TB_PRODUCTO

        WHERE id_producto = ?

        LIMIT 1

        FOR UPDATE
        `,
        [productoId]
      );


    return rows.length > 0
      ? rows[0]
      : null;
  }


  /*
  |--------------------------------------------------------------------------
  | Actualizar stock disponible
  |--------------------------------------------------------------------------
  */

  async actualizarStockDisponible(
    connection: PoolConnection,

    productoId: number,

    stockDisponibleNuevo: number
  ): Promise<void> {

    await connection.execute(
      `
      UPDATE TB_PRODUCTO

      SET
        stock_disponible = ?

      WHERE id_producto = ?
      `,
      [
        stockDisponibleNuevo,
        productoId
      ]
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Registrar movimiento
  |--------------------------------------------------------------------------
  */

  async registrarMovimiento(
    connection: PoolConnection,

    productoId: number,

    usuarioId: number,

    tipoMovimiento:
      'ENTRADA' | 'AJUSTE',

    cantidad: number,

    disponibleAnterior: number,

    disponibleNuevo: number,

    reservadoAnterior: number,

    reservadoNuevo: number,

    motivo: string
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
      )

      VALUES (
        ?,

        NULL,

        ?,

        ?,

        ?,

        ?,
        ?,

        ?,
        ?,

        ?
      )
      `,
      [
        productoId,

        usuarioId,

        tipoMovimiento,

        cantidad,

        disponibleAnterior,
        disponibleNuevo,

        reservadoAnterior,
        reservadoNuevo,

        motivo
      ]
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Historial de movimientos
  |--------------------------------------------------------------------------
  */

  async listarMovimientos(
    productoId?: number
  ): Promise<MovimientoStock[]> {

    let sql = `
      SELECT
        m.id_movimiento,

        m.producto_id,

        p.codigo
          AS codigo_producto,

        p.nombre
          AS nombre_producto,

        m.venta_id,

        m.usuario_id,

        m.tipo_movimiento,

        m.cantidad,

        m.stock_disponible_anterior,

        m.stock_disponible_nuevo,

        m.stock_reservado_anterior,

        m.stock_reservado_nuevo,

        m.motivo,

        m.fecha_movimiento

      FROM TB_MOVIMIENTO_STOCK m

      INNER JOIN TB_PRODUCTO p
        ON p.id_producto =
           m.producto_id
    `;


    const parametros:
      number[] = [];


    if (productoId) {

      sql += `
        WHERE m.producto_id = ?
      `;

      parametros.push(
        productoId
      );
    }


    sql += `
      ORDER BY
        m.fecha_movimiento DESC,
        m.id_movimiento DESC
    `;


    const [rows] =
      await pool.query<
        MovimientoStockRow[]
      >(
        sql,
        parametros
      );


    return rows.map(
      row => ({

        id_movimiento:
          row.id_movimiento,

        producto_id:
          row.producto_id,

        codigo_producto:
          row.codigo_producto,

        nombre_producto:
          row.nombre_producto,

        venta_id:
          row.venta_id,

        usuario_id:
          row.usuario_id,

        tipo_movimiento:
          row.tipo_movimiento,

        cantidad:
          Number(
            row.cantidad
          ),

        stock_disponible_anterior:
          Number(
            row.stock_disponible_anterior
          ),

        stock_disponible_nuevo:
          Number(
            row.stock_disponible_nuevo
          ),

        stock_reservado_anterior:
          Number(
            row.stock_reservado_anterior
          ),

        stock_reservado_nuevo:
          Number(
            row.stock_reservado_nuevo
          ),

        motivo:
          row.motivo,

        fecha_movimiento:
          row.fecha_movimiento
      })
    );
  }
}