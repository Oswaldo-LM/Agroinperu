import {
  ResultSetHeader,
  RowDataPacket
} from 'mysql2';

import { pool } from '../config/database';

import {
  ActualizarClienteDto,
  Cliente,
  CrearClienteDto,
  EstadoCliente,
  TipoCliente,
  TipoDocumento
} from '../models/cliente.model';


interface ClienteRow extends RowDataPacket {
  id_cliente: number;
  tipo_cliente: TipoCliente;
  tipo_documento: TipoDocumento;
  numero_documento: string | null;

  nombres: string | null;
  apellidos: string | null;
  razon_social: string | null;

  email: string | null;
  password_hash: string | null;

  telefono: string | null;
  direccion: string | null;

  estado: EstadoCliente;

  fecha_registro: Date;
  fecha_actualizacion: Date | null;
}


export class ClienteRepository {

  async obtenerTodos(): Promise<Cliente[]> {

    const [rows] = await pool.query<ClienteRow[]>(`
      SELECT
        id_cliente,
        tipo_cliente,
        tipo_documento,
        numero_documento,
        nombres,
        apellidos,
        razon_social,
        email,
        password_hash,
        telefono,
        direccion,
        estado,
        fecha_registro,
        fecha_actualizacion
      FROM TB_CLIENTE
      ORDER BY fecha_registro DESC
    `);

    return rows.map(row =>
      this.mapearCliente(row)
    );
  }


  async obtenerPorId(
    id: number
  ): Promise<Cliente | null> {

    const [rows] = await pool.query<ClienteRow[]>(
      `
      SELECT
        id_cliente,
        tipo_cliente,
        tipo_documento,
        numero_documento,
        nombres,
        apellidos,
        razon_social,
        email,
        password_hash,
        telefono,
        direccion,
        estado,
        fecha_registro,
        fecha_actualizacion
      FROM TB_CLIENTE
      WHERE id_cliente = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapearCliente(rows[0]);
  }


  async obtenerPorEmail(
    email: string,
    excluirId?: number
  ): Promise<Cliente | null> {

    let sql = `
      SELECT
        id_cliente,
        tipo_cliente,
        tipo_documento,
        numero_documento,
        nombres,
        apellidos,
        razon_social,
        email,
        password_hash,
        telefono,
        direccion,
        estado,
        fecha_registro,
        fecha_actualizacion
      FROM TB_CLIENTE
      WHERE email = ?
    `;

    const parametros: Array<string | number> = [
      email
    ];

    if (excluirId !== undefined) {
      sql += ` AND id_cliente <> ?`;
      parametros.push(excluirId);
    }

    sql += ` LIMIT 1`;

    const [rows] =
      await pool.query<ClienteRow[]>(
        sql,
        parametros
      );

    if (rows.length === 0) {
      return null;
    }

    return this.mapearCliente(rows[0]);
  }


  async obtenerPorDocumento(
    documento: string,
    excluirId?: number
  ): Promise<Cliente | null> {

    let sql = `
      SELECT
        id_cliente,
        tipo_cliente,
        tipo_documento,
        numero_documento,
        nombres,
        apellidos,
        razon_social,
        email,
        password_hash,
        telefono,
        direccion,
        estado,
        fecha_registro,
        fecha_actualizacion
      FROM TB_CLIENTE
      WHERE numero_documento = ?
    `;

    const parametros: Array<string | number> = [
      documento
    ];

    if (excluirId !== undefined) {
      sql += ` AND id_cliente <> ?`;
      parametros.push(excluirId);
    }

    sql += ` LIMIT 1`;

    const [rows] =
      await pool.query<ClienteRow[]>(
        sql,
        parametros
      );

    if (rows.length === 0) {
      return null;
    }

    return this.mapearCliente(rows[0]);
  }


  async crear(
    datos: CrearClienteDto,
    passwordHash: string | null = null
  ): Promise<Cliente> {

    const [resultado] =
      await pool.execute<ResultSetHeader>(
        `
        INSERT INTO TB_CLIENTE (
          tipo_cliente,
          tipo_documento,
          numero_documento,
          nombres,
          apellidos,
          razon_social,
          email,
          password_hash,
          telefono,
          direccion
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          datos.tipo_cliente,
          datos.tipo_documento,
          datos.numero_documento ?? null,
          datos.nombres ?? null,
          datos.apellidos ?? null,
          datos.razon_social ?? null,
          datos.email ?? null,
          passwordHash,
          datos.telefono ?? null,
          datos.direccion ?? null
        ]
      );

    const cliente =
      await this.obtenerPorId(
        resultado.insertId
      );

    if (!cliente) {
      throw new Error(
        'ERROR_RECUPERAR_CLIENTE'
      );
    }

    return cliente;
  }


  async actualizar(
    id: number,
    datos: ActualizarClienteDto
  ): Promise<Cliente | null> {

    await pool.execute<ResultSetHeader>(
      `
      UPDATE TB_CLIENTE
      SET
        tipo_cliente = ?,
        tipo_documento = ?,
        numero_documento = ?,
        nombres = ?,
        apellidos = ?,
        razon_social = ?,
        email = ?,
        telefono = ?,
        direccion = ?,
        estado = ?
      WHERE id_cliente = ?
      `,
      [
        datos.tipo_cliente,
        datos.tipo_documento,
        datos.numero_documento ?? null,
        datos.nombres ?? null,
        datos.apellidos ?? null,
        datos.razon_social ?? null,
        datos.email ?? null,
        datos.telefono ?? null,
        datos.direccion ?? null,
        datos.estado,
        id
      ]
    );

    return this.obtenerPorId(id);
  }


  async desactivar(
    id: number
  ): Promise<boolean> {

    const [resultado] =
      await pool.execute<ResultSetHeader>(
        `
        UPDATE TB_CLIENTE
        SET estado = 'INACTIVO'
        WHERE id_cliente = ?
        `,
        [id]
      );

    return resultado.affectedRows > 0;
  }


  private mapearCliente(
    row: ClienteRow
  ): Cliente {

    return {
      id_cliente: row.id_cliente,

      tipo_cliente:
        row.tipo_cliente,

      tipo_documento:
        row.tipo_documento,

      numero_documento:
        row.numero_documento,

      nombres:
        row.nombres,

      apellidos:
        row.apellidos,

      razon_social:
        row.razon_social,

      email:
        row.email,

      telefono:
        row.telefono,

      direccion:
        row.direccion,

      estado:
        row.estado,

      fecha_registro:
        row.fecha_registro,

      fecha_actualizacion:
        row.fecha_actualizacion
    };
  }
}

