import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/database';
import {
  Categoria,
  CrearCategoriaDto,
  ActualizarCategoriaDto
} from '../models/categoria.model';

interface CategoriaRow extends RowDataPacket, Categoria {}

export class CategoriaRepository {

  async obtenerTodas(): Promise<Categoria[]> {
    const [rows] = await pool.query<CategoriaRow[]>(`
      SELECT
        id_categoria,
        nombre,
        descripcion,
        estado,
        fecha_creacion,
        fecha_actualizacion
      FROM TB_CATEGORIA
      ORDER BY nombre ASC
    `);

    return rows;
  }


  async obtenerPorId(id: number): Promise<Categoria | null> {
    const [rows] = await pool.query<CategoriaRow[]>(
      `
      SELECT
        id_categoria,
        nombre,
        descripcion,
        estado,
        fecha_creacion,
        fecha_actualizacion
      FROM TB_CATEGORIA
      WHERE id_categoria = ?
      LIMIT 1
      `,
      [id]
    );

    return rows.length > 0 ? rows[0] : null;
  }


  async obtenerPorNombre(
    nombre: string,
    excluirId?: number
  ): Promise<Categoria | null> {

    let sql = `
      SELECT
        id_categoria,
        nombre,
        descripcion,
        estado,
        fecha_creacion,
        fecha_actualizacion
      FROM TB_CATEGORIA
      WHERE nombre = ?
    `;

    const parametros: Array<string | number> = [nombre];

    if (excluirId !== undefined) {
      sql += ` AND id_categoria <> ?`;
      parametros.push(excluirId);
    }

    sql += ` LIMIT 1`;

    const [rows] = await pool.query<CategoriaRow[]>(
      sql,
      parametros
    );

    return rows.length > 0 ? rows[0] : null;
  }


  async crear(datos: CrearCategoriaDto): Promise<Categoria> {
    const [resultado] = await pool.execute<ResultSetHeader>(
      `
      INSERT INTO TB_CATEGORIA (
        nombre,
        descripcion
      )
      VALUES (?, ?)
      `,
      [
        datos.nombre,
        datos.descripcion ?? null
      ]
    );

    const categoria = await this.obtenerPorId(resultado.insertId);

    if (!categoria) {
      throw new Error('No se pudo recuperar la categoría creada');
    }

    return categoria;
  }


  async actualizar(
    id: number,
    datos: ActualizarCategoriaDto
  ): Promise<Categoria | null> {

    await pool.execute<ResultSetHeader>(
      `
      UPDATE TB_CATEGORIA
      SET
        nombre = ?,
        descripcion = ?,
        estado = ?
      WHERE id_categoria = ?
      `,
      [
        datos.nombre,
        datos.descripcion ?? null,
        datos.estado,
        id
      ]
    );

    return this.obtenerPorId(id);
  }


  async desactivar(id: number): Promise<boolean> {
    const [resultado] = await pool.execute<ResultSetHeader>(
      `
      UPDATE TB_CATEGORIA
      SET estado = 'INACTIVO'
      WHERE id_categoria = ?
      `,
      [id]
    );

    return resultado.affectedRows > 0;
  }

  async listarPublicas() {

  const [rows] =
    await pool.query(
      `
      SELECT
        id_categoria,
        nombre,
        descripcion,
        estado,
        fecha_creacion,
        fecha_actualizacion

      FROM TB_CATEGORIA

      WHERE estado = 'ACTIVO'

      ORDER BY nombre
      `
    );


  return rows;
}


}