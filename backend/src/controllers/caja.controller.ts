import {
  Response
} from 'express';

import {
  AuthRequest
} from '../middlewares/auth.middleware';

import {
  CajaService
} from '../services/caja.service';


const cajaService =
  new CajaService();


export async function obtenerCajaActual(
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
          'NO_AUTENTICADO'
      });

      return;
    }


    const caja =
      await cajaService
        .obtenerActual(
          usuarioId
        );


    res.status(200).json({

      success: true,

      data:
        caja
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function abrirCaja(
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
          'NO_AUTENTICADO'
      });

      return;
    }


    const caja =
      await cajaService
        .abrir(
          usuarioId,
          req.body
        );


    res.status(201).json({

      success: true,

      message:
        'Caja abierta correctamente.',

      data:
        caja
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function cerrarCaja(
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
          'NO_AUTENTICADO'
      });

      return;
    }


    const caja =
      await cajaService
        .cerrar(
          usuarioId,
          req.body
        );


    res.status(200).json({

      success: true,

      message:
        'Caja cerrada correctamente.',

      data:
        caja
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function historialCaja(
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
          'NO_AUTENTICADO'
      });

      return;
    }


    const historial =
      await cajaService
        .listarHistorial(
          usuarioId
        );


    res.status(200).json({

      success: true,

      data:
        historial
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function historialCajaGeneral(
  _req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const historial =
      await cajaService
        .listarHistorialGeneral();


    res.status(200).json({

      success: true,

      data:
        historial
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

  const mensaje =
    error instanceof Error
      ? error.message
      : 'ERROR_INTERNO';


  if (
    mensaje ===
      'USUARIO_INVALIDO' ||

    mensaje ===
      'MONTO_APERTURA_INVALIDO' ||

    mensaje ===
      'EFECTIVO_DECLARADO_INVALIDO'
  ) {

    res.status(400).json({

      success: false,

      message:
        mensaje
    });

    return;
  }


  if (
    mensaje ===
    'CAJA_YA_ABIERTA'
  ) {

    res.status(409).json({

      success: false,

      message:
        mensaje
    });

    return;
  }


  if (
    mensaje ===
    'CAJA_NO_ABIERTA'
  ) {

    res.status(409).json({

      success: false,

      message:
        mensaje
    });

    return;
  }


  console.error(
    'Error de caja:',
    error
  );


  res.status(500).json({

    success: false,

    message:
      'ERROR_INTERNO'
  });
}