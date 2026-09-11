export type UnidadMedida =
  | 'UNIDAD'
  | 'METRO'
  | 'ROLLO'
  | 'CAJA';


export type EstadoProducto =
  | 'ACTIVO'
  | 'INACTIVO';


export interface Producto {

  id_producto: number;

  categoria_id: number;

  codigo: string;

  codigo_barras: string | null;

  nombre: string;

  descripcion:
    string | null;

  unidad_medida:
    UnidadMedida;

  precio: number;

  stock_disponible: number;

  stock_reservado: number;

  stock_minimo: number;

  imagen_url:
    string | null;

  visible_web:
    boolean;

  estado:
    EstadoProducto;

  fecha_creacion?:
    string;

  fecha_actualizacion?:
    string | null;

  
}


export interface CrearProductoDto {

  categoria_id: number;

  codigo: string;

  codigo_barras?: string | null;

  nombre: string;

  descripcion:
    string | null;

  unidad_medida:
    UnidadMedida;

  precio: number;

  stock_disponible: number;

  stock_minimo: number;

  imagen_url:
    string | null;

  visible_web: boolean;

  
}


export interface ActualizarProductoDto {

  categoria_id: number;

  codigo: string;

  codigo_barras?: string | null;

  nombre: string;

  descripcion:
    string | null;

  unidad_medida:
    UnidadMedida;

  precio: number;

  stock_minimo: number;

  imagen_url:
    string | null;

  visible_web: boolean;
}


export interface ProductoResponse {

  success: boolean;

  message?: string;

  data:
    Producto;
}


export interface ProductosResponse {

  success: boolean;

  message?: string;

  data:
    Producto[];
}