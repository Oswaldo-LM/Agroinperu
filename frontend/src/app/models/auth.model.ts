export type TipoCuenta =
  | 'CLIENTE'
  | 'USUARIO';


export type RolUsuario =
  | 'ADMIN'
  | 'CAJERO';


export interface SesionAuth {

  id: number;

  tipo_cuenta:
    TipoCuenta;

  rol:
    RolUsuario | null;

  exp:
    number | null;
}


export interface LoginClienteDto {

  email: string;

  password: string;
}


export interface LoginUsuarioDto {

  email: string;

  password: string;
}


/*
 * Dejamos ambas posibilidades porque
 * algunos controllers devuelven el token
 * directamente y otros dentro de data.
 */

export interface LoginResponse {

  success: boolean;

  message?: string;

  token?: string;

  data?: {

    token?: string;
  };
}