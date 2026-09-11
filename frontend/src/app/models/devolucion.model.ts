export interface VentaEntregadaResumen {

  id_venta: number;

  codigo_venta: string;

  canal_venta:
    'WEB' | 'TIENDA';

  cliente_id:
    number | null;

  cliente_nombre: string;

  total:
    number | string;

  fecha_creacion: string;
}


export interface ProductoDevolvible {

  id_detalle_venta: number;

  producto_id: number;

  producto_nombre: string;

  unidad_medida:
    'UNIDAD'
    | 'METRO'
    | 'ROLLO'
    | 'CAJA';

  precio_unitario:
    number | string;

  cantidad_vendida:
    number | string;

  cantidad_devuelta:
    number | string;

  cantidad_disponible_devolucion:
    number | string;
}


export interface ProductoDevolucionDto {

  detalle_venta_id: number;

  cantidad: number;
}


export interface CrearDevolucionDto {

  venta_id: number;

  motivo: string;

  productos:
    ProductoDevolucionDto[];
}


export interface DevolucionResumen {

  id_devolucion: number;

  codigo_devolucion: string;

  venta_id: number;

  codigo_venta: string;

  usuario_id: number;

  usuario_nombre: string;

  motivo: string;

  subtotal:
    number | string;

  igv:
    number | string;

  total:
    number | string;

  fecha_creacion: string;
}


export interface DetalleDevolucion {

  id_detalle_devolucion: number;

  detalle_venta_id: number;

  producto_id: number;

  producto_nombre: string;

  unidad_medida: string;

  precio_unitario:
    number | string;

  cantidad:
    number | string;

  subtotal:
    number | string;
}


export interface DevolucionDetalle
  extends DevolucionResumen {

  canal_venta:
    'WEB' | 'TIENDA';

  detalles:
    DetalleDevolucion[];
}


export interface DevolucionesResponse {

  success: boolean;

  data:
    DevolucionResumen[];
}


export interface DevolucionResponse {

  success: boolean;

  message?: string;

  data:
    DevolucionDetalle;
}


export interface VentasEntregadasResponse {

  success: boolean;

  data:
    VentaEntregadaResumen[];
}


export interface ProductosDevolviblesResponse {

  success: boolean;

  data:
    ProductoDevolvible[];
}