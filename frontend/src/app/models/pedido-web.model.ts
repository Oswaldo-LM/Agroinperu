export type EstadoVenta =
  | 'PENDIENTE_PAGO'
  | 'PAGADA'
  | 'EN_PREPARACION'
  | 'LISTA_PARA_RECOGER'
  | 'ENTREGADA'
  | 'ANULADA';


export interface VentaWebResumen {

  id_venta: number;

  codigo_venta: string;

  cliente_id: number;

  cliente_nombre: string;

  cliente_email:
    string | null;

  estado:
    EstadoVenta;

  subtotal: number;

  igv: number;

  total: number;

  fecha_creacion: string;
}


export interface DetalleVentaWeb {

  id_detalle_venta: number;

  producto_id: number;

  producto_nombre: string;

  unidad_medida: string;

  precio_unitario: number;

  cantidad: number;

  subtotal: number;
}


export interface VentaWebDetalle
  extends VentaWebResumen {

  detalles:
    DetalleVentaWeb[];
}


export interface VentasWebResponse {

  success: boolean;

  data:
    VentaWebResumen[];
}


export interface VentaWebDetalleResponse {

  success: boolean;

  data:
    VentaWebDetalle;
}


export interface OperacionVentaResponse {

  success: boolean;

  message?: string;
}