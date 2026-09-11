import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import {
  AuthPayload,
  LoginDto,
  UsuarioAutenticado
} from '../models/auth.model';

import {
  AuthRepository
} from '../repositories/auth.repository';



export class AuthService {

  private authRepository =
    new AuthRepository();


  async loginCliente(
    datos: LoginDto
  ): Promise<{
    token: string;
    usuario: UsuarioAutenticado;
  }> {

    if (!datos) {

      throw new Error(
        'DATOS_LOGIN_OBLIGATORIOS'
      );
    }

    const email =
      this.validarEmail(datos.email);

    this.validarPassword(datos.password);


    const cliente =
      await this.authRepository
        .obtenerClientePorEmail(email);


    if (
      !cliente ||
      !cliente.password_hash
    ) {
      throw new Error(
        'CREDENCIALES_INVALIDAS'
      );
    }


    if (
      cliente.estado !== 'ACTIVO'
    ) {
      throw new Error(
        'CUENTA_NO_DISPONIBLE'
      );
    }


    const passwordCorrecta =
      await bcrypt.compare(
        datos.password,
        cliente.password_hash
      );


    if (!passwordCorrecta) {

      throw new Error(
        'CREDENCIALES_INVALIDAS'
      );
    }


    const payload: AuthPayload = {
      id: cliente.id_cliente,
      tipo_cuenta: 'CLIENTE'
    };


    const token =
      this.generarToken(payload);


    const nombre =
      cliente.razon_social ??
      `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim();


    return {
      token,

      usuario: {
        id: cliente.id_cliente,
        nombre,
        email: cliente.email,
        tipo_cuenta: 'CLIENTE'
      }
    };
  }


  async loginUsuario(
    datos: LoginDto
  ): Promise<{
    token: string;
    usuario: UsuarioAutenticado;
  }> {

    if (!datos) {

      throw new Error(
        'DATOS_LOGIN_OBLIGATORIOS'
      );
    }

    const email =
      this.validarEmail(datos.email);

    this.validarPassword(datos.password);


    const usuario =
      await this.authRepository
        .obtenerUsuarioPorEmail(email);


    if (!usuario) {

      throw new Error(
        'CREDENCIALES_INVALIDAS'
      );
    }


    if (
      usuario.estado !== 'ACTIVO'
    ) {

      throw new Error(
        'CUENTA_NO_DISPONIBLE'
      );
    }


    const passwordCorrecta =
      await bcrypt.compare(
        datos.password,
        usuario.password_hash
      );


    if (!passwordCorrecta) {

      throw new Error(
        'CREDENCIALES_INVALIDAS'
      );
    }


    const payload: AuthPayload = {
      id: usuario.id_usuario,
      tipo_cuenta: 'USUARIO',
      rol: usuario.rol
    };


    const token =
      this.generarToken(payload);


    return {
      token,

      usuario: {
        id: usuario.id_usuario,
        nombre: usuario.nombre,
        email: usuario.email,
        tipo_cuenta: 'USUARIO',
        rol: usuario.rol
      }
    };
  }


  private generarToken(
    payload: AuthPayload
  ): string {

    const secret =
      process.env.JWT_SECRET;


    if (!secret) {

      throw new Error(
        'JWT_SECRET_NO_CONFIGURADO'
      );
    }


    return jwt.sign(
      payload,
      secret,
      {
        expiresIn: '2h'
      }
    );
  }


  private validarEmail(
    email?: string
  ): string {

    if (!email?.trim()) {

      throw new Error(
        'EMAIL_OBLIGATORIO'
      );
    }


    const valor =
      email
        .trim()
        .toLowerCase();


    const regex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!regex.test(valor)) {

      throw new Error(
        'EMAIL_INVALIDO'
      );
    }


    return valor;
  }


  private validarPassword(
    password?: string
  ): void {

    if (!password) {

      throw new Error(
        'PASSWORD_OBLIGATORIO'
      );
    }
  }
}