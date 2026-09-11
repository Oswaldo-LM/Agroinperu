import bcrypt from 'bcrypt';

import type {
  RolUsuario
} from '../models/auth.model';

import {
  ActualizarUsuarioDto,
  CambiarPasswordUsuarioDto,
  CrearUsuarioDto,
  EstadoUsuario,
  Usuario
} from '../models/usuario.model';

import {
  UsuarioRepository
} from '../repositories/usuario.repository';


export class UsuarioService {

  private usuarioRepository =
    new UsuarioRepository();


  /*
  |--------------------------------------------------------------------------
  | Listar
  |--------------------------------------------------------------------------
  */

  async listar():
    Promise<Usuario[]> {

    return this.usuarioRepository
      .listar();
  }


  /*
  |--------------------------------------------------------------------------
  | Obtener por ID
  |--------------------------------------------------------------------------
  */

  async obtenerPorId(
    id: number
  ): Promise<Usuario> {

    this.validarId(id);


    const usuario =
      await this.usuarioRepository
        .obtenerPorId(id);


    if (!usuario) {

      throw new Error(
        'USUARIO_NO_ENCONTRADO'
      );
    }


    return usuario;
  }


  /*
  |--------------------------------------------------------------------------
  | Crear
  |--------------------------------------------------------------------------
  */

