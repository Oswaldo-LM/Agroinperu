import {
  ResultSetHeader,
  RowDataPacket
} from 'mysql2';

import {
  pool
} from '../config/database';

import {
  EstadoCarrito
} from '../models/carrito.model';


interface CarritoRow extends RowDataPacket {
  id_carrito: number;
  cliente_id: number;
  estado: EstadoCarrito;
  fecha_creacion: Date;
  fecha_actualizacion: Date | null;
}


export interface DetalleCarritoRow
  extends RowDataPacket {

  id_detalle_carrito: number;
  producto_id: number;

  codigo: string;
  nombre: string;
  unidad_medida: string;

  precio: string | number;
  cantidad: string | number;

  stock_disponible: string | number;

  imagen_url: string | null;
}


export class CarritoRepository {


  /*
  |--------------------------------------------------------------------------
  | Buscar carrito activo
  |--------------------------------------------------------------------------
  */

  async obtenerCarritoActivo(
    clienteId: number
  ): Promise<CarritoRow | null> {

    const [rows] =
      await pool.query<CarritoRow[]>(
        `
        SELECT
          id_carrito,
          cliente_id,
          estado,
          fecha_creacion,
          fecha_actualizacion
        FROM TB_CARRITO
        WHERE
          cliente_id = ?
          AND estado = 'ACTIVO'
        ORDER BY id_carrito DESC
        LIMIT 1
        `,
        [clienteId]
      );

    return rows.length > 0
      ? rows[0]
      : null;
  }


  /*
  |--------------------------------------------------------------------------
  | Crear carrito
  |--------------------------------------------------------------------------
  */

  async crearCarrito(
    clienteId: number
  ): Promise<number> {

    const [resultado] =
      await pool.execute<ResultSetHeader>(
        `
        INSERT INTO TB_CARRITO (
          cliente_id,
          estado
        )
        VALUES (?, 'ACTIVO')
        `,
        [clienteId]
      );

    return resultado.insertId;
  }


  /*
  |--------------------------------------------------------------------------
  | Obtener productos del carrito
  |--------------------------------------------------------------------------
  */

  async obtenerDetalles(
    carritoId: number
  ): Promise<DetalleCarritoRow[]> {

    const [rows] =
      await pool.query<DetalleCarritoRow[]>(
        `
        SELECT
          dc.id_detalle_carrito,
          dc.producto_id,

          p.codigo,
          p.nombre,
          p.unidad_medida,
          p.precio,
          p.stock_disponible,
          p.imagen_url,

          dc.cantidad

        FROM TB_DETALLE_CARRITO dc

        INNER JOIN TB_PRODUCTO p
          ON p.id_producto = dc.producto_id

        WHERE dc.carrito_id = ?

        ORDER BY dc.fecha_agregado ASC
        `,
        [carritoId]
      );

    return rows;
  }


  /*
  |--------------------------------------------------------------------------
  | Buscar un producto dentro del carrito
  |--------------------------------------------------------------------------
  */

  async obtenerProductoCarrito(
    carritoId: number,
    productoId: number
  ): Promise<DetalleCarritoRow | null> {

    const [rows] =
      await pool.query<DetalleCarritoRow[]>(
        `
        SELECT
          dc.id_detalle_carrito,
          dc.producto_id,

          p.codigo,
          p.nombre,
          p.unidad_medida,
          p.precio,
          p.stock_disponible,
          p.imagen_url,

          dc.cantidad

        FROM TB_DETALLE_CARRITO dc

        INNER JOIN TB_PRODUCTO p
          ON p.id_producto = dc.producto_id

        WHERE
          dc.carrito_id = ?
          AND dc.producto_id = ?

        LIMIT 1
        `,
        [
          carritoId,
          productoId
        ]
      );

    return rows.length > 0
      ? rows[0]
      : null;
  }


  /*
  |--------------------------------------------------------------------------
  | Agregar producto
  |--------------------------------------------------------------------------
  */

  async agregarProducto(
    carritoId: number,
    productoId: number,
    cantidad: number
  ): Promise<void> {

    await pool.execute<ResultSetHeader>(
      `
      INSERT INTO TB_DETALLE_CARRITO (
        carrito_id,
        producto_id,
        cantidad
      )
      VALUES (?, ?, ?)
      `,
      [
        carritoId,
        productoId,
        cantidad
      ]
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Actualizar cantidad
  |--------------------------------------------------------------------------
  */

  async actualizarCantidad(
    carritoId: number,
    productoId: number,
    cantidad: number
  ): Promise<boolean> {

    const [resultado] =
      await pool.execute<ResultSetHeader>(
        `
        UPDATE TB_DETALLE_CARRITO
        SET cantidad = ?
        WHERE
          carrito_id = ?
          AND producto_id = ?
        `,
        [
          cantidad,
          carritoId,
          productoId
        ]
      );

    return resultado.affectedRows > 0;
  }


  /*
  |--------------------------------------------------------------------------
  | Eliminar producto
  |--------------------------------------------------------------------------
  */

  async eliminarProducto(
    carritoId: number,
    productoId: number
  ): Promise<boolean> {

    const [resultado] =
      await pool.execute<ResultSetHeader>(
        `
        DELETE FROM TB_DETALLE_CARRITO
        WHERE
          carrito_id = ?
          AND producto_id = ?
        `,
        [
          carritoId,
          productoId
        ]
      );

    return resultado.affectedRows > 0;
  }


  /*
  |--------------------------------------------------------------------------
  | Vaciar carrito
  |--------------------------------------------------------------------------
  */

  async vaciarCarrito(
    carritoId: number
  ): Promise<void> {

    await pool.execute<ResultSetHeader>(
      `
      DELETE FROM TB_DETALLE_CARRITO
      WHERE carrito_id = ?
      `,
      [carritoId]
    );
  }
}