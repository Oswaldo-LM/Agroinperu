export type EstadoCarrito =
  | 'ACTIVO'
  | 'CONVERTIDO'
  | 'ABANDONADO';


export interface DetalleCarrito {
  id_detalle_carrito: number;
  producto_id: number;
  codigo: string;
  nombre: string;
  unidad_medida: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  stock_disponible: number;
  imagen_url: string | null;
}


export interface Carrito {
  id_carrito: number;
  cliente_id: number;
  estado: EstadoCarrito;
  fecha_creacion: Date;
  fecha_actualizacion: Date | null;

  detalles: DetalleCarrito[];

  total_items: number;
  subtotal: number;
}


export interface AgregarProductoCarritoDto {
  producto_id: number;
  cantidad: number;
}


export interface ActualizarCantidadCarritoDto {
  cantidad: number;
}