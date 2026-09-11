import bcrypt from 'bcrypt';

import {
  pool
} from '../config/database';


async function seed(): Promise<void> {

  try {

    console.log(
      'Creando datos de prueba...'
    );


    /*
    |--------------------------------------------------------------------------
    | Contraseñas
    |--------------------------------------------------------------------------
    */

    const passwordAdmin =
      await bcrypt.hash(
        'Admin12345',
        12
      );


    const passwordCajero =
      await bcrypt.hash(
        'Cajero12345',
        12
      );


    const passwordCliente =
      await bcrypt.hash(
        'Cliente12345',
        12
      );


    /*
    |--------------------------------------------------------------------------
    | ADMIN
    |--------------------------------------------------------------------------
    */

    await pool.execute(
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
        'ADMIN',
        'ACTIVO'
      )

      ON DUPLICATE KEY UPDATE

        nombre = VALUES(nombre),

        password_hash =
          VALUES(password_hash),

        rol = 'ADMIN',

        estado = 'ACTIVO'
      `,
      [
        'Administrador',
        'admin@agroinperu.com',
        passwordAdmin
      ]
    );


    /*
    |--------------------------------------------------------------------------
    | CAJERO
    |--------------------------------------------------------------------------
    */

    await pool.execute(
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
        'CAJERO',
        'ACTIVO'
      )

      ON DUPLICATE KEY UPDATE

        nombre = VALUES(nombre),

        password_hash =
          VALUES(password_hash),

        rol = 'CAJERO',

        estado = 'ACTIVO'
      `,
      [
        'Cajero Prueba',
        'cajero@agroinperu.com',
        passwordCajero
      ]
    );


    /*
    |--------------------------------------------------------------------------
    | CLIENTE
    |--------------------------------------------------------------------------
    */

    await pool.execute(
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

        direccion,

        estado
      )

      VALUES (
        'PERSONA',

        'DNI',

        ?,

        ?,

        ?,

        NULL,

        ?,

        ?,

        ?,

        ?,

        'ACTIVO'
      )

      ON DUPLICATE KEY UPDATE

        nombres =
          VALUES(nombres),

        apellidos =
          VALUES(apellidos),

        password_hash =
          VALUES(password_hash),

        telefono =
          VALUES(telefono),

        direccion =
          VALUES(direccion),

        estado =
          'ACTIVO'
      `,
      [
        '70000001',

        'Cliente',

        'Prueba',

        'cliente@agroinperu.com',

        passwordCliente,

        '999999999',

        'Lima'
      ]
    );


    /*
    |--------------------------------------------------------------------------
    | Mostrar resultado
    |--------------------------------------------------------------------------
    */

    const [usuarios] =
      await pool.query(
        `
        SELECT
          id_usuario,
          nombre,
          email,
          rol,
          estado

        FROM TB_USUARIO
        `
      );


    console.log(
      '\nUsuarios internos:'
    );

    console.table(
      usuarios
    );


    const [clientes] =
      await pool.query(
        `
        SELECT
          id_cliente,
          nombres,
          apellidos,
          email,
          estado

        FROM TB_CLIENTE
        `
      );


    console.log(
      '\nClientes:'
    );

    console.table(
      clientes
    );


    console.log(
      '\nDatos de prueba creados correctamente.'
    );


  } catch (error) {

    console.error(
      'Error creando datos de prueba:',
      error
    );


    process.exitCode = 1;


  } finally {

    await pool.end();
  }
}


seed();