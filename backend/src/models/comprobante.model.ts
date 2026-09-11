export type TipoComprobante =
  | 'BOLETA'
  | 'FACTURA'
  | 'NOTA_VENTA'
  | 'PROFORMA';


export type EstadoComprobante =
  | 'EMITIDO'
  | 'ANULADO';


export interface Comprobante {

  id_comprobante: number;

  venta_id: number;

  usuario_id:
    number | null;

  usuario_anulacion_id:
    number | null;

  tipo_comprobante:
    TipoComprobante;

  serie: string;

  numero: string;

  tipo_documento_cliente:
    string | null;

  documento_cliente:
    string | null;

  nombre_cliente:
    string | null;

  direccion_cliente:
    string | null;

  subtotal: number;

  igv: number;

  total: number;

  estado:
    EstadoComprobante;

  fecha_emision:
    Date;

  fecha_anulacion:
    Date | null;

  motivo_anulacion:
    string | null;
}


export interface EmitirComprobanteDto {

  tipo_comprobante:
    | 'BOLETA'
    | 'FACTURA'
    | 'NOTA_VENTA';
}