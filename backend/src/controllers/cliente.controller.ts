import {
  Request,
  Response
} from 'express';

import {
  ClienteService
} from '../services/cliente.service';


const clienteService =
  new ClienteService();


export async function listarClientes(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const clientes =
      await clienteService.listar();

    res.status(200).json({
      success: true,
      data: clientes
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function obtenerCliente(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {

  try {

    const id =
      Number(req.params.id);

    const cliente =
      await clienteService
        .obtenerPorId(id);

    res.status(200).json({
      success: true,
      data: cliente
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function registrarClienteWeb(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const cliente =
      await clienteService
        .registrarWeb(req.body);

    res.status(201).json({
      success: true,
      message:
        'Cliente registrado correctamente',
      data: cliente
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function crearCliente(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const cliente =
      await clienteService
        .crear(req.body);

    res.status(201).json({
      success: true,
      message:
        'Cliente registrado correctamente',
      data: cliente
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function actualizarCliente(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {

  try {

    const id =
      Number(req.params.id);

    const cliente =
      await clienteService
        .actualizar(
          id,
          req.body
        );

    res.status(200).json({
      success: true,
      message:
        'Cliente actualizado correctamente',
      data: cliente
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function eliminarCliente(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {

  try {

    const id =
      Number(req.params.id);

    await clienteService
      .desactivar(id);

    res.status(200).json({
      success: true,
      message:
        'Cliente desactivado correctamente'
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


  const errores400 = [
    'ID_INVALIDO',

    'TIPO_CLIENTE_INVALIDO',
    'TIPO_DOCUMENTO_INVALIDO',

    'DOCUMENTO_OBLIGATORIO',
    'DOCUMENTO_INVALIDO',
    'DNI_INVALIDO',
    'RUC_INVALIDO',

    'NOMBRES_OBLIGATORIOS',
    'APELLIDOS_OBLIGATORIOS',
    'RAZON_SOCIAL_OBLIGATORIA',

    'NOMBRES_MUY_LARGOS',
    'APELLIDOS_MUY_LARGOS',
    'RAZON_SOCIAL_MUY_LARGA',

    'EMPRESA_REQUIERE_RUC',

    'EMAIL_OBLIGATORIO',
    'EMAIL_INVALIDO',
    'EMAIL_MUY_LARGO',

    'PASSWORD_OBLIGATORIO',
    'PASSWORD_MUY_CORTO',
    'PASSWORD_MUY_LARGO',

    'TELEFONO_MUY_LARGO',
    'DIRECCION_MUY_LARGA',

    'ESTADO_INVALIDO'
  ];


  if (
    errores400.includes(error.message)
  ) {

    res.status(400).json({
      success: false,
      message: error.message
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
    'EMAIL_DUPLICADO' ||

    error.message ===
    'DOCUMENTO_DUPLICADO' ||

    error.message ===
    'CLIENTE_YA_INACTIVO'
  ) {

    res.status(409).json({
      success: false,
      message: error.message
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