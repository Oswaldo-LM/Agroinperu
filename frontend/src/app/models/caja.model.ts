export type EstadoCaja =
  | 'ABIERTA'
  | 'CERRADA';


export interface ResumenCaja {

  cantidad_ventas: number;

  total_ventas: number;

  total_efectivo: number;

  total_tarjeta: number;

  total_yape: number;

  total_plin: number;

  total_transferencia: number;

  efectivo_esperado: number;
}


export interface CajaSesion {

  id_caja_sesion: number;

  usuario_id: number;

  usuario_nombre?: string;

  usuario_email?: string;

  rol?: 'ADMIN' | 'CAJERO';

  monto_apertura:
    number | string;

  fecha_apertura: string;

  estado:
    EstadoCaja;

  fecha_cierre:
    string | null;

  cantidad_ventas:
    number | null;

  total_ventas:
    number | string | null;

  total_efectivo:
    number | string | null;

  total_tarjeta:
    number | string | null;

  total_yape:
    number | string | null;

  total_plin:
    number | string | null;

  total_transferencia:
    number | string | null;

  efectivo_esperado:
    number | string | null;

  efectivo_declarado:
    number | string | null;

  diferencia:
    number | string | null;

  observacion_cierre:
    string | null;

  resumen?:
    ResumenCaja;
}


export interface CajaActualResponse {

  success: boolean;

  data:
    CajaSesion | null;
}


export interface CajaOperacionResponse {

  success: boolean;

  message?: string;

  data:
    CajaSesion;
}


export interface CajaHistorialResponse {

  success: boolean;

  data:
    CajaSesion[];
}


export interface AbrirCajaDto {

  monto_apertura: number;
}


export interface CerrarCajaDto {

  efectivo_declarado: number;

  observacion:
    string | null;
}