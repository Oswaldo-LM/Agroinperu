import {
  NextFunction,
  Request,
  Response
} from 'express';


export function manejarErrorGlobal(
  error: unknown,

  req: Request,

  res: Response,

  next: NextFunction
): void {

  /*
   * Si Express ya empezó a enviar
   * la respuesta, dejamos que continúe
   * con su manejador predeterminado.
   */
  if (
    res.headersSent
  ) {

    next(error);

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | CORS
  |--------------------------------------------------------------------------
  */

  if (
    error instanceof Error &&
    error.message ===
      'ORIGEN_NO_PERMITIDO'
  ) {

    res.status(403).json({

      success: false,

      message:
        'Origen no permitido'
    });

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | JSON inválido
  |--------------------------------------------------------------------------
  |
  | Express puede lanzar SyntaxError
  | cuando el body JSON está mal formado.
  |--------------------------------------------------------------------------
  */

  if (
    error instanceof SyntaxError &&
    'body' in error
  ) {

    res.status(400).json({

      success: false,

      message:
        'JSON inválido'
    });

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | Error desconocido
  |--------------------------------------------------------------------------
  */

  console.error(
    'Error no controlado:',
    error
  );


  res.status(500).json({

    success: false,

    message:
      'Error interno del servidor'
  });
}