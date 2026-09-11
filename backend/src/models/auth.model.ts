export type TipoCuenta =
  | 'CLIENTE'
  | 'USUARIO';

export type RolUsuario =
  | 'ADMIN'
  | 'CAJERO';


export interface LoginDto {
  email: string;
  password: string;
}


export interface AuthPayload {
  id: number;
  tipo_cuenta: TipoCuenta;
  rol?: RolUsuario;
}


export interface UsuarioAutenticado {
  id: number;
  nombre: string;
  email: string;
  tipo_cuenta: TipoCuenta;
  rol?: RolUsuario;
}