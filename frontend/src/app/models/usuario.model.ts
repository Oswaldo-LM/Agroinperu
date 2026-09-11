export type RolUsuarioInterno =
  | 'ADMIN'
  | 'CAJERO';


export type EstadoUsuario =
  | 'ACTIVO'
  | 'INACTIVO'
  | 'BLOQUEADO';


export interface Usuario {

  id_usuario: number;

  nombre: string;

  email: string;

  rol:
    RolUsuarioInterno;

  estado:
    EstadoUsuario;

  fecha_creacion?:
    string;

  fecha_actualizacion?:
    string | null;
}


export interface CrearUsuarioDto {

  nombre: string;

  email: string;

  password: string;

  rol:
    RolUsuarioInterno;
}


export interface ActualizarUsuarioDto {

  nombre?: string;

  email?: string;

  rol?:
    RolUsuarioInterno;

  estado?:
    EstadoUsuario;
}


export interface CambiarPasswordUsuarioDto {

  password: string;
}


export interface UsuarioResponse {

  success: boolean;

  message?: string;

  data:
    Usuario;
}


export interface UsuariosResponse {

  success: boolean;

  message?: string;

  data:
    Usuario[];
}


export interface OperacionUsuarioResponse {

  success: boolean;

  message?: string;
}