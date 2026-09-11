import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';


import {
  pool
} from '../config/database';

import {
  EstadoVenta,
  VentaWebDetalle,
  VentaWebResumen
} from '../models/venta.model';

export interface CarritoCheckoutRow
  extends RowDataPacket {

  id_carrito: number;
  cliente_id: number;
}


export interface DetalleCheckoutRow
  extends RowDataPacket {

  producto_id: number;

  codigo: string;
  nombre: string;
  unidad_medida: string;

  precio: string | number;
  cantidad: string | number;

  stock_disponible: string | number;
  stock_reservado: string | number;

  estado: 'ACTIVO' | 'INACTIVO';

  visible_web: number;
}


interface VentaWebResumenRow
  extends RowDataPacket {

  id_venta: number;
  codigo_venta: string;

  cliente_id: number | null;

  cliente_nombre: string | null;
  cliente_email: string | null;

  estado: EstadoVenta;

  subtotal: string | number;
  igv: string | number;
  total: string | number;

  fecha_creacion: Date;
}


interface DetalleVentaAdminRow
  extends RowDataPacket {

  id_detalle_venta: number;
  producto_id: number;

  producto_nombre: string;
  unidad_medida: string;

  precio_unitario: string | number;
  cantidad: string | number;
  subtotal: string | number;
}


interface VentaEstadoRow
  extends RowDataPacket {

  id_venta: number;
  codigo_venta: string;
  cliente_id: number | null;
  estado: EstadoVenta;
}


interface DetalleStockVentaRow
  extends RowDataPacket {

  producto_id: number;

  cantidad: string | number;

  stock_disponible:
    string | number;

  stock_reservado:
    string | number;
}

export interface ProductoVentaTiendaRow
  extends RowDataPacket {

  id_producto: number;

  codigo: string;
  nombre: string;

  unidad_medida:
    | 'UNIDAD'
    | 'METRO'
    | 'ROLLO'
    | 'CAJA';

  precio: string | number;

  stock_disponible:
    string | number;

  stock_reservado:
    string | number;

  estado:
    | 'ACTIVO'
    | 'INACTIVO';
}

export class VentaRepository {

