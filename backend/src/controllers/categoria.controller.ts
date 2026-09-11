import { Request, Response } from 'express';
import { CategoriaService } from '../services/categoria.service';

const categoriaService = new CategoriaService();


export async function listarCategorias(
  req: Request,
  res: Response
): Promise<void> {

  try {
    const categorias =
      await categoriaService.listar();

    res.status(200).json({
      success: true,
      data: categorias
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}


export async function obtenerCategoria(
  req: Request,
  res: Response
): Promise<void> {

  try {
    const id = Number(req.params.id);

    const categoria =
      await categoriaService.obtenerPorId(id);

    res.status(200).json({
      success: true,
      data: categoria
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function crearCategoria(
  req: Request,
  res: Response
): Promise<void> {

  try {
    const categoria =
      await categoriaService.crear(req.body);

    res.status(201).json({
      success: true,
      message: 'Categoría registrada correctamente',
      data: categoria
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function actualizarCategoria(
  req: Request,
  res: Response
): Promise<void> {

  try {
    const id = Number(req.params.id);

    const categoria =
      await categoriaService.actualizar(
        id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: 'Categoría actualizada correctamente',
      data: categoria
    });

  } catch (error) {

    manejarError(error, res);
  }
}


export async function eliminarCategoria(
  req: Request,
  res: Response
): Promise<void> {

  try {
    const id = Number(req.params.id);

    await categoriaService.desactivar(id);

    res.status(200).json({
      success: true,
      message: 'Categoría desactivada correctamente'
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
      message: 'Error interno del servidor'
    });

    return;
  }

  switch (error.message) {

    case 'ID_INVALIDO':
      res.status(400).json({
        success: false,
        message: 'El ID proporcionado no es válido'
      });
      return;


    case 'NOMBRE_OBLIGATORIO':
      res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es obligatorio'
      });
      return;


    case 'NOMBRE_MUY_CORTO':
      res.status(400).json({
        success: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      });
      return;


    case 'NOMBRE_MUY_LARGO':
      res.status(400).json({
        success: false,
        message: 'El nombre no puede superar los 80 caracteres'
      });
      return;


    case 'DESCRIPCION_MUY_LARGA':
      res.status(400).json({
        success: false,
        message: 'La descripción no puede superar los 255 caracteres'
      });
      return;


    case 'ESTADO_INVALIDO':
      res.status(400).json({
        success: false,
        message: 'El estado proporcionado no es válido'
      });
      return;


    case 'CATEGORIA_DUPLICADA':
      res.status(409).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
      return;


    case 'CATEGORIA_NO_ENCONTRADA':
      res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
      return;


    case 'CATEGORIA_YA_INACTIVA':
      res.status(409).json({
        success: false,
        message: 'La categoría ya se encuentra inactiva'
      });
      return;


    default:
      console.error(error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
  }
}