import {
  Response
} from 'express';

import {
  AuthRequest
} from '../middlewares/auth.middleware';

import {
  PagoService
} from '../services/pago.service';


const pagoService =
  new PagoService();


export async function registrarPagoWeb(
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


    const pago =
      await pagoService
        .registrarPagoWeb(
          clienteId,
          req.body
        );


    res.status(201).json({
      success: true,

      message:
        'Pago registrado y pendiente de aprobación',

      data:
        pago
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function listarPagosCliente(
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


    const ventaId =
      Number(
        req.params.ventaId
      );


    const pagos =
      await pagoService
        .listarPagosCliente(
          clienteId,
          ventaId
        );


    res.status(200).json({
      success: true,
      data: pagos
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function aprobarPago(
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


    const pagoId =
      Number(
        req.params.id
      );


    await pagoService
      .aprobarPago(
        usuarioId,
        pagoId
      );


    res.status(200).json({
      success: true,
      message:
        'Pago aprobado correctamente'
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function rechazarPago(
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


    const pagoId =
      Number(
        req.params.id
      );


    await pagoService
      .rechazarPago(
        usuarioId,
        pagoId
      );


    res.status(200).json({
      success: true,
      message:
        'Pago rechazado correctamente'
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
    'ID_VENTA_INVALIDO',
    'DATOS_PAGO_OBLIGATORIOS',
    'METODO_PAGO_INVALIDO',
    'REFERENCIA_OBLIGATORIA',
    'REFERENCIA_MUY_LARGA'
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
      'VENTA_NO_ENCONTRADA' ||

    error.message ===
      'PAGO_NO_ENCONTRADO'
  ) {

    res.status(404).json({
      success: false,
      message:
        error.message
    });

    return;
  }


  const errores409 = [
    'VENTA_NO_PENDIENTE_PAGO',
    'PAGO_PENDIENTE_EXISTENTE',
    'PAGO_NO_PENDIENTE',
    'MONTO_PAGO_INVALIDO'
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

export async function listarPagosVentaInterno(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const ventaId =
      Number(
        req.params.ventaId
      );


    const pagos =
      await pagoService
        .listarPagosVentaInterno(
          ventaId
        );


    res.status(200).json({

      success: true,

      data:
        pagos
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}