import {
  Carrito,
  DetalleCarrito
} from '../models/carrito.model';

import {
  CarritoRepository
} from '../repositories/carrito.repository';

import {
  ProductoRepository
} from '../repositories/producto.repository';


export class CarritoService {

  private carritoRepository =
    new CarritoRepository();

  private productoRepository =
    new ProductoRepository();


  /*
  |--------------------------------------------------------------------------
  | Obtener carrito
  |--------------------------------------------------------------------------
  */

  async obtenerCarrito(
  clienteId: number
): Promise<Carrito> {

  this.validarId(clienteId);


  let carrito =
    await this.carritoRepository
      .obtenerCarritoActivo(
        clienteId
      );


  if (!carrito) {

    await this.carritoRepository
      .crearCarrito(
        clienteId
      );

    carrito =
      await this.carritoRepository
        .obtenerCarritoActivo(
          clienteId
        );
  }


  if (!carrito) {

    throw new Error(
      'ERROR_CREAR_CARRITO'
    );
  }


  const rows =
    await this.carritoRepository
      .obtenerDetalles(
        carrito.id_carrito
      );


  const detalles: DetalleCarrito[] =
    rows.map(row => {

      const precio =
        Number(row.precio);

      const cantidad =
        Number(row.cantidad);


      return {

        id_detalle_carrito:
          row.id_detalle_carrito,

        producto_id:
          row.producto_id,

        codigo:
          row.codigo,

        nombre:
          row.nombre,

        unidad_medida:
          row.unidad_medida,

        precio,

        cantidad,

        subtotal:
          precio * cantidad,

        stock_disponible:
          Number(
            row.stock_disponible
          ),

        imagen_url:
          row.imagen_url
      };
    });


  const totalItems =
    detalles.reduce(
      (
        acumulado,
        detalle
      ) =>
        acumulado +
        detalle.cantidad,
      0
    );


  const subtotal =
    detalles.reduce(
      (
        acumulado,
        detalle
      ) =>
        acumulado +
        detalle.subtotal,
      0
    );


  return {

    id_carrito:
      carrito.id_carrito,

    cliente_id:
      carrito.cliente_id,

    estado:
      carrito.estado,

    fecha_creacion:
      carrito.fecha_creacion,

    fecha_actualizacion:
      carrito.fecha_actualizacion,

    detalles,

    total_items:
      totalItems,

    subtotal:
      Number(
        subtotal.toFixed(2)
      )
  };
}


  /*
  |--------------------------------------------------------------------------
  | Agregar producto
  |--------------------------------------------------------------------------
  */

  async agregarProducto(
  clienteId: number,
  productoId: number,
  cantidad: number
): Promise<Carrito> {

  this.validarId(clienteId);
  this.validarId(productoId);
  this.validarCantidad(cantidad);


  const producto =
    await this.productoRepository
      .obtenerPorId(
        productoId
      );


  if (!producto) {

    throw new Error(
      'PRODUCTO_NO_ENCONTRADO'
    );
  }


  if (
    producto.estado !== 'ACTIVO'
  ) {

    throw new Error(
      'PRODUCTO_INACTIVO'
    );
  }


  if (
    !producto.visible_web
  ) {

    throw new Error(
      'PRODUCTO_NO_DISPONIBLE_WEB'
    );
  }


  let carrito =
    await this.carritoRepository
      .obtenerCarritoActivo(
        clienteId
      );


  if (!carrito) {

    await this.carritoRepository
      .crearCarrito(
        clienteId
      );

    carrito =
      await this.carritoRepository
        .obtenerCarritoActivo(
          clienteId
        );
  }


  if (!carrito) {

    throw new Error(
      'ERROR_CREAR_CARRITO'
    );
  }


  const productoCarrito =
    await this.carritoRepository
      .obtenerProductoCarrito(
        carrito.id_carrito,
        productoId
      );


  const cantidadFinal =
    productoCarrito
      ? Number(
          productoCarrito.cantidad
        ) + cantidad
      : cantidad;


  if (
    cantidadFinal >
    producto.stock_disponible
  ) {

    throw new Error(
      'STOCK_INSUFICIENTE'
    );
  }


  if (productoCarrito) {

    await this.carritoRepository
      .actualizarCantidad(
        carrito.id_carrito,
        productoId,
        cantidadFinal
      );

  } else {

    await this.carritoRepository
      .agregarProducto(
        carrito.id_carrito,
        productoId,
        cantidad
      );
  }


  return this.obtenerCarrito(
    clienteId
  );
}

  

  /*
  |--------------------------------------------------------------------------
  | Actualizar cantidad
  |--------------------------------------------------------------------------
  */

  async actualizarCantidad(
    clienteId: number,
    productoId: number,
    cantidad: number
  ): Promise<Carrito> {

    this.validarId(clienteId);
    this.validarId(productoId);
    this.validarCantidad(cantidad);


    const carrito =
      await this.carritoRepository
        .obtenerCarritoActivo(
          clienteId
        );


    if (!carrito) {

      throw new Error(
        'CARRITO_NO_ENCONTRADO'
      );
    }


    const detalle =
      await this.carritoRepository
        .obtenerProductoCarrito(
          carrito.id_carrito,
          productoId
        );


    if (!detalle) {

      throw new Error(
        'PRODUCTO_NO_ESTA_EN_CARRITO'
      );
    }


    const producto =
      await this.productoRepository
        .obtenerPorId(
          productoId
        );


    if (!producto) {

      throw new Error(
        'PRODUCTO_NO_ENCONTRADO'
      );
    }


    if (
      producto.estado !== 'ACTIVO' ||
      !producto.visible_web
    ) {

      throw new Error(
        'PRODUCTO_NO_DISPONIBLE_WEB'
      );
    }


    if (
      cantidad >
      producto.stock_disponible
    ) {

      throw new Error(
        'STOCK_INSUFICIENTE'
      );
    }


    await this.carritoRepository
      .actualizarCantidad(
        carrito.id_carrito,
        productoId,
        cantidad
      );


    return this.obtenerCarrito(
      clienteId
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Eliminar producto
  |--------------------------------------------------------------------------
  */

  async eliminarProducto(
    clienteId: number,
    productoId: number
  ): Promise<Carrito> {

    this.validarId(clienteId);
    this.validarId(productoId);


    const carrito =
      await this.carritoRepository
        .obtenerCarritoActivo(
          clienteId
        );


    if (!carrito) {

      throw new Error(
        'CARRITO_NO_ENCONTRADO'
      );
    }


    const eliminado =
      await this.carritoRepository
        .eliminarProducto(
          carrito.id_carrito,
          productoId
        );


    if (!eliminado) {

      throw new Error(
        'PRODUCTO_NO_ESTA_EN_CARRITO'
      );
    }


    return this.obtenerCarrito(
      clienteId
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Vaciar carrito
  |--------------------------------------------------------------------------
  */

  async vaciarCarrito(
    clienteId: number
  ): Promise<Carrito> {

    this.validarId(clienteId);


    const carrito =
      await this.carritoRepository
        .obtenerCarritoActivo(
          clienteId
        );


    if (!carrito) {

      throw new Error(
        'CARRITO_NO_ENCONTRADO'
      );
    }


    await this.carritoRepository
      .vaciarCarrito(
        carrito.id_carrito
      );


    return this.obtenerCarrito(
      clienteId
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


  private validarCantidad(
    cantidad: number
  ): void {

    if (
      typeof cantidad !== 'number' ||
      !Number.isFinite(cantidad) ||
      cantidad <= 0
    ) {

      throw new Error(
        'CANTIDAD_INVALIDA'
      );
    }
  }
}