import {
  EstadoVenta
} from './pedido-web.model';


export interface MiPedidoResumen {

  id_venta: number;

  codigo_venta: string;

  estado:
    EstadoVenta;

  subtotal: number;

  igv: number;

  total: number;

  fecha_creacion: string;
}


export interface MiPedidoDetalle
  extends MiPedidoResumen {

  observacion:
    string | null;

  detalles:
    MiPedidoProducto[];
}


export interface MiPedidoProducto {

  id_detalle_venta: number;

  producto_id: number;

  producto_nombre: string;

  unidad_medida: string;

  precio_unitario: number;

  cantidad: number;

  subtotal: number;
}


export interface MisPedidosResponse {

  success: boolean;

  data:
    MiPedidoResumen[];
}


export interface MiPedidoResponse {

  success: boolean;

  data:
    MiPedidoDetalle;
}