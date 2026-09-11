export type EstadoProforma =
  | 'VIGENTE'
  | 'VENCIDA'
  | 'ANULADA';


export interface ProductoProformaDto {

  producto_id: number;

  cantidad: number;
}


export interface CrearProformaDto {

  cliente_id: number;

  fecha_vencimiento: string;

  observacion:
    string | null;

  productos:
    ProductoProformaDto[];
}


export interface ProformaResumen {

  id_proforma: number;

  codigo_proforma: string;

  serie: string;

  numero: string;

  cliente_id: number;

  cliente_nombre: string;

  usuario_id: number;

  usuario_nombre: string;

  subtotal: number;

  igv: number;

  total: number;

  fecha_vencimiento: string;

  estado:
    EstadoProforma;

  observacion:
    string | null;

  fecha_creacion: string;
}


export interface DetalleProforma {

  id_detalle_proforma: number;

  producto_id: number;

  producto_nombre: string;

  unidad_medida:
    'UNIDAD'
    | 'METRO'
    | 'ROLLO'
    | 'CAJA';

  precio_unitario: number;

  cantidad: number;

  subtotal: number;
}


export interface ProformaDetalle
  extends ProformaResumen {

  tipo_cliente:
    'PERSONA'
    | 'EMPRESA';

  tipo_documento: string;

  numero_documento:
    string | null;

  nombres:
    string | null;

  apellidos:
    string | null;

  razon_social:
    string | null;

  email:
    string | null;

  telefono:
    string | null;

  direccion:
    string | null;

  usuario_anulacion_id:
    number | null;

  fecha_anulacion:
    string | null;

  motivo_anulacion:
    string | null;

  detalles:
    DetalleProforma[];
}


export interface ProformasResponse {

  success: boolean;

  data:
    ProformaResumen[];
}


export interface ProformaResponse {

  success: boolean;

  message?: string;

  data:
    ProformaDetalle;
}