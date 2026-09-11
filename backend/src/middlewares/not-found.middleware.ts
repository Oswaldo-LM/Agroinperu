import {
  NextFunction,
  Request,
  Response
} from 'express';


export function rutaNoEncontrada(
  req: Request,
  res: Response,
  next: NextFunction
): void {

  res.status(404).json({

    success: false,

    message:
      'Ruta no encontrada',

    method:
      req.method,

    path:
      req.originalUrl
  });
}