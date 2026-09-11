export type TipoCliente =
  | 'PERSONA'
  | 'EMPRESA';


export type TipoDocumento =
  | 'DNI'
  | 'RUC'
  | 'CE'
  | 'PASAPORTE'
  | 'SIN_DOCUMENTO';


export type EstadoCliente =
  | 'ACTIVO'
  | 'INACTIVO'
  | 'BLOQUEADO';


export interface Cliente {

  id_cliente: number;

  tipo_cliente:
    TipoCliente;

  tipo_documento:
    TipoDocumento;

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

  estado:
    EstadoCliente;

  fecha_creacion?:
    string;

  fecha_actualizacion?:
    string | null;
}


export interface GuardarClienteDto {

  tipo_cliente:
    TipoCliente;

  tipo_documento:
    TipoDocumento;

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
}


export interface ClienteResponse {

  success: boolean;

  message?: string;

  data:
    Cliente;
}


export interface ClientesResponse {

  success: boolean;

  message?: string;

  data:
    Cliente[];
}