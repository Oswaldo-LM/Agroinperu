import {
  randomBytes
} from 'crypto';

import {
  pool
} from '../config/database';

import {
  CrearVentaTiendaDto,
  DetalleVentaResultado,
  EstadoVenta,
  VentaTiendaResultado,
  VentaWebDetalle,
  VentaWebResultado,
  VentaWebResumen
} from '../models/venta.model';

import {
  VentaRepository
} from '../repositories/venta.repository';

import {
  PoolConnection
} from 'mysql2/promise';

import {
  PagoRepository,
} from '../repositories/pago.repository';

import {
  ClienteRepository
} from '../repositories/cliente.repository';

import {
  ComprobanteRepository
} from '../repositories/comprobante.repository';

import {
  TipoComprobante
} from '../models/comprobante.model';

import {
  CajaService
} from './caja.service';


export class VentaService {

  private ventaRepository =
    new VentaRepository();

    private pagoRepository =
    new PagoRepository();

    private clienteRepository =
    new ClienteRepository();

  private comprobanteRepository =
    new ComprobanteRepository();

    private readonly cajaService =
  new CajaService();


  async reembolsarVentaWeb(
  usuarioId: number,

  ventaId: number,

  referenciaReembolso: string,

  motivo: string
): Promise<void> {

  this.validarId(
    usuarioId
  );

  this.validarId(
    ventaId
  );


  const referencia =
    referenciaReembolso
      ?.trim();


  if (!referencia) {

    throw new Error(
      'REFERENCIA_REEMBOLSO_OBLIGATORIA'
    );
  }


  if (
    referencia.length > 100
  ) {

    throw new Error(
      'REFERENCIA_REEMBOLSO_MUY_LARGA'
    );
  }


  const motivoLimpio =
    motivo?.trim();


  if (!motivoLimpio) {

    throw new Error(
      'MOTIVO_REEMBOLSO_OBLIGATORIO'
    );
  }


  if (
    motivoLimpio.length > 255
  ) {

    throw new Error(
      'MOTIVO_REEMBOLSO_MUY_LARGO'
    );
  }


  const connection =
    await pool.getConnection();


  try {

    await connection
      .beginTransaction();


    /*
    |--------------------------------------------------------------------------
    | 1. Bloquear la venta
    |--------------------------------------------------------------------------
    */

    const venta =
      await this.ventaRepository
        .obtenerVentaEstadoConBloqueo(
          connection,
          ventaId
        );


    if (!venta) {

      throw new Error(
        'VENTA_NO_ENCONTRADA'
      );
    }


    /*
    |--------------------------------------------------------------------------
    | 2. Validar estado
    |--------------------------------------------------------------------------
    */

    const estadosReembolsables:
      EstadoVenta[] = [

        'PAGADA',

        'EN_PREPARACION',

        'LISTA_PARA_RECOGER'
      ];


    if (
      !estadosReembolsables.includes(
        venta.estado
      )
    ) {

      if (
        venta.estado ===
        'ENTREGADA'
      ) {

        throw new Error(
          'VENTA_ENTREGADA_REQUIERE_DEVOLUCION'
        );
      }


      if (
        venta.estado ===
        'ANULADA'
      ) {

        throw new Error(
          'VENTA_YA_ANULADA'
        );
      }


      throw new Error(
        'VENTA_NO_REEMBOLSABLE'
      );
    }


    /*
    |--------------------------------------------------------------------------
    | 3. Buscar pago aprobado
    |--------------------------------------------------------------------------
    */

    const pago =
      await this.pagoRepository
        .obtenerPagoAprobadoVentaConBloqueo(
          connection,
          ventaId
        );


    if (!pago) {

      throw new Error(
        'PAGO_APROBADO_NO_ENCONTRADO'
      );
    }


    /*
    |--------------------------------------------------------------------------
    | 4. Obtener stock reservado
    |--------------------------------------------------------------------------
    */

    const detalles =
      await this.ventaRepository
        .obtenerDetallesStockConBloqueo(
          connection,
          ventaId
        );


    /*
    |--------------------------------------------------------------------------
    | 5. Liberar reserva
    |--------------------------------------------------------------------------
    */

    for (
      const detalle
      of detalles
    ) {

      const cantidad =
        Number(
          detalle.cantidad
        );


      const disponibleAnterior =
        Number(
          detalle.stock_disponible
        );


      const reservadoAnterior =
        Number(
          detalle.stock_reservado
        );


      if (
        reservadoAnterior <
        cantidad
      ) {

        throw new Error(
          `STOCK_RESERVADO_INSUFICIENTE:${detalle.producto_id}`
        );
      }


      const disponibleNuevo =
        this.redondear(
          disponibleAnterior +
          cantidad
        );


      const reservadoNuevo =
        this.redondear(
          reservadoAnterior -
          cantidad
        );


      await this.ventaRepository
        .actualizarStockLiberacion(
          connection,

          detalle.producto_id,

          disponibleNuevo,

          reservadoNuevo
        );


      await this.ventaRepository
        .registrarMovimientoLiberacion(
          connection,

          detalle.producto_id,

          ventaId,

          usuarioId,

          cantidad,

          disponibleAnterior,

          disponibleNuevo,

          reservadoAnterior,

          reservadoNuevo
        );
    }


    /*
    |--------------------------------------------------------------------------
    | 6. Marcar pago REEMBOLSADO
    |--------------------------------------------------------------------------
    */

    await this.pagoRepository
      .marcarPagoReembolsado(
        connection,

        pago.id_pago,

        referencia,

        motivoLimpio
      );

    /*
|--------------------------------------------------------------------------
| Anular comprobantes de la venta
|--------------------------------------------------------------------------
*/

await this.comprobanteRepository
  .anularEmitidosPorVenta(
    connection,

    ventaId,

    usuarioId,

    `Venta anulada por reembolso: ${motivoLimpio}`
  );


    /*
    |--------------------------------------------------------------------------
    | 7. Anular venta
    |--------------------------------------------------------------------------
    */

    await this.ventaRepository
      .actualizarEstado(
        connection,

        ventaId,

        'ANULADA'
      );


    /*
    |--------------------------------------------------------------------------
    | 8. Historial
    |--------------------------------------------------------------------------
    */

    await this.ventaRepository
      .registrarAnulacion(
        connection,

        ventaId,

        usuarioId,

        venta.estado,

        `Reembolso: ${motivoLimpio}`
      );


    /*
    |--------------------------------------------------------------------------
    | 9. COMMIT
    |--------------------------------------------------------------------------
    */

    await connection.commit();


  } catch (error) {

    await connection.rollback();

    throw error;


  } finally {

    connection.release();
  }
}

