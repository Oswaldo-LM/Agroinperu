import bcrypt from 'bcrypt';

import {
  pool
} from '../config/database';


async function crearAdmin(): Promise<void> {

  try {

    const passwordHash =
      await bcrypt.hash(
        'Admin12345',
        12
      );

    await pool.execute(
      `
      INSERT INTO TB_USUARIO (
        nombre,
        email,
        password_hash,
        rol
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        'Administrador AgroinPeru',
        'admin@agroinperu.com',
        passwordHash,
        'ADMIN'
      ]
    );

    console.log(
      'Administrador creado correctamente'
    );

  } catch (error) {

    console.error(error);

  } finally {

    await pool.end();
  }
}


crearAdmin();