import {
  NextFunction,
  Request,
  Response
} from 'express';

import jwt from 'jsonwebtoken';

import {
  AuthPayload
} from '../models/auth.model';


export interface AuthRequest
  extends Request {

  auth?: AuthPayload;
}


export function verificarToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {

  const authorization =
    req.headers.authorization;


  if (!authorization) {

    res.status(401).json({
      success: false,
      message:
        'Token de autenticación requerido'
    });

    return;
  }


  const partes =
    authorization.split(' ');


  if (
    partes.length !== 2 ||
    partes[0] !== 'Bearer'
  ) {

    res.status(401).json({
      success: false,
      message:
        'Formato de token inválido'
    });

    return;
  }


  const token =
    partes[1];


  try {

    const secret =
      process.env.JWT_SECRET;


    if (!secret) {

      throw new Error(
        'JWT_SECRET no configurado'
      );
    }


    const payload =
      jwt.verify(
        token,
        secret
      ) as AuthPayload;


    req.auth =
      payload;


    next();


  } catch {

    res.status(401).json({
      success: false,
      message:
        'Token inválido o expirado'
    });
  }
}


export function soloClientes(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {

  if (
    req.auth?.tipo_cuenta !==
    'CLIENTE'
  ) {

    res.status(403).json({
      success: false,
      message:
        'Acceso permitido solo para clientes'
    });

    return;
  }


  next();
}


export function soloUsuarios(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {

  if (
    req.auth?.tipo_cuenta !==
    'USUARIO'
  ) {

    res.status(403).json({
      success: false,
      message:
        'Acceso permitido solo para personal interno'
    });

    return;
  }


  next();
}


export function soloAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {

  if (
    req.auth?.tipo_cuenta !==
      'USUARIO' ||

    req.auth?.rol !==
      'ADMIN'
  ) {

    res.status(403).json({
      success: false,
      message:
        'Acceso permitido solo para administradores'
    });

    return;
  }


  next();
}