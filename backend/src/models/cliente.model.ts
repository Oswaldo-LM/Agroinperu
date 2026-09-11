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
  tipo_cliente: TipoCliente;
  tipo_documento: TipoDocumento;
  numero_documento: string | null;

  nombres: string | null;
  apellidos: string | null;
  razon_social: string | null;

  email: string | null;
  telefono: string | null;
  direccion: string | null;

  estado: EstadoCliente;

  fecha_registro: Date;
  fecha_actualizacion: Date | null;
}


/*
|--------------------------------------------------------------------------
| Registro desde la página web
|--------------------------------------------------------------------------
*/

export interface RegistrarClienteWebDto {
  tipo_cliente: TipoCliente;
  tipo_documento: TipoDocumento;
  numero_documento?: string | null;

  nombres?: string | null;
  apellidos?: string | null;
  razon_social?: string | null;

  email: string;
  password: string;

  telefono?: string | null;
  direccion?: string | null;
}


/*
|--------------------------------------------------------------------------
| Registro desde sistema administrativo
|--------------------------------------------------------------------------
*/

export interface CrearClienteDto {
  tipo_cliente: TipoCliente;
  tipo_documento: TipoDocumento;
  numero_documento?: string | null;

  nombres?: string | null;
  apellidos?: string | null;
  razon_social?: string | null;

  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
}


/*
|--------------------------------------------------------------------------
| Actualización
|--------------------------------------------------------------------------
*/

export interface ActualizarClienteDto {
  tipo_cliente: TipoCliente;
  tipo_documento: TipoDocumento;
  numero_documento?: string | null;

  nombres?: string | null;
  apellidos?: string | null;
  razon_social?: string | null;

  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;

  estado: EstadoCliente;
}