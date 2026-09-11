import {
  Response
} from 'express';

import {
  AuthRequest
} from '../middlewares/auth.middleware';

import {
  CarritoService
} from '../services/carrito.service';


const carritoService =
  new CarritoService();


export async function obtenerCarrito(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const clienteId =
      req.auth?.id;


    if (!clienteId) {

      res.status(401).json({
        success: false,
        message:
          'Cliente no autenticado'
      });

      return;
    }


    const carrito =
      await carritoService
        .obtenerCarrito(clienteId);


    res.status(200).json({
      success: true,
      data: carrito
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function agregarProducto(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const clienteId =
      req.auth?.id;


    if (!clienteId) {

      res.status(401).json({
        success: false,
        message:
          'Cliente no autenticado'
      });

      return;
    }


    const {
      producto_id,
      cantidad
    } = req.body ?? {};


    const carrito =
      await carritoService
        .agregarProducto(
          clienteId,
          Number(producto_id),
          cantidad
        );


    res.status(200).json({
      success: true,
      message:
        'Producto agregado al carrito',
      data: carrito
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function actualizarCantidad(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const clienteId =
      req.auth?.id;


    if (!clienteId) {

      res.status(401).json({
        success: false,
        message:
          'Cliente no autenticado'
      });

      return;
    }


    const productoId =
      Number(
        req.params.productoId
      );


    const {
      cantidad
    } = req.body ?? {};


    const carrito =
      await carritoService
        .actualizarCantidad(
          clienteId,
          productoId,
          cantidad
        );


    res.status(200).json({
      success: true,
      message:
        'Cantidad actualizada',
      data: carrito
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function eliminarProducto(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const clienteId =
      req.auth?.id;


    if (!clienteId) {

      res.status(401).json({
        success: false,
        message:
          'Cliente no autenticado'
      });

      return;
    }


    const productoId =
      Number(
        req.params.productoId
      );


    const carrito =
      await carritoService
        .eliminarProducto(
          clienteId,
          productoId
        );


    res.status(200).json({
      success: true,
      message:
        'Producto eliminado del carrito',
      data: carrito
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function vaciarCarrito(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const clienteId =
      req.auth?.id;


    if (!clienteId) {

      res.status(401).json({
        success: false,
        message:
          'Cliente no autenticado'
      });

      return;
    }


    const carrito =
      await carritoService
        .vaciarCarrito(clienteId);


    res.status(200).json({
      success: true,
      message:
        'Carrito vaciado correctamente',
      data: carrito
    });

  } catch (error) {

    manejarError(error, res);
  }
}


function manejarError(
  error: unknown,
  res: Response
): void {

  if (!(error instanceof Error)) {

    res.status(500).json({
      success: false,
      message:
        'Error interno del servidor'
    });

    return;
  }


  const errores400 = [
    'ID_INVALIDO',
    'CANTIDAD_INVALIDA'
  ];


  if (
    errores400.includes(
      error.message
    )
  ) {

    res.status(400).json({
      success: false,
      message: error.message
    });

    return;
  }


  const errores404 = [
    'PRODUCTO_NO_ENCONTRADO',
    'CARRITO_NO_ENCONTRADO',
    'PRODUCTO_NO_ESTA_EN_CARRITO'
  ];


  if (
    errores404.includes(
      error.message
    )
  ) {

    res.status(404).json({
      success: false,
      message: error.message
    });

    return;
  }


  const errores409 = [
    'PRODUCTO_INACTIVO',
    'PRODUCTO_NO_DISPONIBLE_WEB',
    'STOCK_INSUFICIENTE'
  ];


  if (
    errores409.includes(
      error.message
    )
  ) {

    res.status(409).json({
      success: false,
      message: error.message
    });

    return;
  }


  console.error(error);


  res.status(500).json({
    success: false,
    message:
      'Error interno del servidor'
  });
}