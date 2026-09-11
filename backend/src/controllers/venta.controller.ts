import {
  Response
} from 'express';

import {
  AuthRequest
} from '../middlewares/auth.middleware';

import {
  VentaService
} from '../services/venta.service';

import {
  EstadoVenta
} from '../models/venta.model';


const ventaService =
  new VentaService();


export async function confirmarVentaWeb(
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


    const venta =
      await ventaService
        .confirmarVentaWeb(
          clienteId
        );


    res.status(201).json({
      success: true,

      message:
        'Venta web creada correctamente',

      data:
        venta
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
    'ID_INVALIDO' ||

  error.message ===
    'ESTADO_INVALIDO'
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
    'TIPO_COMPROBANTE_INVALIDO' ||

  error.message ===
    'FACTURA_REQUIERE_RUC'
) {

  res.status(400).json({
    success: false,
    message:
      error.message
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
      'CAJA_NO_ABIERTA'
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
  'VENTA_YA_ANULADA'
) {

  res.status(409).json({
    success: false,
    message:
      'La venta ya se encuentra anulada'
  });

  return;
}

if (
  error.message ===
  'VENTA_ENTREGADA_NO_ANULABLE'
) {

  res.status(409).json({
    success: false,
    message:
      'Una venta entregada no puede ser anulada'
  });

  return;
}

if (
  error.message ===
  'REEMBOLSO_REQUERIDO'
) {

  res.status(409).json({
    success: false,

    message:
      'La venta posee un pago aprobado y requiere un reembolso antes de ser anulada'
  });

  return;
}

if (
  error.message.startsWith(
    'STOCK_RESERVADO_INSUFICIENTE'
  )
) {

  res.status(409).json({
    success: false,
    message:
      'El stock reservado de la venta es inconsistente'
  });

  return;
}

if (
  error.message ===
  'VENTA_NO_ENCONTRADA'
) {

  res.status(404).json({
    success: false,
    message:
      'Venta no encontrada'
  });

  return;
}

if (
  error.message.startsWith(
    'TRANSICION_ESTADO_INVALIDA'
  )
) {

  const [
    ,
    actual,
    nuevo
  ] =
    error.message.split(':');


  res.status(409).json({
    success: false,

    message:
      'Cambio de estado no permitido',

    estado_actual:
      actual,

    estado_solicitado:
      nuevo
  });

  return;
}

if (
  error.message.startsWith(
    'STOCK_RESERVADO_INSUFICIENTE'
  )
) {

  res.status(409).json({
    success: false,
    message:
      'El stock reservado de la venta es inconsistente'
  });

  return;
}

  if (
    error.message ===
      'ID_INVALIDO' ||

    error.message ===
      'CARRITO_VACIO' ||

    error.message ===
      'CANTIDAD_INVALIDA'
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
    'CARRITO_NO_ENCONTRADO'
  ) {

    res.status(404).json({
      success: false,
      message:
        'No existe un carrito activo'
    });

    return;
  }

  if (
  error.message ===
    'REFERENCIA_REEMBOLSO_OBLIGATORIA' ||

  error.message ===
    'REFERENCIA_REEMBOLSO_MUY_LARGA' ||

  error.message ===
    'MOTIVO_REEMBOLSO_OBLIGATORIO' ||

  error.message ===
    'MOTIVO_REEMBOLSO_MUY_LARGO'
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
  'PAGO_APROBADO_NO_ENCONTRADO'
) {

  res.status(409).json({
    success: false,

    message:
      'No existe un pago aprobado para realizar el reembolso'
  });

  return;
}

if (
  error.message ===
  'VENTA_ENTREGADA_REQUIERE_DEVOLUCION'
) {

  res.status(409).json({
    success: false,

    message:
      'La venta ya fue entregada y requiere un proceso de devolución'
  });

  return;
}


  if (
    error.message.startsWith(
      'STOCK_INSUFICIENTE'
    )
  ) {

    const productoId =
      error.message.split(':')[1];


    res.status(409).json({
      success: false,

      message:
        'Stock insuficiente',

      producto_id:
        Number(productoId)
    });

    return;
  }

  if (
  error.message ===
    'DATOS_VENTA_OBLIGATORIOS' ||

  error.message ===
    'PRODUCTOS_OBLIGATORIOS' ||

  error.message ===
    'CANTIDAD_INVALIDA' ||

  error.message ===
    'METODO_PAGO_INVALIDO' ||

  error.message ===
    'REFERENCIA_PAGO_OBLIGATORIA' ||

  error.message ===
    'REFERENCIA_PAGO_MUY_LARGA'
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
    'CLIENTE_NO_ENCONTRADO'
) {

  res.status(404).json({
    success: false,
    message:
      'Cliente no encontrado'
  });

  return;
}

if (
  error.message ===
    'CLIENTE_INACTIVO'
) {

  res.status(409).json({
    success: false,
    message:
      'El cliente se encuentra inactivo'
  });

  return;
}

if (
  error.message.startsWith(
    'PRODUCTO_NO_ENCONTRADO:'
  )
) {

  const productoId =
    error.message.split(':')[1];


  res.status(404).json({
    success: false,

    message:
      'Producto no encontrado',

    producto_id:
      Number(productoId)
  });

  return;
}

if (
  error.message.startsWith(
    'PRODUCTO_INACTIVO:'
  )
) {

  const productoId =
    error.message.split(':')[1];


  res.status(409).json({
    success: false,

    message:
      'El producto se encuentra inactivo',

    producto_id:
      Number(productoId)
  });

  return;
}

if (
  error.message.startsWith(
    'CANTIDAD_FRACCIONARIA_INVALIDA:'
  )
) {

  const productoId =
    error.message.split(':')[1];


  res.status(400).json({
    success: false,

    message:
      'Este producto requiere una cantidad entera',

    producto_id:
      Number(productoId)
  });

  return;
}

  if (
    error.message.startsWith(
      'PRODUCTO_NO_DISPONIBLE'
    )
  ) {

    const productoId =
      error.message.split(':')[1];


    res.status(409).json({
      success: false,

      message:
        'Uno de los productos ya no se encuentra disponible',

      producto_id:
        Number(productoId)
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

export async function listarVentasWeb(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const estado =
      req.query.estado
        ? String(
            req.query.estado
          )
        : undefined;


    const ventas =
      await ventaService
        .listarVentasWeb(
          estado as
            | EstadoVenta
            | undefined
        );


    res.status(200).json({
      success: true,
      data: ventas
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}

export async function obtenerVentaWeb(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const ventaId =
      Number(
        req.params.id
      );


    const venta =
      await ventaService
        .obtenerVentaWeb(
          ventaId
        );


    res.status(200).json({
      success: true,
      data: venta
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}

export async function cambiarEstadoVentaWeb(
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
        req.params.id
      );


    const {
      estado
    } = req.body ?? {};


    await ventaService
      .cambiarEstadoVentaWeb(
        usuarioId,
        ventaId,
        estado
      );


    res.status(200).json({
      success: true,

      message:
        'Estado de la venta actualizado correctamente'
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }

}

export async function anularVentaWeb(
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
        req.params.id
      );


    const {
      motivo
    } = req.body ?? {};


    await ventaService
      .anularVentaWeb(
        usuarioId,
        ventaId,
        motivo
      );


    res.status(200).json({
      success: true,
      message:
        'Venta anulada correctamente'
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}

export async function reembolsarVentaWeb(
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
        req.params.id
      );


    const {
      referencia_reembolso,
      motivo
    } = req.body ?? {};


    await ventaService
      .reembolsarVentaWeb(
        usuarioId,

        ventaId,

        referencia_reembolso,

        motivo
      );


    res.status(200).json({
      success: true,

      message:
        'Reembolso registrado y venta anulada correctamente'
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}

export async function crearVentaTienda(
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


    const venta =
      await ventaService
        .crearVentaTienda(
          usuarioId,
          req.body
        );


    res.status(201).json({
      success: true,

      message:
        'Venta presencial registrada correctamente',

      data:
        venta
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function listarMisPedidos(
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
          'NO_AUTENTICADO'
      });

      return;
    }


    const pedidos =
      await ventaService
        .listarMisPedidos(
          clienteId
        );


    res.status(200).json({

      success: true,

      data:
        pedidos
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


export async function obtenerMiPedido(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const clienteId =
      req.auth?.id;


    const ventaId =
      Number(
        req.params.id
      );


    if (!clienteId) {

      res.status(401).json({

        success: false,

        message:
          'NO_AUTENTICADO'
      });

      return;
    }


    const pedido =
      await ventaService
        .obtenerMiPedido(
          clienteId,
          ventaId
        );


    res.status(200).json({

      success: true,

      data:
        pedido
    });


  } catch (error) {

    manejarError(
      error,
      res,
      
    );
  }
}