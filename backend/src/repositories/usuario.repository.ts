import {
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';

import {
  pool
} from '../config/database';

import type {
  RolUsuario
} from '../models/auth.model';

import {
  EstadoUsuario,
  Usuario
} from '../models/usuario.model';


interface UsuarioRow
  extends RowDataPacket {

  id_usuario: number;

  nombre: string;

  email: string;

  rol: RolUsuario;

  estado: EstadoUsuario;

  fecha_creacion: Date;

  fecha_actualizacion:
    Date | null;
}


interface ConteoRow
  extends RowDataPacket {

  total: number;
}


export class UsuarioRepository {


  async listar(): Promise<Usuario[]> {

    const [rows] =
      await pool.query<UsuarioRow[]>(
        `
        SELECT
          id_usuario,
          nombre,
          email,
          rol,
          estado,
          fecha_creacion,
          fecha_actualizacion

        FROM TB_USUARIO

        ORDER BY
          estado,
          nombre
        `
      );


    return rows.map(
      row =>
        this.mapearUsuario(row)
    );
  }


  async obtenerPorId(
    id: number
  ): Promise<Usuario | null> {

    const [rows] =
      await pool.query<UsuarioRow[]>(
        `
        SELECT
          id_usuario,
          nombre,
          email,
          rol,
          estado,
          fecha_creacion,
          fecha_actualizacion

        FROM TB_USUARIO

        WHERE id_usuario = ?

        LIMIT 1
        `,
        [id]
      );


    if (rows.length === 0) {
      return null;
    }


    return this.mapearUsuario(
      rows[0]
    );
  }


  async obtenerPorEmail(
    email: string
  ): Promise<Usuario | null> {

    const [rows] =
      await pool.query<UsuarioRow[]>(
        `
        SELECT
          id_usuario,
          nombre,
          email,
          rol,
          estado,
          fecha_creacion,
          fecha_actualizacion

        FROM TB_USUARIO

        WHERE email = ?

        LIMIT 1
        `,
        [email]
      );


    if (rows.length === 0) {
      return null;
    }


    return this.mapearUsuario(
      rows[0]
    );
  }


  async crear(
    nombre: string,

    email: string,

    passwordHash: string,

    rol: RolUsuario
  ): Promise<number> {

    const [resultado] =
      await pool.execute<ResultSetHeader>(
        `
        INSERT INTO TB_USUARIO (
          nombre,
          email,
          password_hash,
          rol,
          estado
        )

        VALUES (
          ?,
          ?,
          ?,
          ?,
          'ACTIVO'
        )
        `,
        [
          nombre,
          email,
          passwordHash,
          rol
        ]
      );


    return resultado.insertId;
  }


  async actualizar(
    id: number,

    nombre: string,

    email: string,

    rol: RolUsuario,

    estado: EstadoUsuario
  ): Promise<void> {

    await pool.execute(
      `
      UPDATE TB_USUARIO

      SET
        nombre = ?,
        email = ?,
        rol = ?,
        estado = ?

      WHERE id_usuario = ?
      `,
      [
        nombre,
        email,
        rol,
        estado,
        id
      ]
    );
  }


  async actualizarPassword(
    id: number,
    passwordHash: string
  ): Promise<void> {

    await pool.execute(
      `
      UPDATE TB_USUARIO

      SET password_hash = ?

      WHERE id_usuario = ?
      `,
      [
        passwordHash,
        id
      ]
    );
  }


  async desactivar(
    id: number
  ): Promise<void> {

    await pool.execute(
      `
      UPDATE TB_USUARIO

      SET estado = 'INACTIVO'

      WHERE id_usuario = ?
      `,
      [id]
    );
  }


  async contarAdminsActivos():
    Promise<number> {

    const [rows] =
      await pool.query<ConteoRow[]>(
        `
        SELECT
          COUNT(*) AS total

        FROM TB_USUARIO

        WHERE
          rol = 'ADMIN'
          AND estado = 'ACTIVO'
        `
      );


    return Number(
      rows[0]?.total ?? 0
    );
  }


  private mapearUsuario(
    row: UsuarioRow
  ): Usuario {

    return {

      id_usuario:
        row.id_usuario,

      nombre:
        row.nombre,

      email:
        row.email,

      rol:
        row.rol,

      estado:
        row.estado,

      fecha_creacion:
        row.fecha_creacion,

      fecha_actualizacion:
        row.fecha_actualizacion
    };
  }
}