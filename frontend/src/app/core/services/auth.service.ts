import {
  computed,
  inject,
  Injectable,
  signal
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  map,
  Observable
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';

import {
  LoginClienteDto,
  LoginResponse,
  LoginUsuarioDto,
  RolUsuario,
  SesionAuth
} from '../../models/auth.model';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http =
    inject(
      HttpClient
    );


  /*
  |--------------------------------------------------------------------------
  | Clave de sesión
  |--------------------------------------------------------------------------
  |
  | La sesión ahora se guarda en sessionStorage.
  |
  | De esta manera:
  |
  | Pestaña 1 -> CLIENTE
  | Pestaña 2 -> ADMIN / CAJERO
  |
  | pueden permanecer autenticadas al mismo tiempo
  | sin reemplazar sus respectivos JWT.
  |--------------------------------------------------------------------------
  */

  private readonly TOKEN_KEY =
    'agroinperu_token';


  private readonly sesionSignal =
    signal<SesionAuth | null>(
      null
    );


  readonly sesion =
    this.sesionSignal
      .asReadonly();


  readonly autenticado =
    computed(
      () =>
        this.sesion() !== null
    );


  readonly esCliente =
    computed(
      () =>
        this.sesion()
          ?.tipo_cuenta ===
        'CLIENTE'
    );


  readonly esUsuario =
    computed(
      () =>
        this.sesion()
          ?.tipo_cuenta ===
        'USUARIO'
    );


  readonly esAdmin =
    computed(
      () =>
        this.sesion()
          ?.tipo_cuenta ===
          'USUARIO' &&

        this.sesion()
          ?.rol ===
          'ADMIN'
    );


  readonly esCajero =
    computed(
      () =>
        this.sesion()
          ?.tipo_cuenta ===
          'USUARIO' &&

        this.sesion()
          ?.rol ===
          'CAJERO'
    );


  constructor() {

    /*
     * Eliminamos cualquier token antiguo
     * que haya quedado de la versión
     * anterior que utilizaba localStorage.
     */

    this.limpiarTokenAnterior();


    /*
     * Recuperamos la sesión correspondiente
     * a ESTA pestaña.
     */

    this.restaurarSesion();
  }


  /*
  |--------------------------------------------------------------------------
  | Login cliente
  |--------------------------------------------------------------------------
  */

  loginCliente(
    datos: LoginClienteDto
  ): Observable<void> {

    return this.http
      .post<LoginResponse>(
        `${environment.apiUrl}/auth/clientes/login`,
        datos
      )
      .pipe(
        map(
          respuesta => {

            const token =
              this.extraerToken(
                respuesta
              );


            this.guardarSesion(
              token
            );
          }
        )
      );
  }


  /*
  |--------------------------------------------------------------------------
  | Login ADMIN / CAJERO
  |--------------------------------------------------------------------------
  */

  loginUsuario(
    datos: LoginUsuarioDto
  ): Observable<void> {

    return this.http
      .post<LoginResponse>(
        `${environment.apiUrl}/auth/usuarios/login`,
        datos
      )
      .pipe(
        map(
          respuesta => {

            const token =
              this.extraerToken(
                respuesta
              );


            this.guardarSesion(
              token
            );
          }
        )
      );
  }


  /*
  |--------------------------------------------------------------------------
  | Token para interceptor
  |--------------------------------------------------------------------------
  */

  obtenerToken():
    string | null {

    const token =
      sessionStorage.getItem(
        this.TOKEN_KEY
      );


    if (!token) {

      return null;
    }


    const sesion =
      this.decodificarToken(
        token
      );


    if (!sesion) {

      this.cerrarSesion();

      return null;
    }


    if (
      sesion.exp !== null &&
      sesion.exp * 1000 <=
        Date.now()
    ) {

      this.cerrarSesion();

      return null;
    }


    return token;
  }


  /*
  |--------------------------------------------------------------------------
  | Cerrar sesión
  |--------------------------------------------------------------------------
  */

  cerrarSesion(): void {

    sessionStorage.removeItem(
      this.TOKEN_KEY
    );


    this.sesionSignal.set(
      null
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Guardar JWT
  |--------------------------------------------------------------------------
  */

  private guardarSesion(
    token: string
  ): void {

    const sesion =
      this.decodificarToken(
        token
      );


    if (!sesion) {

      throw new Error(
        'TOKEN_INVALIDO'
      );
    }


    if (
      sesion.exp !== null &&
      sesion.exp * 1000 <=
        Date.now()
    ) {

      throw new Error(
        'TOKEN_EXPIRADO'
      );
    }


    /*
     * IMPORTANTE:
     *
     * sessionStorage pertenece a la pestaña.
     *
     * Ya no utilizamos localStorage.
     */

    sessionStorage.setItem(
      this.TOKEN_KEY,
      token
    );


    this.sesionSignal.set(
      sesion
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Recuperar sesión al recargar
  |--------------------------------------------------------------------------
  */

  private restaurarSesion(): void {

    const token =
      sessionStorage.getItem(
        this.TOKEN_KEY
      );


    if (!token) {

      return;
    }


    const sesion =
      this.decodificarToken(
        token
      );


    if (
      !sesion ||

      (
        sesion.exp !== null &&
        sesion.exp * 1000 <=
          Date.now()
      )
    ) {

      sessionStorage.removeItem(
        this.TOKEN_KEY
      );

      return;
    }


    this.sesionSignal.set(
      sesion
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Limpiar token antiguo
  |--------------------------------------------------------------------------
  |
  | Antes utilizábamos:
  |
  | localStorage
  |
  | Eliminamos ese valor para evitar que
  | quede un JWT antiguo guardado.
  |--------------------------------------------------------------------------
  */

  private limpiarTokenAnterior():
    void {

    localStorage.removeItem(
      this.TOKEN_KEY
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Obtener token de respuesta
  |--------------------------------------------------------------------------
  */

  private extraerToken(
    respuesta: LoginResponse
  ): string {

    const token =
      respuesta.token ??
      respuesta.data?.token;


    if (!token) {

      throw new Error(
        'TOKEN_NO_RECIBIDO'
      );
    }


    return token;
  }


  /*
  |--------------------------------------------------------------------------
  | Leer payload JWT
  |--------------------------------------------------------------------------
  |
  | Esto únicamente permite al frontend
  | conocer:
  |
  | - ID
  | - tipo de cuenta
  | - rol
  | - expiración
  |
  | La validación real del JWT sigue
  | realizándose en Express.
  |--------------------------------------------------------------------------
  */

  private decodificarToken(
    token: string
  ): SesionAuth | null {

    try {

      const partes =
        token.split('.');


      if (
        partes.length !== 3
      ) {

        return null;
      }


      let payloadBase64 =
        partes[1]
          .replace(
            /-/g,
            '+'
          )
          .replace(
            /_/g,
            '/'
          );


      while (
        payloadBase64.length %
          4 !==
        0
      ) {

        payloadBase64 += '=';
      }


      const payload =
        JSON.parse(
          atob(
            payloadBase64
          )
        ) as {

          id?: number;

          tipo_cuenta?: string;

          rol?: string;

          exp?: number;
        };


      const id =
        Number(
          payload.id
        );


      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {

        return null;
      }


      if (
        payload.tipo_cuenta !==
          'CLIENTE' &&

        payload.tipo_cuenta !==
          'USUARIO'
      ) {

        return null;
      }


      let rol:
        RolUsuario | null =
          null;


      if (
        payload.tipo_cuenta ===
        'USUARIO'
      ) {

        if (
          payload.rol !==
            'ADMIN' &&

          payload.rol !==
            'CAJERO'
        ) {

          return null;
        }


        rol =
          payload.rol;
      }


      return {

        id,

        tipo_cuenta:
          payload.tipo_cuenta,

        rol,

        exp:
          typeof payload.exp ===
            'number'
            ? payload.exp
            : null
      };


    } catch {

      return null;
    }
  }
}