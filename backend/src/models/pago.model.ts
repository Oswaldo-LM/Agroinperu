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

  metodo_pago: MetodoPago;

  monto: number;

  estado_pago: EstadoPago;

  referencia_transaccion:
    string | null;

  referencia_reembolso:
    string | null;

  fecha_pago:
    Date | null;

  fecha_reembolso:
    Date | null;

  motivo_reembolso:
    string | null;

  fecha_creacion:
    Date;
}


export interface RegistrarPagoWebDto {
  venta_id: number;

  metodo_pago:
    | 'YAPE'
    | 'PLIN'
    | 'TRANSFERENCIA';

  referencia_transaccion: string;
}