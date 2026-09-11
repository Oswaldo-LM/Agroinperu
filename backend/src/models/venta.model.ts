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

  cliente_id: number | null;

  cliente_nombre: string;

  cliente_email: string | null;

  estado: EstadoVenta;

  subtotal: number;
  igv: number;
  total: number;

  fecha_creacion: Date;
}


export interface VentaWebDetalle
  extends VentaWebResumen {

  detalles: {
    id_detalle_venta: number;
    producto_id: number;
    producto_nombre: string;
    unidad_medida: string;
    precio_unitario: number;
    cantidad: number;
    subtotal: number;
  }[];
}
  
export interface DetalleVentaResultado {
  producto_id: number;
  codigo: string;
  producto_nombre: string;
  unidad_medida: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}




export interface VentaWebResultado {
  id_venta: number;
  codigo_venta: string;

  cliente_id: number;

  canal_venta: 'WEB';

  estado: 'PENDIENTE_PAGO';

  subtotal: number;
  igv: number;
  total: number;

  detalles: DetalleVentaResultado[];
}


export interface ProductoVentaTiendaDto {
  producto_id: number;
  cantidad: number;
}


export interface CrearVentaTiendaDto {
  cliente_id?: number | null;

  metodo_pago:
    | 'EFECTIVO'
    | 'TARJETA'
    | 'YAPE'
    | 'PLIN'
    | 'TRANSFERENCIA';

  referencia_transaccion?: string | null;

  tipo_comprobante:
    | 'BOLETA'
    | 'FACTURA'
    | 'NOTA_VENTA';

  productos: ProductoVentaTiendaDto[];
}


export interface VentaTiendaResultado {
  id_venta: number;

  codigo_venta: string;

  cliente_id: number | null;

  usuario_id: number;

  canal_venta: 'TIENDA';

  estado: 'ENTREGADA';

  subtotal: number;
  igv: number;
  total: number;

  metodo_pago:
    | 'EFECTIVO'
    | 'TARJETA'
    | 'YAPE'
    | 'PLIN'
    | 'TRANSFERENCIA';

  comprobante: {
    id_comprobante: number;

    tipo_comprobante:
      | 'BOLETA'
      | 'FACTURA'
      | 'NOTA_VENTA';

    serie: string;

    numero: string;
  };

  detalles: DetalleVentaResultado[];
}