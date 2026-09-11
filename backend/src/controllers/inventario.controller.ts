import {
  Response
} from 'express';

import {
  AuthRequest
} from '../middlewares/auth.middleware';

import {
  InventarioService
} from '../services/inventario.service';


const inventarioService =
  new InventarioService();


export async function registrarEntrada(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const usuarioId =
      req.auth?.id;


    if (!usuarioId) {

      res.status(401).json({
        success: false,
        message:
          'Usuario no autenticado'
      });

      return;
    }


    const resultado =
      await inventarioService
        .registrarEntrada(
          usuarioId,
          req.body
        );


    res.status(201).json({
      success: true,

      message:
        'Entrada de inventario registrada correctamente',

      data:
        resultado
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function registrarAjuste(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const usuarioId =
      req.auth?.id;


    if (!usuarioId) {

      res.status(401).json({
        success: false,
        message:
          'Usuario no autenticado'
      });

      return;
    }


    const resultado =
      await inventarioService
        .registrarAjuste(
          usuarioId,
          req.body
        );


    res.status(200).json({
      success: true,

      message:
        'Inventario ajustado correctamente',

      data:
        resultado
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function listarMovimientos(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const productoId =
      req.query.producto_id
        ? Number(
            req.query.producto_id
          )
        : undefined;


    const movimientos =
      await inventarioService
        .listarMovimientos(
          productoId
        );


    res.status(200).json({
      success: true,
      data:
        movimientos
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


function manejarError(
  error: unknown,
  res: Response
): void {

  if (
    !(error instanceof Error)
  ) {

    res.status(500).json({
      success: false,
      message:
        'Error interno del servidor'
    });

    return;
  }


  const errores400 = [

    'ID_INVALIDO',

    'DATOS_ENTRADA_OBLIGATORIOS',

    'DATOS_AJUSTE_OBLIGATORIOS',

    'CANTIDAD_INVALIDA',

    'CANTIDAD_FRACCIONARIA_INVALIDA',

    'STOCK_FISICO_INVALIDO',

    'MOTIVO_OBLIGATORIO',

    'MOTIVO_MUY_LARGO'
  ];


  if (
    errores400.includes(
      error.message
    )
  ) {

    res.status(400).json({
      success: false,
      message:
        error.message
    });

    return;
  }


  if (
    error.message ===
    'PRODUCTO_NO_ENCONTRADO'
  ) {

    res.status(404).json({
      success: false,
      message:
        'Producto no encontrado'
    });

    return;
  }


  const errores409 = [

    'PRODUCTO_INACTIVO',

    'STOCK_FISICO_MENOR_QUE_RESERVADO',

    'AJUSTE_SIN_CAMBIOS'
  ];


  if (
    errores409.includes(
      error.message
    )
  ) {

    res.status(409).json({
      success: false,
      message:
        error.message
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