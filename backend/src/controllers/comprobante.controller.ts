import {
  Response
} from 'express';

import {
  AuthRequest
} from '../middlewares/auth.middleware';

import {
  ComprobanteService
} from '../services/comprobante.service';


const comprobanteService =
  new ComprobanteService();


export async function emitirComprobante(
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


    const ventaId =
      Number(
        req.params.ventaId
      );


    const comprobante =
      await comprobanteService
        .emitir(
          usuarioId,
          ventaId,
          req.body
        );


    res.status(201).json({
      success: true,

      message:
        'Comprobante emitido correctamente',

      data:
        comprobante
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function obtenerComprobante(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const id =
      Number(
        req.params.id
      );


    const comprobante =
      await comprobanteService
        .obtenerPorId(id);


    res.status(200).json({
      success: true,
      data: comprobante
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function obtenerComprobantesVenta(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const ventaId =
      Number(
        req.params.ventaId
      );


    const comprobantes =
      await comprobanteService
        .obtenerPorVenta(
          ventaId
        );


    res.status(200).json({
      success: true,
      data: comprobantes
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

  if (
  error.message ===
    'MOTIVO_ANULACION_OBLIGATORIO' ||

  error.message ===
    'MOTIVO_ANULACION_MUY_LARGO'
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
  'COMPROBANTE_YA_ANULADO'
) {

  res.status(409).json({
    success: false,
    message:
      'El comprobante ya se encuentra anulado'
  });

  return;
}


  const errores400 = [
    'ID_INVALIDO',
    'DATOS_COMPROBANTE_OBLIGATORIOS',
    'TIPO_COMPROBANTE_INVALIDO',
    'FACTURA_REQUIERE_RUC'
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
      'COMPROBANTE_NO_ENCONTRADO'
  ) {

    res.status(404).json({
      success: false,
      message:
        error.message
    });

    return;
  }


  const errores409 = [
    'VENTA_NO_PAGADA',
    'VENTA_ANULADA',
    'COMPROBANTE_YA_EMITIDO'
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

export async function anularComprobante(
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


    const comprobanteId =
      Number(
        req.params.id
      );


    const {
      motivo
    } = req.body ?? {};


    const comprobante =
      await comprobanteService
        .anular(
          usuarioId,
          comprobanteId,
          motivo
        );


    res.status(200).json({
      success: true,

      message:
        'Comprobante anulado correctamente',

      data:
        comprobante
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}