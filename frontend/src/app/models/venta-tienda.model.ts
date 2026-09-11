export type MetodoPago =
  | 'EFECTIVO'
  | 'TARJETA'
  | 'YAPE'
  | 'PLIN'
  | 'TRANSFERENCIA';


export type TipoComprobante =
  | 'BOLETA'
  | 'FACTURA'
  | 'NOTA_VENTA';


export interface ProductoVentaTiendaDto {

  producto_id: number;

  cantidad: number;
}


export interface CrearVentaTiendaDto {

  cliente_id:
    number | null;

  metodo_pago:
    MetodoPago;

  referencia_transaccion:
    string | null;

  tipo_comprobante:
    TipoComprobante;

  productos:
    ProductoVentaTiendaDto[];
}


export interface ComprobanteVentaTienda {

  id_comprobante: number;

  tipo_comprobante:
    TipoComprobante;

  serie: string;

  numero: string;
}


export interface DetalleVentaTienda {

  producto_id: number;

  producto_nombre?: string;

  unidad_medida?: string;

  precio_unitario?: number;

  cantidad: number;

  subtotal?: number;
}


export interface VentaTiendaResultado {

  id_venta: number;

  codigo_venta: string;

  cliente_id:
    number | null;

  usuario_id: number;

  canal_venta:
    'TIENDA';

  estado:
    'ENTREGADA';

  subtotal: number;

  igv: number;

  total: number;

  metodo_pago:
    MetodoPago;

  comprobante:
    ComprobanteVentaTienda;

  detalles?:
    DetalleVentaTienda[];
}


export interface VentaTiendaResponse {

  success: boolean;

  message?: string;

  data:
    VentaTiendaResultado;
}