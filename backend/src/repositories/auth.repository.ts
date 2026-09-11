import { RowDataPacket } from 'mysql2';

import { pool } from '../config/database';

import { RolUsuario } from '../models/auth.model';


export interface ClienteAuthRow
  extends RowDataPacket {

  id_cliente: number;

  nombres: string | null;
  apellidos: string | null;
  razon_social: string | null;

  email: string;
  password_hash: string | null;

  estado:
    | 'ACTIVO'
    | 'INACTIVO'
    | 'BLOQUEADO';
}


export interface UsuarioAuthRow
  extends RowDataPacket {

  id_usuario: number;

  nombre: string;

  email: string;
  password_hash: string;

  rol: RolUsuario;

  estado:
    | 'ACTIVO'
    | 'INACTIVO'
    | 'BLOQUEADO';
}


export class AuthRepository {

  async obtenerClientePorEmail(
    email: string
  ): Promise<ClienteAuthRow | null> {

    const [rows] =
      await pool.query<ClienteAuthRow[]>(
        `
        SELECT
          id_cliente,
          nombres,
          apellidos,
          razon_social,
          email,
          password_hash,
          estado
        FROM TB_CLIENTE
        WHERE email = ?
        LIMIT 1
        `,
        [email]
      );

    return rows.length > 0
      ? rows[0]
      : null;
  }


  async obtenerUsuarioPorEmail(
    email: string
  ): Promise<UsuarioAuthRow | null> {

    const [rows] =
      await pool.query<UsuarioAuthRow[]>(
        `
        SELECT
          id_usuario,
          nombre,
          email,
          password_hash,
          rol,
          estado
        FROM TB_USUARIO
        WHERE email = ?
        LIMIT 1
        `,
        [email]
      );

    return rows.length > 0
      ? rows[0]
      : null;
  }
}