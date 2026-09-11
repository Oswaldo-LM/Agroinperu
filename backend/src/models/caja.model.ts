export interface AbrirCajaDto {

  monto_apertura: number;
}


export interface CerrarCajaDto {

  efectivo_declarado: number;

  observacion?:
    string | null;
}


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