import {
  Request,
  Response
} from 'express';

import {
  CategoriaService
} from '../services/categoria.service';

import {
  ProductoService
} from '../services/producto.service';


const categoriaService =
  new CategoriaService();


const productoService =
  new ProductoService();


export async function listarCategoriasPublicas(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const categorias =
      await categoriaService
        .listarPublicas();


    res.status(200).json({
      success: true,
      data:
        categorias
    });


  } catch (error) {

    console.error(error);


    res.status(500).json({
      success: false,
      message:
        'Error interno del servidor'
    });
  }
}


export async function listarProductosPublicos(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const productos =
      await productoService
        .listarPublicos();


    res.status(200).json({
      success: true,
      data:
        productos
    });


  } catch (error) {

    console.error(error);


    res.status(500).json({
      success: false,
      message:
        'Error interno del servidor'
    });
  }
}


export async function obtenerProductoPublico(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const productoId =
      Number(
        req.params.id
      );


    const producto =
      await productoService
        .obtenerPublicoPorId(
          productoId
        );


    res.status(200).json({
      success: true,
      data:
        producto
    });


  } catch (error) {

    if (
      error instanceof Error &&
      error.message ===
        'PRODUCTO_NO_ENCONTRADO'
    ) {

      res.status(404).json({
        success: false,
        message:
          'Producto no encontrado'
      });

      return;
    }


    if (
      error instanceof Error &&
      error.message ===
        'ID_INVALIDO'
    ) {

      res.status(400).json({
        success: false,
        message:
          'ID inválido'
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
}