  async crear(
    datos: CrearUsuarioDto
  ): Promise<Usuario> {

    if (!datos) {

      throw new Error(
        'DATOS_USUARIO_OBLIGATORIOS'
      );
    }


    const nombre =
      this.validarNombre(
        datos.nombre
      );


    const email =
      this.validarEmail(
        datos.email
      );


    this.validarRol(
      datos.rol
    );


    this.validarPassword(
      datos.password
    );


    const existente =
      await this.usuarioRepository
        .obtenerPorEmail(
          email
        );


    if (existente) {

      throw new Error(
        'EMAIL_EN_USO'
      );
    }


    const passwordHash =
      await bcrypt.hash(
        datos.password,
        12
      );


    const usuarioId =
      await this.usuarioRepository
        .crear(
          nombre,
          email,
          passwordHash,
          datos.rol
        );


    return this.obtenerPorId(
      usuarioId
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Actualizar
  |--------------------------------------------------------------------------
  */

  async actualizar(
    administradorId: number,

    usuarioId: number,

    datos: ActualizarUsuarioDto
  ): Promise<Usuario> {

    this.validarId(
      administradorId
    );

    this.validarId(
      usuarioId
    );


    if (!datos) {

      throw new Error(
        'DATOS_USUARIO_OBLIGATORIOS'
      );
    }


    const usuarioActual =
      await this.usuarioRepository
        .obtenerPorId(
          usuarioId
        );


    if (!usuarioActual) {

      throw new Error(
        'USUARIO_NO_ENCONTRADO'
      );
    }


    const nombre =
      datos.nombre !== undefined

        ? this.validarNombre(
            datos.nombre
          )

        : usuarioActual.nombre;


    const email =
      datos.email !== undefined

        ? this.validarEmail(
            datos.email
          )

        : usuarioActual.email;


    const rol =
      datos.rol ??
      usuarioActual.rol;


    const estado =
      datos.estado ??
      usuarioActual.estado;


    this.validarRol(
      rol
    );

    this.validarEstado(
      estado
    );


    /*
    |--------------------------------------------------------------------------
    | No permitir auto-degradación
    |--------------------------------------------------------------------------
    */

    if (
      administradorId ===
        usuarioId &&

      rol !==
        usuarioActual.rol
    ) {

      throw new Error(
        'NO_PUEDE_CAMBIAR_SU_PROPIO_ROL'
      );
    }


    /*
    |--------------------------------------------------------------------------
    | No permitir bloquear/inactivar
    | la cuenta propia
    |--------------------------------------------------------------------------
    */

    if (
      administradorId ===
        usuarioId &&

      estado !==
        'ACTIVO'
    ) {

      throw new Error(
        'NO_PUEDE_DESACTIVAR_SU_PROPIA_CUENTA'
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Evitar correo duplicado
    |--------------------------------------------------------------------------
    */

    if (
      email !==
      usuarioActual.email
    ) {

      const existente =
        await this.usuarioRepository
          .obtenerPorEmail(
            email
          );


      if (
        existente &&
        existente.id_usuario !==
          usuarioId
      ) {

        throw new Error(
          'EMAIL_EN_USO'
        );
      }
    }


    /*
    |--------------------------------------------------------------------------
    | Proteger al último ADMIN activo
    |--------------------------------------------------------------------------
    */

    const dejaDeSerAdminActivo =

      usuarioActual.rol ===
        'ADMIN' &&

      usuarioActual.estado ===
        'ACTIVO' &&

      (
        rol !== 'ADMIN' ||
        estado !== 'ACTIVO'
      );


    if (
      dejaDeSerAdminActivo
    ) {

      const totalAdmins =
        await this.usuarioRepository
          .contarAdminsActivos();


      if (
        totalAdmins <= 1
      ) {

        throw new Error(
          'ULTIMO_ADMIN_ACTIVO'
        );
      }
    }


    await this.usuarioRepository
      .actualizar(
        usuarioId,
        nombre,
        email,
        rol,
        estado
      );


    return this.obtenerPorId(
      usuarioId
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Cambiar contraseña
  |--------------------------------------------------------------------------
  */

  async cambiarPassword(
    usuarioId: number,

    datos: CambiarPasswordUsuarioDto
  ): Promise<void> {

    this.validarId(
      usuarioId
    );


    if (!datos) {

      throw new Error(
        'DATOS_PASSWORD_OBLIGATORIOS'
      );
    }


    this.validarPassword(
      datos.password
    );


    const usuario =
      await this.usuarioRepository
        .obtenerPorId(
          usuarioId
        );


    if (!usuario) {

      throw new Error(
        'USUARIO_NO_ENCONTRADO'
      );
    }


    const passwordHash =
      await bcrypt.hash(
        datos.password,
        12
      );


    await this.usuarioRepository
      .actualizarPassword(
        usuarioId,
        passwordHash
      );
  }


  /*
  |--------------------------------------------------------------------------
  | Inactivar
  |--------------------------------------------------------------------------
  */

  async eliminar(
    administradorId: number,

    usuarioId: number
  ): Promise<void> {

    this.validarId(
      administradorId
    );

    this.validarId(
      usuarioId
    );


    if (
      administradorId ===
      usuarioId
    ) {

      throw new Error(
        'NO_PUEDE_DESACTIVAR_SU_PROPIA_CUENTA'
      );
    }


    const usuario =
      await this.usuarioRepository
        .obtenerPorId(
          usuarioId
        );


    if (!usuario) {

      throw new Error(
        'USUARIO_NO_ENCONTRADO'
      );
    }


    if (
      usuario.estado ===
      'INACTIVO'
    ) {

      throw new Error(
        'USUARIO_YA_INACTIVO'
      );
    }


    if (
      usuario.rol ===
        'ADMIN' &&

      usuario.estado ===
        'ACTIVO'
    ) {

      const totalAdmins =
        await this.usuarioRepository
          .contarAdminsActivos();


      if (
        totalAdmins <= 1
      ) {

        throw new Error(
          'ULTIMO_ADMIN_ACTIVO'
        );
      }
    }


    await this.usuarioRepository
      .desactivar(
        usuarioId
      );
  }


  /*
  |--------------------------------------------------------------------------
  | Validaciones
  |--------------------------------------------------------------------------
  */

  private validarNombre(
    nombre: string
  ): string {

    const valor =
      nombre?.trim();


    if (!valor) {

      throw new Error(
        'NOMBRE_OBLIGATORIO'
      );
    }


    if (
      valor.length > 100
    ) {

      throw new Error(
        'NOMBRE_MUY_LARGO'
      );
    }


    return valor;
  }


  private validarEmail(
    email: string
  ): string {

    const valor =
      email
        ?.trim()
        .toLowerCase();


    if (!valor) {

      throw new Error(
        'EMAIL_OBLIGATORIO'
      );
    }


    const regex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
      !regex.test(valor)
    ) {

      throw new Error(
        'EMAIL_INVALIDO'
      );
    }


    if (
      valor.length > 120
    ) {

      throw new Error(
        'EMAIL_MUY_LARGO'
      );
    }


    return valor;
  }


  private validarPassword(
    password: string
  ): void {

    if (
      typeof password !==
        'string' ||

      password.length < 8 ||

      password.length > 72
    ) {

      throw new Error(
        'PASSWORD_INVALIDO'
      );
    }
  }


  private validarRol(
    rol: RolUsuario
  ): void {

    const roles:
      RolUsuario[] = [

        'ADMIN',

        'CAJERO'
      ];


    if (
      !roles.includes(rol)
    ) {

      throw new Error(
        'ROL_INVALIDO'
      );
    }
  }


  private validarEstado(
    estado: EstadoUsuario
  ): void {

    const estados:
      EstadoUsuario[] = [

        'ACTIVO',

        'INACTIVO',

        'BLOQUEADO'
      ];


    if (
      !estados.includes(
        estado
      )
    ) {

      throw new Error(
        'ESTADO_INVALIDO'
      );
    }
  }


  private validarId(
    id: number
  ): void {

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      throw new Error(
        'ID_INVALIDO'
      );
    }
  }
}