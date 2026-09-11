export type MetodoPago =
  | 'EFECTIVO'
  | 'TARJETA'
  | 'YAPE'
  | 'PLIN'
  | 'TRANSFERENCIA';


export type EstadoPago =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'ANULADO'
  | 'REEMBOLSADO';


export interface Pago {

  id_pago: number;

  venta_id: number;

  metodo_pago:
    MetodoPago;

  monto: number;

  estado_pago:
    EstadoPago;

  referencia_transaccion:
    string | null;

  referencia_reembolso:
    string | null;

  fecha_pago:
    string | null;

  fecha_reembolso:
    string | null;

  motivo_reembolso:
    string | null;

  fecha_creacion:
    string;
}


export interface PagosResponse {

  success: boolean;

  data:
    Pago[];
}


export interface OperacionPagoResponse {

  success: boolean;

  message?: string;
}

export type MetodoPagoWeb =
  | 'YAPE'
  | 'PLIN'
  | 'TRANSFERENCIA';


export interface RegistrarPagoWebDto {

  venta_id: number;

  metodo_pago:
    MetodoPagoWeb;

  referencia_transaccion:
    string;
}


export interface RegistrarPagoWebResponse {

  success: boolean;

  message?: string;

  data?: Pago;
}