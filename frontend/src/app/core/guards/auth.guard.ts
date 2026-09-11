import {
  inject
} from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  AuthService
} from '../services/auth.service';


/*
|--------------------------------------------------------------------------
| CLIENTE
|--------------------------------------------------------------------------
*/

export const clienteGuard:
  CanActivateFn =
  (
    route,
    state
  ) => {

    const authService =
      inject(
        AuthService
      );

    const router =
      inject(
        Router
      );


    const sesion =
      authService.sesion();


    if (
      sesion?.tipo_cuenta ===
      'CLIENTE'
    ) {

      return true;
    }


    return router.createUrlTree(
      ['/login'],
      {
        queryParams: {
          returnUrl:
            state.url
        }
      }
    );
  };


/*
|--------------------------------------------------------------------------
| PERSONAL INTERNO
|--------------------------------------------------------------------------
*/

export const usuarioGuard:
  CanActivateFn =
  (
    route,
    state
  ) => {

    const authService =
      inject(
        AuthService
      );

    const router =
      inject(
        Router
      );


    const sesion =
      authService.sesion();


    if (
      sesion?.tipo_cuenta ===
      'USUARIO'
    ) {

      return true;
    }


    return router.createUrlTree(
      ['/admin/login'],
      {
        queryParams: {
          returnUrl:
            state.url
        }
      }
    );
  };


/*
|--------------------------------------------------------------------------
| SOLO ADMIN
|--------------------------------------------------------------------------
*/

export const adminGuard:
  CanActivateFn =
  () => {

    const authService =
      inject(
        AuthService
      );

    const router =
      inject(
        Router
      );


    const sesion =
      authService.sesion();


    if (
      sesion?.tipo_cuenta ===
        'USUARIO' &&

      sesion.rol ===
        'ADMIN'
    ) {

      return true;
    }


    /*
     * Si es cajero, sigue siendo
     * usuario interno, pero no ADMIN.
     */

    if (
      sesion?.tipo_cuenta ===
      'USUARIO'
    ) {

      return router
        .createUrlTree([
          '/admin'
        ]);
    }


    return router
      .createUrlTree([
        '/admin/login'
      ]);
  };