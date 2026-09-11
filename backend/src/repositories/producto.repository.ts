import {
  ResultSetHeader,
  RowDataPacket
} from 'mysql2';

import { pool } from '../config/database';

import {
  ActualizarProductoDto,
  CrearProductoDto,
  EstadoProducto,
  Producto,
  UnidadMedida
} from '../models/producto.model';


interface ProductoRow extends RowDataPacket {

  id_producto: number;

  categoria_id: number;

  codigo: string;

  codigo_barras: string | null;

  nombre: string;

  descripcion: string | null;

  unidad_medida: UnidadMedida;

  precio: string | number;

  stock_disponible: string | number;

  stock_reservado: string | number;

  stock_minimo: string | number;

  imagen_url: string | null;

  visible_web: number;

  estado: EstadoProducto;

  fecha_creacion: Date;

  fecha_actualizacion: Date | null;
}


export class ProductoRepository {


  async obtenerTodos():
    Promise<Producto[]> {

    const [rows] =
      await pool.query<ProductoRow[]>(`
        SELECT
          id_producto,
          categoria_id,
          codigo,
          codigo_barras,
          nombre,
          descripcion,
          unidad_medida,
          precio,
          stock_disponible,
          stock_reservado,
          stock_minimo,
          imagen_url,
          visible_web,
          estado,
          fecha_creacion,
          fecha_actualizacion

        FROM TB_PRODUCTO

        ORDER BY nombre ASC
      `);


    return rows.map(
      row =>
        this.mapearProducto(row)
    );
  }


  async obtenerPorId(
    id: number
  ): Promise<Producto | null> {

    const [rows] =
      await pool.query<ProductoRow[]>(
        `
        SELECT
          id_producto,
          categoria_id,
          codigo,
          codigo_barras,
          nombre,
          descripcion,
          unidad_medida,
          precio,
          stock_disponible,
          stock_reservado,
          stock_minimo,
          imagen_url,
          visible_web,
          estado,
          fecha_creacion,
          fecha_actualizacion

        FROM TB_PRODUCTO

        WHERE id_producto = ?

        LIMIT 1
        `,
        [
          id
        ]
      );


    if (
      rows.length === 0
    ) {

      return null;
    }


    return this.mapearProducto(
      rows[0]
    );
  }