  async listarVentasWeb(
  estado?: EstadoVenta
): Promise<VentaWebResumen[]> {

  let sql = `
    SELECT
      v.id_venta,
      v.codigo_venta,
      v.cliente_id,

      CASE
        WHEN c.tipo_cliente = 'EMPRESA'
          THEN c.razon_social
        ELSE
          CONCAT_WS(
            ' ',
            c.nombres,
            c.apellidos
          )
      END AS cliente_nombre,

      c.email AS cliente_email,

      v.estado,

      v.subtotal,
      v.igv,
      v.total,

      v.fecha_creacion

    FROM TB_VENTA v

    LEFT JOIN TB_CLIENTE c
      ON c.id_cliente = v.cliente_id

    WHERE v.canal_venta = 'WEB'
  `;

  const parametros: string[] = [];


  if (estado) {

    sql += `
      AND v.estado = ?
    `;

    parametros.push(
      estado
    );
  }


  sql += `
    ORDER BY v.fecha_creacion DESC
  `;


  const [rows] =
    await pool.query<VentaWebResumenRow[]>(
      sql,
      parametros
    );


  return rows.map(row => ({
    id_venta:
      row.id_venta,

    codigo_venta:
      row.codigo_venta,

    cliente_id:
      row.cliente_id,

    cliente_nombre:
      row.cliente_nombre ?? '',

    cliente_email:
      row.cliente_email,

    estado:
      row.estado,

    subtotal:
      Number(row.subtotal),

    igv:
      Number(row.igv),

    total:
      Number(row.total),

    fecha_creacion:
      row.fecha_creacion
  }));
}


async obtenerVentaWebPorId(
  ventaId: number
): Promise<VentaWebDetalle | null> {

  const [ventas] =
    await pool.query<VentaWebResumenRow[]>(
      `
      SELECT
        v.id_venta,
        v.codigo_venta,
        v.cliente_id,

        CASE
          WHEN c.tipo_cliente = 'EMPRESA'
            THEN c.razon_social
          ELSE
            CONCAT_WS(
              ' ',
              c.nombres,
              c.apellidos
            )
        END AS cliente_nombre,

        c.email AS cliente_email,

        v.estado,

        v.subtotal,
        v.igv,
        v.total,

        v.fecha_creacion

      FROM TB_VENTA v

      LEFT JOIN TB_CLIENTE c
        ON c.id_cliente = v.cliente_id

      WHERE
        v.id_venta = ?
        AND v.canal_venta = 'WEB'

      LIMIT 1
      `,
      [ventaId]
    );


  if (ventas.length === 0) {
    return null;
  }


  const venta =
    ventas[0];


  const [detalles] =
    await pool.query<DetalleVentaAdminRow[]>(
      `
      SELECT
        id_detalle_venta,
        producto_id,
        producto_nombre,
        unidad_medida,
        precio_unitario,
        cantidad,
        subtotal

      FROM TB_DETALLE_VENTA

      WHERE venta_id = ?

      ORDER BY id_detalle_venta
      `,
      [ventaId]
    );


  return {

    id_venta:
      venta.id_venta,

    codigo_venta:
      venta.codigo_venta,

    cliente_id:
      venta.cliente_id,

    cliente_nombre:
      venta.cliente_nombre ?? '',

    cliente_email:
      venta.cliente_email,

    estado:
      venta.estado,

    subtotal:
      Number(venta.subtotal),

    igv:
      Number(venta.igv),

    total:
      Number(venta.total),

    fecha_creacion:
      venta.fecha_creacion,


    detalles:
      detalles.map(detalle => ({

        id_detalle_venta:
          detalle.id_detalle_venta,

        producto_id:
          detalle.producto_id,

        producto_nombre:
          detalle.producto_nombre,

        unidad_medida:
          detalle.unidad_medida,

        precio_unitario:
          Number(
            detalle.precio_unitario
          ),

        cantidad:
          Number(
            detalle.cantidad
          ),

        subtotal:
          Number(
            detalle.subtotal
          )
      }))
  };
}

async obtenerVentaEstadoConBloqueo(
  connection: PoolConnection,
  ventaId: number
): Promise<VentaEstadoRow | null> {

  const [rows] =
    await connection.query<VentaEstadoRow[]>(
      `
      SELECT
        id_venta,
        codigo_venta,
        cliente_id,
        estado

      FROM TB_VENTA

      WHERE
        id_venta = ?
        AND canal_venta = 'WEB'

      LIMIT 1

      FOR UPDATE
      `,
      [ventaId]
    );


  return rows.length > 0
    ? rows[0]
    : null;
}

async actualizarEstado(
  connection: PoolConnection,
  ventaId: number,
  estado: EstadoVenta
): Promise<void> {

  await connection.execute(
    `
    UPDATE TB_VENTA

    SET estado = ?

    WHERE id_venta = ?
    `,
    [
      estado,
      ventaId
    ]
  );
}

async registrarCambioEstado(
  connection: PoolConnection,

  ventaId: number,

  usuarioId: number,

  estadoAnterior: EstadoVenta,

  estadoNuevo: EstadoVenta
): Promise<void> {

  await connection.execute(
    `
    INSERT INTO TB_HISTORIAL_ESTADO_VENTA (
      venta_id,
      usuario_id,
      cliente_id,

      tipo_actor,

      estado_anterior,
      estado_nuevo,

      observacion
    )

    VALUES (
      ?,
      ?,
      NULL,

      'USUARIO',

      ?,
      ?,

      'Cambio de estado realizado desde administración'
    )
    `,
    [
      ventaId,
      usuarioId,
      estadoAnterior,
      estadoNuevo
    ]
  );
}

async obtenerDetallesStockConBloqueo(
  connection: PoolConnection,
  ventaId: number
): Promise<DetalleStockVentaRow[]> {

  const [rows] =
    await connection.query<DetalleStockVentaRow[]>(
      `
      SELECT
        dv.producto_id,
        dv.cantidad,

        p.stock_disponible,
        p.stock_reservado

      FROM TB_DETALLE_VENTA dv

      INNER JOIN TB_PRODUCTO p
        ON p.id_producto =
           dv.producto_id

      WHERE dv.venta_id = ?

      FOR UPDATE
      `,
      [ventaId]
    );


  return rows;
}

async actualizarStockEntrega(
  connection: PoolConnection,

  productoId: number,

  stockReservadoNuevo: number
): Promise<void> {

  await connection.execute(
    `
    UPDATE TB_PRODUCTO

    SET stock_reservado = ?

    WHERE id_producto = ?
    `,
    [
      stockReservadoNuevo,
      productoId
    ]
  );
}

async registrarMovimientoEntrega(
  connection: PoolConnection,

  productoId: number,

  ventaId: number,

  usuarioId: number,

  cantidad: number,

  disponibleActual: number,

  reservadoAnterior: number,

  reservadoNuevo: number
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
      ?,
      ?,

      'ENTREGA_WEB',

      ?,

      ?,
      ?,

      ?,
      ?,

      'Entrega de pedido web al cliente'
    )
    `,
    [
      productoId,
      ventaId,
      usuarioId,

      cantidad,

      disponibleActual,
      disponibleActual,

      reservadoAnterior,
      reservadoNuevo
    ]
  );
}

  /*
  |--------------------------------------------------------------------------
  | Buscar y bloquear carrito
  |--------------------------------------------------------------------------
  */

  async obtenerCarritoActivoConBloqueo(
    connection: PoolConnection,
    clienteId: number
  ): Promise<CarritoCheckoutRow | null> {

    const [rows] =
      await connection.query<CarritoCheckoutRow[]>(
        `
        SELECT
          id_carrito,
          cliente_id
        FROM TB_CARRITO
        WHERE
          cliente_id = ?
          AND estado = 'ACTIVO'
        ORDER BY id_carrito DESC
        LIMIT 1
        FOR UPDATE
        `,
        [clienteId]
      );


    return rows.length > 0
      ? rows[0]
      : null;
  }


  /*
  |--------------------------------------------------------------------------
  | Obtener productos y bloquearlos
  |--------------------------------------------------------------------------
  */

  async obtenerDetallesConBloqueo(
    connection: PoolConnection,
    carritoId: number
  ): Promise<DetalleCheckoutRow[]> {

    const [rows] =
      await connection.query<DetalleCheckoutRow[]>(
        `
        SELECT
          dc.producto_id,
          dc.cantidad,

