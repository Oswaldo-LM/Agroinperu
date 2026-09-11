import type {
  RolUsuario
} from './auth.model';


export type EstadoUsuario =
  | 'ACTIVO'
  | 'INACTIVO'
  | 'BLOQUEADO';


export interface Usuario {
  id_usuario: number;

  nombre: string;

  email: string;

  rol: RolUsuario;

  estado: EstadoUsuario;

  fecha_creacion: Date;

  fecha_actualizacion:
    Date | null;
}


export interface CrearUsuarioDto {

  nombre: string;

  email: string;

  password: string;

  rol: RolUsuario;
}


export interface ActualizarUsuarioDto {

  nombre?: string;

  email?: string;

  rol?: RolUsuario;

  estado?: EstadoUsuario;
}


export interface CambiarPasswordUsuarioDto {

  password: string;
}