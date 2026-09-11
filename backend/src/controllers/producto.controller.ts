import {
  Request,
  Response
} from 'express';

import {
  ProductoService
} from '../services/producto.service';


const productoService =
  new ProductoService();


export async function listarProductos(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const productos =
      await productoService.listar();

    res.status(200).json({
      success: true,
      data: productos
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function obtenerProducto(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {

  try {

    const id =
      Number(req.params.id);

    const producto =
      await productoService
        .obtenerPorId(id);

    res.status(200).json({
      success: true,
      data: producto
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function obtenerProductoPorCodigo(
  req: Request<{ codigo: string }>,
  res: Response
): Promise<void> {

  try {

    const codigo = req.params.codigo;

    const producto =
      await productoService
        .obtenerPorCodigo(codigo);

    res.status(200).json({
      success: true,
      data: producto
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function crearProducto(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const producto =
      await productoService
        .crear(req.body);

    res.status(201).json({
      success: true,
      message:
        'Producto registrado correctamente',
      data: producto
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function actualizarProducto(
    req: Request<{ id: string }>,
    res: Response
): Promise<void> {

  try {

    const id =
      Number(req.params.id);

    const producto =
      await productoService
        .actualizar(
          id,
          req.body
        );

    res.status(200).json({
      success: true,
      message:
        'Producto actualizado correctamente',
      data: producto
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function eliminarProducto(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {

  try {

    const id =
      Number(req.params.id);

    await productoService
      .desactivar(id);

    res.status(200).json({
      success: true,
      message:
        'Producto desactivado correctamente'
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
    'CODIGO_OBLIGATORIO',
    'CODIGO_MUY_LARGO',
    'NOMBRE_OBLIGATORIO',
    'NOMBRE_MUY_CORTO',
    'NOMBRE_MUY_LARGO',
    'DESCRIPCION_MUY_LARGA',
    'UNIDAD_MEDIDA_INVALIDA',
    'PRECIO_INVALIDO',
    'STOCK_DISPONIBLE_INVALIDO',
    'STOCK_MINIMO_INVALIDO',
    'ESTADO_INVALIDO',
    'VISIBLE_WEB_INVALIDO',
    'IMAGEN_URL_MUY_LARGA'
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
    'PRODUCTO_NO_ENCONTRADO' ||

    error.message ===
    'CATEGORIA_NO_ENCONTRADA'
  ) {

    res.status(404).json({
      success: false,
      message: error.message
    });

    return;
  }


  if (
    error.message ===
    'CODIGO_PRODUCTO_DUPLICADO' ||

    error.message ===
    'CATEGORIA_INACTIVA' ||

    error.message ===
    'PRODUCTO_YA_INACTIVO'
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

export async function obtenerProductoPorCodigoBarras(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const parametroCodigo =
      req.params.codigo;


    const codigo =
      Array.isArray(parametroCodigo)
        ? parametroCodigo[0]
        : parametroCodigo;


    if (
      !codigo ||
      typeof codigo !== 'string'
    ) {

      res.status(400).json({
        success: false,
        message:
          'CODIGO_BARRAS_REQUERIDO'
      });

      return;
    }


    const producto =
      await productoService
        .obtenerPorCodigoBarras(
          codigo
        );


    res.status(200).json({
      success: true,
      data:
        producto
    });


  } catch (error) {

    const mensaje =
      error instanceof Error
        ? error.message
        : 'ERROR_INTERNO';


    if (
      mensaje ===
      'CODIGO_BARRAS_REQUERIDO'
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
      'PRODUCTO_NO_ENCONTRADO'
    ) {

      res.status(404).json({
        success: false,
        message:
          mensaje
      });

      return;
    }


    console.error(
      'Error al buscar producto por código de barras:',
      error
    );


    res.status(500).json({
      success: false,
      message:
        'ERROR_INTERNO'
    });
  }
}