          p.codigo,
          p.nombre,
          p.unidad_medida,
          p.precio,

          p.stock_disponible,
          p.stock_reservado,

          p.estado,
          p.visible_web

        FROM TB_DETALLE_CARRITO dc

        INNER JOIN TB_PRODUCTO p
          ON p.id_producto = dc.producto_id

        WHERE dc.carrito_id = ?

        FOR UPDATE
        `,
        [carritoId]
      );


    return rows;
  }


  /*
  |--------------------------------------------------------------------------
  | Crear venta
  |--------------------------------------------------------------------------
  */

  async crearVenta(
    connection: PoolConnection,
    codigoVenta: string,
    clienteId: number,
    subtotal: number,
    igv: number,
    total: number
  ): Promise<number> {

    const [resultado] =
      await connection.execute<ResultSetHeader>(
        `
        INSERT INTO TB_VENTA (
          codigo_venta,
          cliente_id,
          usuario_id,
          canal_venta,
          estado,
          subtotal,
          igv,
          total
        )
        VALUES (
          ?,
          ?,
          NULL,
          'WEB',
          'PENDIENTE_PAGO',
          ?,
          ?,
          ?
        )
        `,
        [
          codigoVenta,
          clienteId,
          subtotal,
          igv,
          total
        ]
      );


    return resultado.insertId;
  }


  /*
  |--------------------------------------------------------------------------
  | Crear detalle
  |--------------------------------------------------------------------------
  */

  async crearDetalle(
    connection: PoolConnection,
    ventaId: number,
    productoId: number,
    productoNombre: string,
    unidadMedida: string,
    precioUnitario: number,
    cantidad: number,
    subtotal: number
  ): Promise<void> {

    await connection.execute(
      `
      INSERT INTO TB_DETALLE_VENTA (
        venta_id,
        producto_id,
        producto_nombre,
        unidad_medida,
        precio_unitario,
        cantidad,
        subtotal
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        ventaId,
        productoId,
        productoNombre,
        unidadMedida,
        precioUnitario,
        cantidad,
        subtotal
      ]
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Reservar stock
  |--------------------------------------------------------------------------
  */

