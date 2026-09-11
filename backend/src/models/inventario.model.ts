export type TipoMovimientoStock =
  | 'ENTRADA'
  | 'VENTA_TIENDA'
  | 'RESERVA_WEB'
  | 'LIBERACION_RESERVA'
  | 'ENTREGA_WEB'
  | 'AJUSTE'
  | 'DEVOLUCION';


export interface RegistrarEntradaDto {

  producto_id: number;

  cantidad: number;

  motivo: string;
}


export interface RegistrarAjusteDto {

  producto_id: number;

  nuevo_stock_fisico: number;

  motivo: string;
}


export interface ResultadoInventario {

  producto_id: number;

  codigo: string;

  nombre: string;

  stock_disponible: number;

  stock_reservado: number;

  stock_fisico: number;
}


export interface MovimientoStock {

  id_movimiento: number;

  producto_id: number;

  codigo_producto: string;

  nombre_producto: string;

  venta_id: number | null;

  usuario_id: number | null;

  tipo_movimiento:
    TipoMovimientoStock;

  cantidad: number;

  stock_disponible_anterior:
    number;

  stock_disponible_nuevo:
    number;

  stock_reservado_anterior:
    number;

  stock_reservado_nuevo:
    number;

  motivo:
    string | null;

  fecha_movimiento:
    Date;
}