import {
  Request,
  Response
} from 'express';

import {
  AuthRequest
} from '../middlewares/auth.middleware';

import {
  DevolucionService
} from '../services/devolucion.service';


const devolucionService =
  new DevolucionService();


export async function listarDevoluciones(
  _req: Request,
  res: Response
): Promise<void> {

  try {

    const devoluciones =
      await devolucionService
        .listar();


    res.status(200).json({

      success: true,

      data:
        devoluciones
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function obtenerDevolucion(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const id =
      Number(
        req.params.id
      );


    const devolucion =
      await devolucionService
        .obtenerPorId(id);


    res.status(200).json({

      success: true,

      data:
        devolucion
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function obtenerProductosDevolvibles(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const ventaId =
      Number(
        req.params.ventaId
      );


    const productos =
      await devolucionService
        .obtenerProductosDevolvibles(
          ventaId
        );


    res.status(200).json({

      success: true,

      data:
        productos
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function crearDevolucion(
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


    const devolucion =
      await devolucionService
        .crear(
          usuarioId,
          req.body
        );


    res.status(201).json({

      success: true,

      message:
        'Devolución registrada correctamente.',

      data:
        devolucion
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


  const errores400 = [

    'ID_DEVOLUCION_INVALIDO',

    'USUARIO_INVALIDO',

    'ID_VENTA_INVALIDO',

    'MOTIVO_REQUERIDO',

    'DEVOLUCION_SIN_PRODUCTOS',

    'DETALLE_VENTA_INVALIDO',

    'DETALLE_DUPLICADO',

    'CANTIDAD_INVALIDA',

    'CANTIDAD_FRACCIONARIA_INVALIDA',

    'CANTIDAD_DEVOLUCION_EXCEDIDA'
  ];


  if (
    errores400.includes(
      mensaje
    )
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
      'DEVOLUCION_NO_ENCONTRADA' ||

    mensaje ===
      'VENTA_NO_ENCONTRADA' ||

    mensaje ===
      'DETALLE_VENTA_NO_ENCONTRADO' ||

    mensaje ===
      'PRODUCTO_NO_ENCONTRADO'
  ) {

    res.status(404).json({

      success: false,

      message:
        mensaje
    });

    return;
  }


  if (
    mensaje ===
    'VENTA_NO_ENTREGADA'
  ) {

    res.status(409).json({

      success: false,

      message:
        mensaje
    });

    return;
  }


  console.error(
    'Error de devolución:',
    error
  );


  res.status(500).json({

    success: false,

    message:
      'ERROR_INTERNO'
  });
}

export async function listarVentasEntregadas(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const buscar =
      typeof req.query.buscar ===
        'string'

        ? req.query.buscar

        : '';


    const ventas =
      await devolucionService
        .listarVentasEntregadas(
          buscar
        );


    res.status(200).json({

      success: true,

      data:
        ventas
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}