  async obtenerPorCodigo(
    codigo: string,
    excluirId?: number
  ): Promise<Producto | null> {

    let sql = `
      SELECT
        id_producto,
        categoria_id,
        codigo,
        codigo_barras,
        nombre,
        descripcion,
        unidad_medida,
        precio,
        stock_disponible,
        stock_reservado,
        stock_minimo,
        imagen_url,
        visible_web,
        estado,
        fecha_creacion,
        fecha_actualizacion

      FROM TB_PRODUCTO

      WHERE codigo = ?
    `;


    const parametros:
      Array<string | number> = [

      codigo
    ];


    if (
      excluirId !== undefined
    ) {

      sql += `
        AND id_producto <> ?
      `;


      parametros.push(
        excluirId
      );
    }


    sql += `
      LIMIT 1
    `;


    const [rows] =
      await pool.query<ProductoRow[]>(
        sql,
        parametros
      );


    if (
      rows.length === 0
    ) {

      return null;
    }


    return this.mapearProducto(
      rows[0]
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Buscar por código de barras
  |--------------------------------------------------------------------------
  */

  async obtenerPorCodigoBarras(
    codigoBarras: string
  ): Promise<Producto | null> {

    const [rows] =
      await pool.query<ProductoRow[]>(
        `
        SELECT
          id_producto,
          categoria_id,
          codigo,
          codigo_barras,
          nombre,
          descripcion,
          unidad_medida,
          precio,
          stock_disponible,
          stock_reservado,
          stock_minimo,
          imagen_url,
          visible_web,
          estado,
          fecha_creacion,
          fecha_actualizacion

        FROM TB_PRODUCTO

        WHERE codigo_barras = ?
          AND estado = 'ACTIVO'

        LIMIT 1
        `,
        [
          codigoBarras
        ]
      );


    if (
      rows.length === 0
    ) {

      return null;
    }


    return this.mapearProducto(
      rows[0]
    );
  }


  async crear(
    datos: CrearProductoDto
  ): Promise<Producto> {

    const [resultado] =
      await pool.execute<ResultSetHeader>(
        `
        INSERT INTO TB_PRODUCTO (

          categoria_id,
          codigo,
          nombre,
          descripcion,
          unidad_medida,
          precio,
          stock_disponible,
          stock_reservado,
          stock_minimo,
          imagen_url,
          visible_web,
          codigo_barras

        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          0,
          ?,
          ?,
          ?,
          ?
        )
        `,
        [
          datos.categoria_id,

          datos.codigo,

          datos.nombre,

          datos.descripcion
          ?? null,

          datos.unidad_medida,

          datos.precio,

          datos.stock_disponible
          ?? 0,

          datos.stock_minimo
          ?? 0,

          datos.imagen_url
          ?? null,

          datos.visible_web
          ?? true,

          datos.codigo_barras
            ?.trim()
          || null
        ]
      );


    const producto =
      await this.obtenerPorId(
        resultado.insertId
      );


    if (!producto) {

      throw new Error(
        'ERROR_RECUPERAR_PRODUCTO'
      );
    }


    return producto;
  }


  async actualizar(
    id: number,
    datos: ActualizarProductoDto
  ): Promise<Producto | null> {

    await pool.execute<ResultSetHeader>(
      `
      UPDATE TB_PRODUCTO

      SET
        categoria_id = ?,
        codigo = ?,
        nombre = ?,
        descripcion = ?,
        unidad_medida = ?,
        precio = ?,
        stock_minimo = ?,
        imagen_url = ?,
        visible_web = ?,
        estado = ?,
        codigo_barras = ?

      WHERE id_producto = ?
      `,
      [
        datos.categoria_id,

        datos.codigo,

        datos.nombre,

        datos.descripcion
        ?? null,

        datos.unidad_medida,

        datos.precio,

        datos.stock_minimo,

        datos.imagen_url
        ?? null,

        datos.visible_web,

        datos.estado,

        datos.codigo_barras
          ?.trim()
        || null,

        id
      ]
    );


    return this.obtenerPorId(
      id
    );
  }


  async desactivar(
    id: number
  ): Promise<boolean> {

    const [resultado] =
      await pool.execute<ResultSetHeader>(
        `
        UPDATE TB_PRODUCTO

        SET
          estado = 'INACTIVO',
          visible_web = FALSE

        WHERE id_producto = ?
        `,
        [
          id
        ]
      );


    return (
      resultado.affectedRows > 0
    );
  }


  private mapearProducto(
    row: ProductoRow
  ): Producto {

    return {

      id_producto:
        row.id_producto,

      categoria_id:
        row.categoria_id,

      codigo:
        row.codigo,

      codigo_barras:
        row.codigo_barras,

      nombre:
        row.nombre,

      descripcion:
        row.descripcion,

      unidad_medida:
        row.unidad_medida,

      precio:
        Number(
          row.precio
        ),

      stock_disponible:
        Number(
          row.stock_disponible
        ),

      stock_reservado:
        Number(
          row.stock_reservado
        ),

      stock_minimo:
        Number(
          row.stock_minimo
        ),

      imagen_url:
        row.imagen_url,

      visible_web:
        Boolean(
          row.visible_web
        ),

      estado:
        row.estado,

      fecha_creacion:
        row.fecha_creacion,

      fecha_actualizacion:
        row.fecha_actualizacion
    };
  }


  async listarPublicos() {

    const [rows] =
      await pool.query(
        `
        SELECT
          p.id_producto,
          p.categoria_id,

          p.codigo,
          p.nombre,
          p.descripcion,

          p.unidad_medida,

          p.precio,

          p.stock_disponible,

          p.imagen_url,

          p.visible_web,

          p.estado

        FROM TB_PRODUCTO p

        INNER JOIN TB_CATEGORIA c
          ON c.id_categoria =
             p.categoria_id

        WHERE
          p.estado = 'ACTIVO'

          AND p.visible_web = TRUE

          AND c.estado = 'ACTIVO'

        ORDER BY p.nombre
        `
      );


    return rows;
  }


  async obtenerPublicoPorId(
    id: number
  ) {

    const [rows] =
      await pool.query(
        `
        SELECT
          p.id_producto,
          p.categoria_id,

          p.codigo,
          p.nombre,
          p.descripcion,

          p.unidad_medida,

          p.precio,

          p.stock_disponible,

          p.imagen_url

        FROM TB_PRODUCTO p

        INNER JOIN TB_CATEGORIA c
          ON c.id_categoria =
             p.categoria_id

        WHERE
          p.id_producto = ?

          AND p.estado = 'ACTIVO'

          AND p.visible_web = TRUE

          AND c.estado = 'ACTIVO'

        LIMIT 1
        `,
        [
          id
        ]
      );


    return (
      Array.isArray(rows) &&
      rows.length > 0

        ? rows[0]

        : null
    );
  }
}