import {
  ActualizarCategoriaDto,
  Categoria,
  CrearCategoriaDto,
  EstadoCategoria
} from '../models/categoria.model';

import { CategoriaRepository } from '../repositories/categoria.repository';

export class CategoriaService {

  private categoriaRepository = new CategoriaRepository();


  async listar(): Promise<Categoria[]> {
    return this.categoriaRepository.obtenerTodas();
  }


  async obtenerPorId(id: number): Promise<Categoria> {
    this.validarId(id);

    const categoria =
      await this.categoriaRepository.obtenerPorId(id);

    if (!categoria) {
      throw new Error('CATEGORIA_NO_ENCONTRADA');
    }

    return categoria;
  }


  async crear(datos: CrearCategoriaDto): Promise<Categoria> {
    const nombre = datos.nombre?.trim();

    if (!nombre) {
      throw new Error('NOMBRE_OBLIGATORIO');
    }

    if (nombre.length < 2) {
      throw new Error('NOMBRE_MUY_CORTO');
    }

    if (nombre.length > 80) {
      throw new Error('NOMBRE_MUY_LARGO');
    }

    const descripcion =
      datos.descripcion?.trim() || null;

    if (descripcion && descripcion.length > 255) {
      throw new Error('DESCRIPCION_MUY_LARGA');
    }

    const existente =
      await this.categoriaRepository.obtenerPorNombre(nombre);

    if (existente) {
      throw new Error('CATEGORIA_DUPLICADA');
    }

    return this.categoriaRepository.crear({
      nombre,
      descripcion
    });
  }


  async actualizar(
    id: number,
    datos: ActualizarCategoriaDto
  ): Promise<Categoria> {

    this.validarId(id);

    const categoriaActual =
      await this.categoriaRepository.obtenerPorId(id);

    if (!categoriaActual) {
      throw new Error('CATEGORIA_NO_ENCONTRADA');
    }

    const nombre = datos.nombre?.trim();

    if (!nombre) {
      throw new Error('NOMBRE_OBLIGATORIO');
    }

    if (nombre.length < 2) {
      throw new Error('NOMBRE_MUY_CORTO');
    }

    if (nombre.length > 80) {
      throw new Error('NOMBRE_MUY_LARGO');
    }

    const descripcion =
      datos.descripcion?.trim() || null;

    if (descripcion && descripcion.length > 255) {
      throw new Error('DESCRIPCION_MUY_LARGA');
    }

    const estadosPermitidos: EstadoCategoria[] = [
      'ACTIVO',
      'INACTIVO'
    ];

    if (!estadosPermitidos.includes(datos.estado)) {
      throw new Error('ESTADO_INVALIDO');
    }

    const duplicada =
      await this.categoriaRepository.obtenerPorNombre(
        nombre,
        id
      );

    if (duplicada) {
      throw new Error('CATEGORIA_DUPLICADA');
    }

    const actualizada =
      await this.categoriaRepository.actualizar(
        id,
        {
          nombre,
          descripcion,
          estado: datos.estado
        }
      );

    if (!actualizada) {
      throw new Error('ERROR_ACTUALIZAR_CATEGORIA');
    }

    return actualizada;
  }


  async desactivar(id: number): Promise<void> {
    this.validarId(id);

    const categoria =
      await this.categoriaRepository.obtenerPorId(id);

    if (!categoria) {
      throw new Error('CATEGORIA_NO_ENCONTRADA');
    }

    if (categoria.estado === 'INACTIVO') {
      throw new Error('CATEGORIA_YA_INACTIVA');
    }

    const resultado =
      await this.categoriaRepository.desactivar(id);

    if (!resultado) {
      throw new Error('ERROR_DESACTIVAR_CATEGORIA');
    }
  }


  private validarId(id: number): void {
    if (
      Number.isNaN(id) ||
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error('ID_INVALIDO');
    }
  }

  async listarPublicas() {

  return this.categoriaRepository
    .listarPublicas();
}


}