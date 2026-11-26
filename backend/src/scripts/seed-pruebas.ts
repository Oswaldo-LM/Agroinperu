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


    const passwordRendimiento =
      await bcrypt.hash(
        'Rendimiento12345',
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
    | CLIENTE PRINCIPAL
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
    | CATEGORÍA EXCLUSIVA PARA PRUEBAS K6
    |--------------------------------------------------------------------------
    */

    await pool.execute(
      `
      INSERT INTO TB_CATEGORIA (
        nombre,
        descripcion,
        estado
      )

      VALUES (
        ?,
        ?,
        'ACTIVO'
      )

      ON DUPLICATE KEY UPDATE

        descripcion =
          VALUES(descripcion),

        estado =
          'ACTIVO'
      `,
      [
        'PRUEBAS K6',
        'Categoría exclusiva para pruebas de rendimiento'
      ]
    );


    const [categoriaRows]: any =
      await pool.query(
        `
        SELECT
          id_categoria

        FROM TB_CATEGORIA

        WHERE nombre = ?

        LIMIT 1
        `,
        [
          'PRUEBAS K6'
        ]
      );


    const categoriaK6Id =
      Number(
        categoriaRows[0]
          .id_categoria
      );


    /*
    |--------------------------------------------------------------------------
    | PRODUCTO EXCLUSIVO PARA PRUEBAS K6
    |--------------------------------------------------------------------------
    */

    await pool.execute(
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
        visible_web,
        estado
      )

      VALUES (
        ?,
        ?,
        ?,
        ?,
        'UNIDAD',
        ?,
        ?,
        0,
        0,
        TRUE,
        'ACTIVO'
      )

      ON DUPLICATE KEY UPDATE

        categoria_id =
          VALUES(categoria_id),

        nombre =
          VALUES(nombre),

        descripcion =
          VALUES(descripcion),

        precio =
          VALUES(precio),

        stock_disponible =
          10000,

        stock_reservado =
          0,

        visible_web =
          TRUE,

        estado =
          'ACTIVO'
      `,
      [
        categoriaK6Id,

        'K6-SPRINT3-001',

        'Producto Prueba Rendimiento',

        'Producto exclusivo para pruebas concurrentes de pedidos web',

        10,

        10000
      ]
    );


    const [productoRows]: any =
      await pool.query(
        `
        SELECT
          id_producto

        FROM TB_PRODUCTO

        WHERE codigo = ?

        LIMIT 1
        `,
        [
          'K6-SPRINT3-001'
        ]
      );


    const productoK6Id =
      Number(
        productoRows[0]
          .id_producto
      );


    /*
    |--------------------------------------------------------------------------
    | 10 CLIENTES DE RENDIMIENTO + CARRITOS
    |--------------------------------------------------------------------------
    */

    console.log(
      '\nPreparando clientes para k6...'
    );


    for (
      let i = 1;
      i <= 10;
      i++
    ) {

      const numero =
        String(i)
          .padStart(
            2,
            '0'
          );


      const email =
        `rendimiento${numero}@agroinperu.com`;


      const documento =
        `710000${numero}`;


      const telefono =
        `9000000${numero}`;


      /*
      |--------------------------------------------------------------------------
      | Crear / actualizar cliente
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
          documento,

          'Cliente',

          `Rendimiento ${numero}`,

          email,

          passwordRendimiento,

          telefono,

          'Lima'
        ]
      );


      /*
      |--------------------------------------------------------------------------
      | Obtener ID del cliente
      |--------------------------------------------------------------------------
      */

      const [clienteRows]: any =
        await pool.query(
          `
          SELECT
            id_cliente

          FROM TB_CLIENTE

          WHERE email = ?

          LIMIT 1
          `,
          [
            email
          ]
        );


      const clienteId =
        Number(
          clienteRows[0]
            .id_cliente
        );


      /*
      |--------------------------------------------------------------------------
      | Abandonar cualquier carrito activo anterior
      |--------------------------------------------------------------------------
      */

      await pool.execute(
        `
        UPDATE TB_CARRITO

        SET estado = 'ABANDONADO'

        WHERE
          cliente_id = ?
          AND estado = 'ACTIVO'
        `,
        [
          clienteId
        ]
      );


      /*
      |--------------------------------------------------------------------------
      | Crear nuevo carrito activo
      |--------------------------------------------------------------------------
      */

      const [carritoResult]: any =
        await pool.execute(
          `
          INSERT INTO TB_CARRITO (
            cliente_id,
            estado
          )

          VALUES (
            ?,
            'ACTIVO'
          )
          `,
          [
            clienteId
          ]
        );


      const carritoId =
        Number(
          carritoResult.insertId
        );


      /*
      |--------------------------------------------------------------------------
      | Agregar producto al carrito
      |--------------------------------------------------------------------------
      */

      await pool.execute(
        `
        INSERT INTO TB_DETALLE_CARRITO (
          carrito_id,
          producto_id,
          cantidad
        )

        VALUES (
          ?,
          ?,
          1
        )
        `,
        [
          carritoId,
          productoK6Id
        ]
      );


      console.log(
        `Cliente ${numero} preparado: ${email}`
      );
    }


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


    console.log(
      '\nClientes k6 listos: rendimiento01@agroinperu.com hasta rendimiento10@agroinperu.com'
    );


    console.log(
      'Password k6: Rendimiento12345'
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