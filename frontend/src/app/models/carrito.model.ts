export type UnidadMedidaCarrito =
  | 'UNIDAD'
  | 'METRO'
  | 'ROLLO'
  | 'CAJA';


export interface CarritoItem {

  id_detalle_carrito: number;

  producto_id: number;

  codigo: string;

  nombre: string;

  unidad_medida:
    UnidadMedidaCarrito;

  precio: number;

  cantidad: number;

  stock_disponible: number;

  stock_reservado?: number;

  estado?: string;

  visible_web?: boolean;

  imagen_url?:
    string | null;
}


export interface Carrito {

  id_carrito: number;

  cliente_id: number;

  estado:
    'ACTIVO'
    | 'CONVERTIDO'
    | 'ABANDONADO';

  detalles:
    CarritoItem[];
}


export interface CarritoResponse {

  success: boolean;

  message?: string;

  data:
    Carrito | null;
}


export interface OperacionCarritoResponse {

  success: boolean;

  message?: string;

  data?:
    Carrito;
}


export interface ConfirmarVentaWebResponse {

  success: boolean;

  message?: string;

  data: {

    id_venta: number;

    codigo_venta: string;

    estado:
      'PENDIENTE_PAGO';

    subtotal: number;

    igv: number;

    total: number;
  };
}