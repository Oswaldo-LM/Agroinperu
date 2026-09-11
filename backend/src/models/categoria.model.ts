export type EstadoCategoria = 'ACTIVO' | 'INACTIVO';

export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  estado: EstadoCategoria;
  fecha_creacion: Date;
  fecha_actualizacion: Date | null;
}

export interface CrearCategoriaDto {
  nombre: string;
  descripcion?: string | null;
}

export interface ActualizarCategoriaDto {
  nombre: string;
  descripcion?: string | null;
  estado: EstadoCategoria;
}