  async actualizarStockReserva(
    connection: PoolConnection,
    productoId: number,
    stockDisponibleNuevo: number,
    stockReservadoNuevo: number
  ): Promise<void> {

    await connection.execute(
      `
      UPDATE TB_PRODUCTO
      SET
        stock_disponible = ?,
        stock_reservado = ?
      WHERE id_producto = ?
      `,
      [
        stockDisponibleNuevo,
        stockReservadoNuevo,
        productoId
      ]
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Registrar movimiento
  |--------------------------------------------------------------------------
  */

  async registrarMovimientoReserva(
    connection: PoolConnection,
    productoId: number,
    ventaId: number,
    cantidad: number,

    disponibleAnterior: number,
    disponibleNuevo: number,

    reservadoAnterior: number,
    reservadoNuevo: number
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
        ?,
        NULL,
        'RESERVA_WEB',
        ?,
        ?,
        ?,
        ?,
        ?,
        'Reserva de stock por compra web'
      )
      `,
      [
        productoId,
        ventaId,
        cantidad,

        disponibleAnterior,
        disponibleNuevo,

        reservadoAnterior,
        reservadoNuevo
      ]
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Historial inicial de la venta
  |--------------------------------------------------------------------------
  */

  async registrarHistorialCreacion(
    connection: PoolConnection,
    ventaId: number,
    clienteId: number
  ): Promise<void> {

    await connection.execute(
      `
      INSERT INTO TB_HISTORIAL_ESTADO_VENTA (
        venta_id,
        usuario_id,
        cliente_id,
        tipo_actor,
        estado_anterior,
        estado_nuevo,
        observacion
      )
      VALUES (
        ?,
        NULL,
        ?,
        'CLIENTE',
        NULL,
        'PENDIENTE_PAGO',
        'Venta web creada desde carrito'
      )
      `,
      [
        ventaId,
        clienteId
      ]
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Convertir carrito
  |--------------------------------------------------------------------------
  */

  async convertirCarrito(
    connection: PoolConnection,
    carritoId: number,
    ventaId: number
  ): Promise<void> {

    await connection.execute(
      `
      UPDATE TB_CARRITO
      SET
        estado = 'CONVERTIDO',
        venta_id = ?
      WHERE id_carrito = ?
      `,
      [
        ventaId,
        carritoId
      ]
    );
  }

  async actualizarStockLiberacion(
  connection: PoolConnection,

  productoId: number,

  stockDisponibleNuevo: number,

  stockReservadoNuevo: number
): Promise<void> {

  await connection.execute(
    `
    UPDATE TB_PRODUCTO

    SET
      stock_disponible = ?,
      stock_reservado = ?

    WHERE id_producto = ?
    `,
    [
      stockDisponibleNuevo,
      stockReservadoNuevo,
      productoId
    ]
  );
}

async registrarMovimientoLiberacion(
  connection: PoolConnection,

  productoId: number,

  ventaId: number,

  usuarioId: number,

  cantidad: number,

  disponibleAnterior: number,
  disponibleNuevo: number,

  reservadoAnterior: number,
  reservadoNuevo: number
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
      ?,
      ?,

      'LIBERACION_RESERVA',

      ?,

      ?,
      ?,

      ?,
      ?,

      'Liberación de stock por anulación de venta web'
    )
    `,
    [
      productoId,
      ventaId,
      usuarioId,

      cantidad,

      disponibleAnterior,
      disponibleNuevo,

      reservadoAnterior,
      reservadoNuevo
    ]
  );
}

async anularPagosPendientes(
  connection: PoolConnection,
  ventaId: number
): Promise<void> {

  await connection.execute(
    `
    UPDATE TB_PAGO

    SET estado_pago = 'ANULADO'

    WHERE
      venta_id = ?
      AND estado_pago = 'PENDIENTE'
    `,
    [ventaId]
  );
}

async registrarAnulacion(
  connection: PoolConnection,

  ventaId: number,

  usuarioId: number,

  estadoAnterior: EstadoVenta,

  motivo: string
): Promise<void> {

  await connection.execute(
    `
    INSERT INTO TB_HISTORIAL_ESTADO_VENTA (
      venta_id,
      usuario_id,
      cliente_id,

      tipo_actor,

      estado_anterior,
      estado_nuevo,

      observacion
    )

    VALUES (
      ?,
      ?,
      NULL,

      'USUARIO',

      ?,
      'ANULADA',

      ?
    )
    `,
    [
      ventaId,
      usuarioId,
      estadoAnterior,
      motivo
    ]
  );
}

async obtenerProductosTiendaConBloqueo(
  connection: PoolConnection,
  productoIds: number[]
): Promise<ProductoVentaTiendaRow[]> {

  const placeholders =
    productoIds
      .map(() => '?')
      .join(', ');


  const [rows] =
    await connection.query<
      ProductoVentaTiendaRow[]
    >(
      `
      SELECT
        id_producto,
        codigo,
        nombre,
        unidad_medida,
        precio,
        stock_disponible,
        stock_reservado,
        estado

      FROM TB_PRODUCTO

      WHERE id_producto IN (
        ${placeholders}
      )

      ORDER BY id_producto

      FOR UPDATE
      `,
      productoIds
    );


  return rows;
}

async crearVentaTienda(
  connection: PoolConnection,

  codigoVenta: string,

  clienteId: number | null,

  usuarioId: number,

  subtotal: number,

  igv: number,

  total: number
): Promise<number> {

  const [resultado] =
    await connection.execute<ResultSetHeader>(
      `
      INSERT INTO TB_VENTA (
        codigo_venta,
        cliente_id,
        usuario_id,
        canal_venta,
        estado,
        subtotal,
        igv,
        total
      )

      VALUES (
        ?,
        ?,
        ?,
        'TIENDA',
        'PAGADA',
        ?,
        ?,
        ?
      )
      `,
      [
        codigoVenta,
        clienteId,
        usuarioId,
        subtotal,
        igv,
        total
      ]
    );


  return resultado.insertId;
}

async actualizarStockVentaTienda(
  connection: PoolConnection,

  productoId: number,

  stockDisponibleNuevo: number
): Promise<void> {

  await connection.execute(
    `
    UPDATE TB_PRODUCTO

    SET stock_disponible = ?

    WHERE id_producto = ?
    `,
    [
      stockDisponibleNuevo,
      productoId
    ]
  );
}

async registrarMovimientoVentaTienda(
  connection: PoolConnection,

  productoId: number,

  ventaId: number,

  usuarioId: number,

  cantidad: number,

  disponibleAnterior: number,

  disponibleNuevo: number,

  reservadoActual: number
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
      ?,
      ?,

      'VENTA_TIENDA',

      ?,

      ?,
      ?,

      ?,
      ?,

      'Venta presencial'
    )
    `,
    [
      productoId,
      ventaId,
      usuarioId,

      cantidad,

      disponibleAnterior,
      disponibleNuevo,

      reservadoActual,
      reservadoActual
    ]
  );
}

async registrarHistorialVentaTiendaPagada(
  connection: PoolConnection,

  ventaId: number,

  usuarioId: number
): Promise<void> {

  await connection.execute(
    `
    INSERT INTO TB_HISTORIAL_ESTADO_VENTA (
      venta_id,
      usuario_id,
      cliente_id,
      tipo_actor,

      estado_anterior,
      estado_nuevo,

      observacion
    )

