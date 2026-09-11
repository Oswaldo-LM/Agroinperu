export type UnidadMedidaPublica =
  | 'UNIDAD'
  | 'METRO'
  | 'ROLLO'
  | 'CAJA';


export interface CategoriaPublica {

  id_categoria: number;

  nombre: string;

  descripcion:
    string | null;
}


export interface ProductoPublico {

  id_producto: number;

  categoria_id: number;

  codigo: string;

  nombre: string;

  descripcion:
    string | null;

  unidad_medida:
    UnidadMedidaPublica;

  precio: number;

  stock_disponible: number;

  imagen_url:
    string | null;
}


export interface CategoriasPublicasResponse {

  success: boolean;

  data:
    CategoriaPublica[];
}


export interface ProductosPublicosResponse {

  success: boolean;

  data:
    ProductoPublico[];
}