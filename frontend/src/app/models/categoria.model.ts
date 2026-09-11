export type EstadoCategoria =
  | 'ACTIVO'
  | 'INACTIVO';


export interface Categoria {

  id_categoria: number;

  nombre: string;

  descripcion:
    string | null;

  estado:
    EstadoCategoria;

  fecha_creacion?:
    string;

  fecha_actualizacion?:
    string | null;
}


export interface CrearCategoriaDto {

  nombre: string;

  descripcion?:
    string | null;
}


export interface ActualizarCategoriaDto {

  nombre: string;

  descripcion?:
    string | null;
}


export interface CategoriaResponse {

  success: boolean;

  message?: string;

  data:
    Categoria;
}


export interface CategoriasResponse {

  success: boolean;

  message?: string;

  data:
    Categoria[];
}