import {
  HttpInterceptorFn
} from '@angular/common/http';

import {
  inject
} from '@angular/core';

import {
  AuthService
} from '../services/auth.service';

import {
  environment
} from '../../../environments/environment';


export const authInterceptor:
  HttpInterceptorFn =
  (
    request,
    next
  ) => {

    const authService =
      inject(
        AuthService
      );


    const token =
      authService
        .obtenerToken();


    /*
     * Solo agregamos nuestro JWT
     * a peticiones dirigidas a
     * nuestra propia API.
     */

    if (
      !token ||

      !request.url.startsWith(
        environment.apiUrl
      )
    ) {

      return next(
        request
      );
    }


    const requestAutenticada =
      request.clone({

        setHeaders: {

          Authorization:
            `Bearer ${token}`
        }
      });


    return next(
      requestAutenticada
    );
  };