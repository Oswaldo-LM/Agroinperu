import {
  Response
} from 'express';

import {
  AuthRequest
} from '../middlewares/auth.middleware';

import {
  UsuarioService
} from '../services/usuario.service';


const usuarioService =
  new UsuarioService();


export async function listarUsuarios(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const usuarios =
      await usuarioService
        .listar();


    res.status(200).json({
      success: true,
      data: usuarios
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function obtenerUsuario(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const usuarioId =
      Number(
        req.params.id
      );


    const usuario =
      await usuarioService
        .obtenerPorId(
          usuarioId
        );


    res.status(200).json({
      success: true,
      data: usuario
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function crearUsuario(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const usuario =
      await usuarioService
        .crear(
          req.body
        );


    res.status(201).json({
      success: true,

      message:
        'Usuario creado correctamente',

      data:
        usuario
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function actualizarUsuario(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const administradorId =
      req.auth?.id;


    if (!administradorId) {

      res.status(401).json({
        success: false,
        message:
          'Usuario no autenticado'
      });

      return;
    }


    const usuarioId =
      Number(
        req.params.id
      );


    const usuario =
      await usuarioService
        .actualizar(
          administradorId,
          usuarioId,
          req.body
        );


    res.status(200).json({
      success: true,

      message:
        'Usuario actualizado correctamente',

      data:
        usuario
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function cambiarPasswordUsuario(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const usuarioId =
      Number(
        req.params.id
      );


    await usuarioService
      .cambiarPassword(
        usuarioId,
        req.body
      );


    res.status(200).json({
      success: true,

      message:
        'Contraseña actualizada correctamente'
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function eliminarUsuario(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const administradorId =
      req.auth?.id;


    if (!administradorId) {

      res.status(401).json({
        success: false,
        message:
          'Usuario no autenticado'
      });

      return;
    }


    const usuarioId =
      Number(
        req.params.id
      );


    await usuarioService
      .eliminar(
        administradorId,
        usuarioId
      );


    res.status(200).json({
      success: true,

      message:
        'Usuario inactivado correctamente'
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

    'DATOS_USUARIO_OBLIGATORIOS',

    'DATOS_PASSWORD_OBLIGATORIOS',

    'NOMBRE_OBLIGATORIO',

    'NOMBRE_MUY_LARGO',

    'EMAIL_OBLIGATORIO',

    'EMAIL_INVALIDO',

    'EMAIL_MUY_LARGO',

    'PASSWORD_INVALIDO',

    'ROL_INVALIDO',

    'ESTADO_INVALIDO'
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
    'USUARIO_NO_ENCONTRADO'
  ) {

    res.status(404).json({
      success: false,
      message:
        'Usuario no encontrado'
    });

    return;
  }


  const errores409 = [

    'EMAIL_EN_USO',

    'NO_PUEDE_CAMBIAR_SU_PROPIO_ROL',

    'NO_PUEDE_DESACTIVAR_SU_PROPIA_CUENTA',

    'ULTIMO_ADMIN_ACTIVO',

    'USUARIO_YA_INACTIVO'
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