  async confirmarVentaWeb(
    clienteId: number
  ): Promise<VentaWebResultado> {

    this.validarId(clienteId);


    const connection =
      await pool.getConnection();


    try {

      /*
      |--------------------------------------------------------------------------
      | INICIO DE TRANSACCIÓN
      |--------------------------------------------------------------------------
      */

      await connection.beginTransaction();


      /*
      |--------------------------------------------------------------------------
      | 1. Buscar carrito
      |--------------------------------------------------------------------------
      */

      const carrito =
        await this.ventaRepository
          .obtenerCarritoActivoConBloqueo(
            connection,
            clienteId
          );


      if (!carrito) {

        throw new Error(
          'CARRITO_NO_ENCONTRADO'
        );
      }


      /*
      |--------------------------------------------------------------------------
      | 2. Obtener productos
      |--------------------------------------------------------------------------
      */

      const productos =
        await this.ventaRepository
          .obtenerDetallesConBloqueo(
            connection,
            carrito.id_carrito
          );


      if (productos.length === 0) {

        throw new Error(
          'CARRITO_VACIO'
        );
      }


      /*
      |--------------------------------------------------------------------------
      | 3. Validar productos y calcular montos
      |--------------------------------------------------------------------------
      */

      const detalles:
        DetalleVentaResultado[] = [];


      let subtotalVenta = 0;


      for (const producto of productos) {

        if (
          producto.estado !== 'ACTIVO' ||
          !Boolean(producto.visible_web)
        ) {

          throw new Error(
            `PRODUCTO_NO_DISPONIBLE:${producto.producto_id}`
          );
        }


        const precio =
          Number(producto.precio);

        const cantidad =
          Number(producto.cantidad);

        const stockDisponible =
          Number(
            producto.stock_disponible
          );


        if (
          !Number.isFinite(cantidad) ||
          cantidad <= 0
        ) {

          throw new Error(
            'CANTIDAD_INVALIDA'
          );
        }


        if (
          cantidad >
          stockDisponible
        ) {

          throw new Error(
            `STOCK_INSUFICIENTE:${producto.producto_id}`
          );
        }


        const subtotalDetalle =
          this.redondear(
            precio * cantidad
          );


        subtotalVenta =
          this.redondear(
            subtotalVenta +
            subtotalDetalle
          );


        detalles.push({
          producto_id:
            producto.producto_id,

          codigo:
            producto.codigo,

          producto_nombre:
            producto.nombre,

          unidad_medida:
            producto.unidad_medida,

          precio_unitario:
            precio,

          cantidad,

          subtotal:
            subtotalDetalle
        });
      }


      /*
      |--------------------------------------------------------------------------
      | 4. Calcular IGV
      |--------------------------------------------------------------------------
      */

      const igv =
        this.redondear(
          subtotalVenta * 0.18
        );


      const total =
        this.redondear(
          subtotalVenta + igv
        );


      /*
      |--------------------------------------------------------------------------
      | 5. Crear venta
      |--------------------------------------------------------------------------
      */

      const codigoVenta =
        this.generarCodigoVenta();


      const ventaId =
        await this.ventaRepository
          .crearVenta(
            connection,
            codigoVenta,
            clienteId,
            subtotalVenta,
            igv,
            total
          );


      /*
      |--------------------------------------------------------------------------
      | 6. Detalles + reserva de stock
      |--------------------------------------------------------------------------
      */

      for (
        let i = 0;
        i < productos.length;
        i++
      ) {

        const producto =
          productos[i];

        const detalle =
          detalles[i];


        await this.ventaRepository
          .crearDetalle(
            connection,
            ventaId,

            producto.producto_id,

            producto.nombre,

            producto.unidad_medida,

            detalle.precio_unitario,

            detalle.cantidad,

            detalle.subtotal
          );


        /*
        |--------------------------------------------------------------------------
        | Stock anterior
        |--------------------------------------------------------------------------
        */

        const disponibleAnterior =
          Number(
            producto.stock_disponible
          );

        const reservadoAnterior =
          Number(
            producto.stock_reservado
          );


        /*
        |--------------------------------------------------------------------------
        | Stock nuevo
        |--------------------------------------------------------------------------
        */

        const disponibleNuevo =
          this.redondear(
            disponibleAnterior -
            detalle.cantidad
          );

        const reservadoNuevo =
          this.redondear(
            reservadoAnterior +
            detalle.cantidad
          );


        await this.ventaRepository
          .actualizarStockReserva(
            connection,
            producto.producto_id,
            disponibleNuevo,
            reservadoNuevo
          );


        /*
        |--------------------------------------------------------------------------
        | Movimiento de inventario
        |--------------------------------------------------------------------------
        */

        await this.ventaRepository
          .registrarMovimientoReserva(
            connection,

            producto.producto_id,

            ventaId,

            detalle.cantidad,

            disponibleAnterior,
            disponibleNuevo,

            reservadoAnterior,
            reservadoNuevo
          );
      }


      /*
      |--------------------------------------------------------------------------
      | 7. Historial de estado
      |--------------------------------------------------------------------------
      */

      await this.ventaRepository
        .registrarHistorialCreacion(
          connection,
          ventaId,
          clienteId
        );


      /*
      |--------------------------------------------------------------------------
      | 8. Carrito convertido
      |--------------------------------------------------------------------------
      */

      await this.ventaRepository
        .convertirCarrito(
          connection,
          carrito.id_carrito,
          ventaId
        );


      /*
      |--------------------------------------------------------------------------
      | 9. Confirmar todo
      |--------------------------------------------------------------------------
      */

      await connection.commit();


      return {
        id_venta:
          ventaId,

        codigo_venta:
          codigoVenta,

        cliente_id:
          clienteId,

        canal_venta:
          'WEB',

        estado:
          'PENDIENTE_PAGO',

        subtotal:
          subtotalVenta,

        igv,

        total,

        detalles
      };


    } catch (error) {

      /*
      |--------------------------------------------------------------------------
      | Si algo falla, deshacer TODO
      |--------------------------------------------------------------------------
      */

      await connection.rollback();

      throw error;


    } finally {

      connection.release();
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Código de venta
  |--------------------------------------------------------------------------
  */

  private generarCodigoVenta(): string {

    const ahora =
      new Date();


    const fecha =
      [
        ahora.getFullYear(),

        String(
          ahora.getMonth() + 1
        ).padStart(2, '0'),

        String(
          ahora.getDate()
        ).padStart(2, '0')
      ].join('');


    const aleatorio =
      randomBytes(4)
        .toString('hex')
        .toUpperCase();


    return `WEB-${fecha}-${aleatorio}`;
  }

  private generarCodigoVentaTienda(): string {

  const ahora =
    new Date();


  const fecha =
    [
      ahora.getFullYear(),

      String(
        ahora.getMonth() + 1
      ).padStart(2, '0'),

      String(
        ahora.getDate()
      ).padStart(2, '0')
    ].join('');


  const aleatorio =
    randomBytes(4)
      .toString('hex')
      .toUpperCase();


  return `TIENDA-${fecha}-${aleatorio}`;
}


  /*
  |--------------------------------------------------------------------------
  | Dinero
  |--------------------------------------------------------------------------
  */

  private redondear(
    valor: number
  ): number {

    return Number(
      valor.toFixed(2)
    );
  }


  private validarId(
    id: number
  ): void {

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      throw new Error(
        'ID_INVALIDO'
      );
    }
  }

  async listarVentasWeb(
  estado?: EstadoVenta
): Promise<VentaWebResumen[]> {

  if (estado) {
    this.validarEstado(estado);
  }

  return this.ventaRepository
    .listarVentasWeb(estado);
}


  async obtenerVentaWeb(
  ventaId: number
 ): Promise<VentaWebDetalle> {

  this.validarId(
    ventaId
  );


  const venta =
    await this.ventaRepository
      .obtenerVentaWebPorId(
        ventaId
      );


  if (!venta) {

    throw new Error(
      'VENTA_NO_ENCONTRADA'
    );
  }


  return venta;
 }

 async cambiarEstadoVentaWeb(
  usuarioId: number,

  ventaId: number,

  nuevoEstado: EstadoVenta
): Promise<void> {

  this.validarId(
    usuarioId
  );

  this.validarId(
    ventaId
  );

  this.validarEstado(
    nuevoEstado
  );


  const connection =
    await pool.getConnection();


  try {

    await connection
      .beginTransaction();


    const venta =
      await this.ventaRepository
        .obtenerVentaEstadoConBloqueo(
          connection,
          ventaId
        );


    if (!venta) {

      throw new Error(
        'VENTA_NO_ENCONTRADA'
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Validar transición
    |--------------------------------------------------------------------------
    */

    this.validarTransicion(
      venta.estado,
      nuevoEstado
    );


    /*
    |--------------------------------------------------------------------------
    | Si pasa a ENTREGADA,
    | consumimos la reserva.
    |--------------------------------------------------------------------------
    */

    if (
      nuevoEstado ===
      'ENTREGADA'
    ) {

      await this.procesarEntrega(
        connection,
        usuarioId,
        ventaId
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Actualizar venta
    |--------------------------------------------------------------------------
    */

    await this.ventaRepository
      .actualizarEstado(
        connection,
        ventaId,
        nuevoEstado
      );


    /*
    |--------------------------------------------------------------------------
    | Historial
    |--------------------------------------------------------------------------
    */

    await this.ventaRepository
      .registrarCambioEstado(
        connection,

        ventaId,

        usuarioId,

        venta.estado,

        nuevoEstado
      );


    await connection.commit();


  } catch (error) {

    await connection.rollback();

    throw error;


  } finally {

    connection.release();
  }
}

private async procesarEntrega(
  connection: 
    import('mysql2/promise')
      .PoolConnection,

  usuarioId: number,

  ventaId: number
): Promise<void> {

  const detalles =
    await this.ventaRepository
      .obtenerDetallesStockConBloqueo(
        connection,
        ventaId
      );


  for (const detalle of detalles) {

    const cantidad =
      Number(
        detalle.cantidad
      );


    const disponibleActual =
      Number(
        detalle.stock_disponible
      );


    const reservadoAnterior =
      Number(
        detalle.stock_reservado
      );


    if (
      reservadoAnterior <
      cantidad
    ) {

      throw new Error(
        `STOCK_RESERVADO_INSUFICIENTE:${detalle.producto_id}`
      );
    }


    const reservadoNuevo =
      this.redondear(
        reservadoAnterior -
        cantidad
      );


    await this.ventaRepository
      .actualizarStockEntrega(
        connection,

        detalle.producto_id,

        reservadoNuevo
      );


    await this.ventaRepository
      .registrarMovimientoEntrega(
        connection,

        detalle.producto_id,

        ventaId,

        usuarioId,

        cantidad,

        disponibleActual,

        reservadoAnterior,

        reservadoNuevo
      );
  }
}

private validarTransicion(
  actual: EstadoVenta,
  nuevo: EstadoVenta
): void {

  const transiciones:
    Partial<
      Record<
        EstadoVenta,
        EstadoVenta[]
      >
    > = {

      PAGADA: [
        'EN_PREPARACION'
      ],

      EN_PREPARACION: [
        'LISTA_PARA_RECOGER'
      ],

      LISTA_PARA_RECOGER: [
        'ENTREGADA'
      ]
    };


  const permitidos =
    transiciones[actual] ?? [];


  if (
    !permitidos.includes(
      nuevo
    )
  ) {

    throw new Error(
      `TRANSICION_ESTADO_INVALIDA:${actual}:${nuevo}`
    );
  }
}

private validarEstado(
  estado: EstadoVenta
): void {

  const estados:
    EstadoVenta[] = [

      'PENDIENTE_PAGO',

      'PAGADA',

      'EN_PREPARACION',

      'LISTA_PARA_RECOGER',

      'ENTREGADA',

      'ANULADA'
    ];


  if (
    !estados.includes(
      estado
    )
  ) {

    throw new Error(
      'ESTADO_INVALIDO'
    );
  }
}

async anularVentaWeb(
  usuarioId: number,
  ventaId: number,
  motivo: string
): Promise<void> {

  this.validarId(usuarioId);
  this.validarId(ventaId);


  const motivoLimpio =
    motivo?.trim();


  if (!motivoLimpio) {

    throw new Error(
      'MOTIVO_ANULACION_OBLIGATORIO'
    );
  }


  if (
    motivoLimpio.length > 255
  ) {

    throw new Error(
      'MOTIVO_ANULACION_MUY_LARGO'
    );
  }


  const connection =
    await pool.getConnection();


  try {

    await connection
      .beginTransaction();


    /*
    |--------------------------------------------------------------------------
    | 1. Bloquear venta
    |--------------------------------------------------------------------------
    */

    const venta =
      await this.ventaRepository
        .obtenerVentaEstadoConBloqueo(
          connection,
          ventaId
        );


    if (!venta) {

      throw new Error(
        'VENTA_NO_ENCONTRADA'
      );
    }


    /*
    |--------------------------------------------------------------------------
    | 2. Validar estado
    |--------------------------------------------------------------------------
    */

    if (
      venta.estado === 'ANULADA'
    ) {

      throw new Error(
        'VENTA_YA_ANULADA'
      );
    }


    if (
      venta.estado === 'ENTREGADA'
    ) {

      throw new Error(
        'VENTA_ENTREGADA_NO_ANULABLE'
      );
    }


    /*
     * Una venta pagada requiere primero
     * proceso real de reembolso.
     */
    if (
      venta.estado === 'PAGADA' ||
      venta.estado === 'EN_PREPARACION' ||
      venta.estado === 'LISTA_PARA_RECOGER'
    ) {

      throw new Error(
        'REEMBOLSO_REQUERIDO'
      );
    }


    if (
      venta.estado !==
      'PENDIENTE_PAGO'
    ) {

      throw new Error(
        'VENTA_NO_ANULABLE'
      );
    }


    /*
    |--------------------------------------------------------------------------
    | 3. Obtener productos reservados
    |--------------------------------------------------------------------------
    */

    const detalles =
      await this.ventaRepository
        .obtenerDetallesStockConBloqueo(
          connection,
          ventaId
        );


    /*
    |--------------------------------------------------------------------------
    | 4. Liberar reserva producto por producto
    |--------------------------------------------------------------------------
    */

    for (const detalle of detalles) {

      const cantidad =
        Number(
          detalle.cantidad
        );


      const disponibleAnterior =
        Number(
          detalle.stock_disponible
        );


      const reservadoAnterior =
        Number(
          detalle.stock_reservado
        );


      if (
        reservadoAnterior <
        cantidad
      ) {

        throw new Error(
          `STOCK_RESERVADO_INSUFICIENTE:${detalle.producto_id}`
        );
      }


      const disponibleNuevo =
        this.redondear(
          disponibleAnterior +
          cantidad
        );


      const reservadoNuevo =
        this.redondear(
          reservadoAnterior -
          cantidad
        );


      await this.ventaRepository
        .actualizarStockLiberacion(
          connection,

          detalle.producto_id,

          disponibleNuevo,

          reservadoNuevo
        );


      await this.ventaRepository
        .registrarMovimientoLiberacion(
          connection,

          detalle.producto_id,

          ventaId,

          usuarioId,

          cantidad,

          disponibleAnterior,
          disponibleNuevo,

          reservadoAnterior,
          reservadoNuevo
        );
    }


    /*
    |--------------------------------------------------------------------------
    | 5. Anular pagos pendientes
    |--------------------------------------------------------------------------
    */

    await this.ventaRepository
      .anularPagosPendientes(
        connection,
        ventaId,
        
      );

    /*
|--------------------------------------------------------------------------
| . Anular comprobantes emitidos
|--------------------------------------------------------------------------
*/
    await this.comprobanteRepository
      .anularEmitidosPorVenta(
    connection,

    ventaId,

    usuarioId,

    `Venta anulada: ${motivoLimpio}`
  );


    /*
    |--------------------------------------------------------------------------
    | 6. Cambiar venta a ANULADA
    |--------------------------------------------------------------------------
    */

    await this.ventaRepository
      .actualizarEstado(
        connection,
        ventaId,
        'ANULADA'
      );


    /*
    |--------------------------------------------------------------------------
    | 7. Registrar historial
    |--------------------------------------------------------------------------
    */

    await this.ventaRepository
      .registrarAnulacion(
        connection,

        ventaId,

        usuarioId,

        venta.estado,

        motivoLimpio
      );


    /*
    |--------------------------------------------------------------------------
    | 8. Confirmar transacción
    |--------------------------------------------------------------------------
    */

    await connection.commit();


  } catch (error) {

    await connection.rollback();

    throw error;


  } finally {

    connection.release();
  }
}
 

async crearVentaTienda(
  usuarioId: number,
  datos: CrearVentaTiendaDto
): Promise<VentaTiendaResultado> {


  await this.cajaService
  .verificarCajaAbierta(
    usuarioId
  );

  this.validarId(
    usuarioId
  );


  if (!datos) {

    throw new Error(
      'DATOS_VENTA_OBLIGATORIOS'
    );
    
  }


  /*
|--------------------------------------------------------------------------
| Tipo de comprobante
|--------------------------------------------------------------------------
*/

const tipoComprobante =
  datos.tipo_comprobante;


this.validarTipoComprobanteTienda(
  tipoComprobante
);

  


  /*
  |--------------------------------------------------------------------------
  | Cliente opcional
  |--------------------------------------------------------------------------
  */

  let clienteId:
    number | null = null;


  if (
    datos.cliente_id !== undefined &&
    datos.cliente_id !== null
  ) {

    clienteId =
      Number(
        datos.cliente_id
      );


    this.validarId(
      clienteId
    );


    const cliente =
      await this.clienteRepository
        .obtenerPorId(
          clienteId
        );


    if (!cliente) {

      throw new Error(
        'CLIENTE_NO_ENCONTRADO'
      );
    }


    if (
      cliente.estado !==
      'ACTIVO'
    ) {

      throw new Error(
        'CLIENTE_INACTIVO'
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Método de pago
  |--------------------------------------------------------------------------
  */

  const metodoPago =
    datos.metodo_pago;


  this.validarMetodoPagoTienda(
    metodoPago
  );


  const referencia =
    this.validarReferenciaPagoTienda(
      metodoPago,
      datos.referencia_transaccion
    );


  /*
  |--------------------------------------------------------------------------
  | Productos
  |--------------------------------------------------------------------------
  */

  if (
    !Array.isArray(
      datos.productos
    ) ||
    datos.productos.length === 0
  ) {

    throw new Error(
      'PRODUCTOS_OBLIGATORIOS'
    );
  }


  /*
   * Consolidamos productos repetidos.
   *
   * Producto #4 cantidad 2
   * Producto #4 cantidad 3
   *
   * pasa a:
   *
   * Producto #4 cantidad 5
   */
  const cantidades =
    new Map<number, number>();


  for (
    const item
    of datos.productos
  ) {

    const productoId =
      Number(
        item.producto_id
      );

    const cantidad =
      Number(
        item.cantidad
      );


    this.validarId(
      productoId
    );


    if (
      !Number.isFinite(cantidad) ||
      cantidad <= 0
    ) {

      throw new Error(
        'CANTIDAD_INVALIDA'
      );
    }


    cantidades.set(
      productoId,

      (
        cantidades.get(
          productoId
        ) ?? 0
      ) + cantidad
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Transacción
  |--------------------------------------------------------------------------
  */

  const connection =
    await pool.getConnection();


  try {

    await connection
      .beginTransaction();


    /*
    |--------------------------------------------------------------------------
    | Bloquear productos
    |--------------------------------------------------------------------------
    */

    const productoIds =
      Array.from(
        cantidades.keys()
      ).sort(
        (a, b) => a - b
      );


    const productos =
      await this.ventaRepository
        .obtenerProductosTiendaConBloqueo(
          connection,
          productoIds
        );


    /*
    |--------------------------------------------------------------------------
    | Verificar productos inexistentes
    |--------------------------------------------------------------------------
    */

    if (
      productos.length !==
      productoIds.length
    ) {

      const encontrados =
        new Set(
          productos.map(
            producto =>
              producto.id_producto
          )
        );


      const faltante =
        productoIds.find(
          id =>
            !encontrados.has(id)
        );


      throw new Error(
        `PRODUCTO_NO_ENCONTRADO:${faltante}`
      );
    }


    const detalles:
      DetalleVentaResultado[] = [];


    let subtotalVenta = 0;


    /*
    |--------------------------------------------------------------------------
    | Validar stock y calcular
    |--------------------------------------------------------------------------
    */

    for (
      const producto
      of productos
    ) {

      if (
        producto.estado !==
        'ACTIVO'
      ) {

        throw new Error(
          `PRODUCTO_INACTIVO:${producto.id_producto}`
        );
      }


      const cantidad =
        cantidades.get(
          producto.id_producto
        )!;


      /*
       * UNIDAD, ROLLO y CAJA
       * deben utilizar cantidades enteras.
       *
       * METRO sí puede usar decimales.
       */
      if (
        producto.unidad_medida !==
          'METRO' &&

        !Number.isInteger(
          cantidad
        )
      ) {

        throw new Error(
          `CANTIDAD_FRACCIONARIA_INVALIDA:${producto.id_producto}`
        );
      }


      const stockDisponible =
        Number(
          producto.stock_disponible
        );


      if (
        cantidad >
        stockDisponible
      ) {

        throw new Error(
          `STOCK_INSUFICIENTE:${producto.id_producto}`
        );
      }


      const precio =
        Number(
          producto.precio
        );


      const subtotalDetalle =
        this.redondear(
          precio * cantidad
        );


      subtotalVenta =
        this.redondear(
          subtotalVenta +
          subtotalDetalle
        );


      detalles.push({

        producto_id:
          producto.id_producto,

        codigo:
          producto.codigo,

        producto_nombre:
          producto.nombre,

        unidad_medida:
          producto.unidad_medida,

        precio_unitario:
          precio,

        cantidad,

        subtotal:
          subtotalDetalle
      });
    }


    /*
    |--------------------------------------------------------------------------
    | Totales
    |--------------------------------------------------------------------------
    */

    const igv =
      this.redondear(
        subtotalVenta * 0.18
      );


    const total =
      this.redondear(
        subtotalVenta + igv
      );


    /*
    |--------------------------------------------------------------------------
    | Crear venta
    |--------------------------------------------------------------------------
    */

    const codigoVenta =
      this.generarCodigoVentaTienda();


    const ventaId =
      await this.ventaRepository
        .crearVentaTienda(
          connection,

          codigoVenta,

          clienteId,

          usuarioId,

          subtotalVenta,

          igv,

          total
        );


    /*
    |--------------------------------------------------------------------------
    | Crear detalles y descontar stock
    |--------------------------------------------------------------------------
    */

    for (
      let i = 0;
      i < productos.length;
      i++
    ) {

      const producto =
        productos[i];

      const detalle =
        detalles[i];


      await this.ventaRepository
        .crearDetalle(
          connection,

          ventaId,

          producto.id_producto,

          producto.nombre,

          producto.unidad_medida,

          detalle.precio_unitario,

          detalle.cantidad,

          detalle.subtotal
        );


      const disponibleAnterior =
        Number(
          producto.stock_disponible
        );


      const disponibleNuevo =
        this.redondear(
          disponibleAnterior -
          detalle.cantidad
        );


      const reservadoActual =
        Number(
          producto.stock_reservado
        );


      await this.ventaRepository
        .actualizarStockVentaTienda(
          connection,

          producto.id_producto,

          disponibleNuevo
        );


      await this.ventaRepository
        .registrarMovimientoVentaTienda(
          connection,

          producto.id_producto,

          ventaId,

          usuarioId,

          detalle.cantidad,

          disponibleAnterior,

          disponibleNuevo,

          reservadoActual
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Registrar pago aprobado
    |--------------------------------------------------------------------------
    */

    await this.pagoRepository
      .crearPagoTiendaAprobado(
        connection,

        ventaId,

        metodoPago,

        total,

        referencia
      );


    /*
|--------------------------------------------------------------------------
| Historial: PAGADA
|--------------------------------------------------------------------------
*/

await this.ventaRepository
  .registrarHistorialVentaTiendaPagada(
    connection,
    ventaId,
    usuarioId
  );


/*
|--------------------------------------------------------------------------
| Entrega inmediata
|--------------------------------------------------------------------------
*/

await this.ventaRepository
  .actualizarEstado(
    connection,
    ventaId,
    'ENTREGADA'
  );


await this.ventaRepository
  .registrarHistorialVentaTiendaEntregada(
    connection,
    ventaId,
    usuarioId
  );


/*
|--------------------------------------------------------------------------
| Obtener datos fiscales
|--------------------------------------------------------------------------
*/

const datosFiscales =
  await this.comprobanteRepository
    .obtenerVentaConBloqueo(
      connection,
      ventaId
    );


if (!datosFiscales) {

  throw new Error(
    'VENTA_NO_ENCONTRADA'
  );
}


/*
|--------------------------------------------------------------------------
| Validar factura
|--------------------------------------------------------------------------
*/

if (
  tipoComprobante ===
  'FACTURA'
) {

  if (
    datosFiscales.tipo_documento !==
      'RUC' ||

    !datosFiscales.numero_documento ||

    !datosFiscales.razon_social
  ) {

    throw new Error(
      'FACTURA_REQUIERE_RUC'
    );
  }
}


/*
|--------------------------------------------------------------------------
| Snapshot del cliente
|--------------------------------------------------------------------------
*/

const nombreClienteComprobante =

  datosFiscales.tipo_cliente ===
    'EMPRESA'

    ? datosFiscales.razon_social

    : [
        datosFiscales.nombres,
        datosFiscales.apellidos
      ]
        .filter(Boolean)
        .join(' ')
        || 'CLIENTE GENERAL';


/*
|--------------------------------------------------------------------------
| Serie
|--------------------------------------------------------------------------
*/

const serie =
  this.obtenerSerieComprobanteTienda(
    tipoComprobante
  );


/*
|--------------------------------------------------------------------------
| Número temporal
|--------------------------------------------------------------------------
*/

const numeroTemporal =
  `TMP-${randomBytes(6)
    .toString('hex')
    .toUpperCase()}`;


/*
|--------------------------------------------------------------------------
| Crear comprobante
|--------------------------------------------------------------------------
*/

const comprobanteId =
  await this.comprobanteRepository
    .crear(
      connection,

      ventaId,

      usuarioId,

      tipoComprobante,

      serie,

      numeroTemporal,

      datosFiscales.tipo_documento,

      datosFiscales.numero_documento,

      nombreClienteComprobante,

      datosFiscales.direccion,

      subtotalVenta,

      igv,

      total
    );


/*
|--------------------------------------------------------------------------
| Número definitivo
|--------------------------------------------------------------------------
*/

const numeroComprobante =
  String(
    comprobanteId
  ).padStart(
    8,
    '0'
  );


await this.comprobanteRepository
  .actualizarNumero(
    connection,

    comprobanteId,

    numeroComprobante
  );


/*
|--------------------------------------------------------------------------
| Confirmar toda la venta
|--------------------------------------------------------------------------
*/

await connection.commit();


return {

  id_venta:
    ventaId,

  codigo_venta:
    codigoVenta,

  cliente_id:
    clienteId,

  usuario_id:
    usuarioId,

  canal_venta:
    'TIENDA',

  estado:
    'ENTREGADA',

  subtotal:
    subtotalVenta,

  igv,

  total,

  metodo_pago:
    metodoPago,

  comprobante: {

    id_comprobante:
      comprobanteId,

    tipo_comprobante:
      tipoComprobante,

    serie,

    numero:
      numeroComprobante
  },

  detalles
};


  } catch (error) {

    await connection.rollback();

    throw error;


  } finally {

    connection.release();
  }
}

private validarMetodoPagoTienda(
  metodo:
    | 'EFECTIVO'
    | 'TARJETA'
    | 'YAPE'
    | 'PLIN'
    | 'TRANSFERENCIA'
): void {

  const permitidos = [
    'EFECTIVO',
    'TARJETA',
    'YAPE',
    'PLIN',
    'TRANSFERENCIA'
  ];


  if (
    !permitidos.includes(
      metodo
    )
  ) {

    throw new Error(
      'METODO_PAGO_INVALIDO'
    );
  }
}

private validarReferenciaPagoTienda(
  metodo: string,

  referencia?: string | null
): string | null {

  const valor =
    referencia?.trim()
    || null;


  /*
   * Efectivo no necesita
   * referencia de transacción.
   */
  if (
    metodo ===
    'EFECTIVO'
  ) {

    return valor;
  }


  /*
   * Los métodos electrónicos
   * sí requieren referencia.
   */
  if (!valor) {

    throw new Error(
      'REFERENCIA_PAGO_OBLIGATORIA'
    );
  }


  if (
    valor.length > 100
  ) {

    throw new Error(
      'REFERENCIA_PAGO_MUY_LARGA'
    );
  }


  return valor;
}

private validarTipoComprobanteTienda(
  tipo: TipoComprobante
): void {

  const permitidos:
    TipoComprobante[] = [

      'BOLETA',
      'FACTURA',
      'NOTA_VENTA'
    ];


  if (
    !permitidos.includes(
      tipo
    )
  ) {

    throw new Error(
      'TIPO_COMPROBANTE_INVALIDO'
    );
  }
}

private obtenerSerieComprobanteTienda(
  tipo: TipoComprobante
): string {

  switch (tipo) {

    case 'BOLETA':

      return 'B001';


    case 'FACTURA':

      return 'F001';


    case 'NOTA_VENTA':

      return 'NV001';


    default:

      throw new Error(
        'TIPO_COMPROBANTE_INVALIDO'
      );
  }
}

async listarMisPedidos(
  clienteId: number
) {

  if (
    !Number.isInteger(clienteId) ||
    clienteId <= 0
  ) {

    throw new Error(
      'CLIENTE_INVALIDO'
    );
  }


  return this.ventaRepository
    .listarVentasWebPorCliente(
      clienteId
    );
}


async obtenerMiPedido(
  clienteId: number,
  ventaId: number
) {

  if (
    !Number.isInteger(clienteId) ||
    clienteId <= 0
  ) {

    throw new Error(
      'CLIENTE_INVALIDO'
    );
  }


  if (
    !Number.isInteger(ventaId) ||
    ventaId <= 0
  ) {

    throw new Error(
      'ID_VENTA_INVALIDO'
    );
  }


  const venta =
    await this.ventaRepository
      .obtenerVentaWebPorCliente(
        ventaId,
        clienteId
      );


  if (!venta) {

    throw new Error(
      'VENTA_NO_ENCONTRADA'
    );
  }


  const detalles =
    await this.ventaRepository
      .listarDetallesVentaWebPorCliente(
        ventaId,
        clienteId
      );


  return {

    ...venta,

    detalles
  };
}

}