import {
  EstadoVenta
} from './venta.model';


export interface ReporteResumenVentas {

  desde: string;

  hasta: string;

  cantidad_ventas: number;

  subtotal: number;

  igv: number;

  total_vendido: number;
}


export interface ReporteVentaCanal {

  canal_venta:
    | 'WEB'
    | 'TIENDA';

  cantidad_ventas: number;

  total_vendido: number;
}


export interface ReporteProductoVendido {

  producto_id: number;

  codigo: string;

  nombre: string;

  unidad_medida: string;

  cantidad_vendida: number;

  monto_vendido: number;
}


export interface ReporteMetodoPago {

  metodo_pago:
    | 'EFECTIVO'
    | 'TARJETA'
    | 'YAPE'
    | 'PLIN'
    | 'TRANSFERENCIA';

  cantidad_pagos: number;

  monto_total: number;
}


export interface ReporteVentaDetalle {

  id_venta: number;

  codigo_venta: string;

  canal_venta:
    | 'WEB'
    | 'TIENDA';

  estado:
    EstadoVenta;

  cliente_nombre:
    string | null;

  usuario_nombre:
    string | null;

  subtotal: number;

  igv: number;

  total: number;

  fecha_creacion: Date;
}


export interface ReporteVentas {

  resumen:
    ReporteResumenVentas;

  por_canal:
    ReporteVentaCanal[];

  productos_mas_vendidos:
    ReporteProductoVendido[];

  metodos_pago:
    ReporteMetodoPago[];

  ventas:
    ReporteVentaDetalle[];
}