    VALUES (
      ?,
      ?,
      NULL,
      'USUARIO',

      NULL,
      'PAGADA',

      'Venta presencial registrada y pagada'
    )
    `,
    [
      ventaId,
      usuarioId
    ]
  );
}

async registrarHistorialVentaTiendaEntregada(
  connection: PoolConnection,

  ventaId: number,

  usuarioId: number
): Promise<void> {

  await connection.execute(
    `
    INSERT INTO TB_HISTORIAL_ESTADO_VENTA (
      venta_id,
      usuario_id,
      cliente_id,
      tipo_actor,

      estado_anterior,
      estado_nuevo,

      observacion
    )

    VALUES (
      ?,
      ?,
      NULL,
      'USUARIO',

      'PAGADA',
      'ENTREGADA',

      'Productos entregados durante venta presencial'
    )
    `,
    [
      ventaId,
      usuarioId
    ]
  );
}

async listarVentasWebPorCliente(
  clienteId: number
) {

  const [rows] =
    await pool.execute(
      `
      SELECT
        id_venta,
        codigo_venta,
        estado,
        subtotal,
        igv,
        total,
        fecha_creacion

      FROM TB_VENTA

      WHERE cliente_id = ?
        AND canal_venta = 'WEB'

      ORDER BY
        fecha_creacion DESC,
        id_venta DESC
      `,
      [
        clienteId
      ]
    );


  return rows;
}


async obtenerVentaWebPorCliente(
  ventaId: number,
  clienteId: number
) {

  const [rows] =
    await pool.execute(
      `
      SELECT
        id_venta,
        codigo_venta,
        cliente_id,
        estado,
        subtotal,
        igv,
        total,
        observacion,
        fecha_creacion

      FROM TB_VENTA

      WHERE id_venta = ?
        AND cliente_id = ?
        AND canal_venta = 'WEB'

      LIMIT 1
      `,
      [
        ventaId,
        clienteId
      ]
    );


  const ventas =
    rows as any[];


  return (
    ventas[0] ??
    null
  );
}


async listarDetallesVentaWebPorCliente(
  ventaId: number,
  clienteId: number
) {

  const [rows] =
    await pool.execute(
      `
      SELECT
        dv.id_detalle_venta,
        dv.producto_id,
        dv.producto_nombre,
        dv.unidad_medida,
        dv.precio_unitario,
        dv.cantidad,
        dv.subtotal

      FROM TB_DETALLE_VENTA dv

      INNER JOIN TB_VENTA v
        ON v.id_venta =
           dv.venta_id

      WHERE dv.venta_id = ?
        AND v.cliente_id = ?
        AND v.canal_venta = 'WEB'

      ORDER BY
        dv.id_detalle_venta
      `,
      [
        ventaId,
        clienteId
      ]
    );


  return rows;
}




}

