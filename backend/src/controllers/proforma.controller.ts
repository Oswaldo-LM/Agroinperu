import {
  Request,
  Response
} from 'express';

import {
  AuthRequest
} from '../middlewares/auth.middleware';

import {
  ProformaService
} from '../services/proforma.service';


const proformaService =
  new ProformaService();


export async function listarProformas(
  _req: Request,
  res: Response
): Promise<void> {

  try {

    const proformas =
      await proformaService
        .listar();


    res.status(200).json({

      success: true,

      data:
        proformas
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function obtenerProforma(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const id =
      Number(
        req.params.id
      );


    const proforma =
      await proformaService
        .obtenerPorId(id);


    res.status(200).json({

      success: true,

      data:
        proforma
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function crearProforma(
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


    const proforma =
      await proformaService
        .crear(
          usuarioId,
          req.body
        );


    res.status(201).json({

      success: true,

      message:
        'Proforma creada correctamente.',

      data:
        proforma
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function anularProforma(
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


    const id =
      Number(
        req.params.id
      );


    const proforma =
      await proformaService
        .anular(
          id,
          usuarioId,
          req.body?.motivo
        );


    res.status(200).json({

      success: true,

      message:
        'Proforma anulada correctamente.',

      data:
        proforma
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

    'ID_PROFORMA_INVALIDO',

    'USUARIO_INVALIDO',

    'CLIENTE_INVALIDO',

    'FECHA_VENCIMIENTO_INVALIDA',

    'PROFORMA_SIN_PRODUCTOS',

    'PRODUCTO_INVALIDO',

    'PRODUCTO_DUPLICADO',

    'CANTIDAD_INVALIDA',

    'CANTIDAD_FRACCIONARIA_INVALIDA',

    'MOTIVO_ANULACION_REQUERIDO'
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
      'PROFORMA_NO_ENCONTRADA' ||

    mensaje ===
      'CLIENTE_NO_ENCONTRADO' ||

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
    'PROFORMA_YA_ANULADA'
  ) {

    res.status(409).json({

      success: false,

      message:
        mensaje
    });

    return;
  }


  console.error(
    'Error de proforma:',
    error
  );


  res.status(500).json({

    success: false,

    message:
      'ERROR_INTERNO'
  });
}