import {
  Request,
  Response
} from 'express';

import {
  AuthService
} from '../services/auth.service';


const authService =
  new AuthService();


export async function loginCliente(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const resultado =
      await authService
        .loginCliente(req.body);


    res.status(200).json({
      success: true,
      message:
        'Inicio de sesión correcto',
      data: resultado
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function loginUsuario(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const resultado =
      await authService
        .loginUsuario(req.body);


    res.status(200).json({
      success: true,
      message:
        'Inicio de sesión correcto',
      data: resultado
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


  if (
    error.message ===
      'EMAIL_OBLIGATORIO' ||

    error.message ===
      'EMAIL_INVALIDO' ||

    error.message ===
      'PASSWORD_OBLIGATORIO' ||
    error.message ===
      'DATOS_LOGIN_OBLIGATORIOS'
  ) {

    res.status(400).json({
      success: false,
      message: error.message
    });

    return;
  }


  if (
    error.message ===
    'CREDENCIALES_INVALIDAS'
  ) {

    res.status(401).json({
      success: false,
      message:
        'Correo o contraseña incorrectos'
    });

    return;
  }


  if (
    error.message ===
    'CUENTA_NO_DISPONIBLE'
  ) {

    res.status(403).json({
      success: false,
      message:
        'La cuenta no se encuentra disponible'
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