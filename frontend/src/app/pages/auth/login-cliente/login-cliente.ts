import {
  Component,
  inject,
  signal
} from '@angular/core';

import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  Router,
  RouterLink,
  ActivatedRoute
} from '@angular/router';

import {
  AuthService
} from '../../../core/services/auth.service';




@Component({
  selector:
    'app-login-cliente',

  imports: [
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './login-cliente.html',

  styleUrl:
    './login-cliente.css'
})
export class LoginCliente {

  private readonly route =
  inject(
    ActivatedRoute
  );

  private readonly fb =
    inject(
      NonNullableFormBuilder
    );


  private readonly authService =
    inject(
      AuthService
    );


  private readonly router =
    inject(
      Router
    );


  readonly cargando =
    signal(false);


  readonly error =
    signal<string | null>(
      null
    );


  readonly form =
    this.fb.group({

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8)
        ]
      ]
    });


  iniciarSesion(): void {

    if (
      this.form.invalid ||
      this.cargando()
    ) {

      this.form
        .markAllAsTouched();

      return;
    }


    this.error.set(
      null
    );

    this.cargando.set(
      true
    );


    this.authService
      .loginCliente(
        this.form
          .getRawValue()
      )
      .subscribe({

        next: () => {

          this.cargando.set(
            false
          );


          const returnUrl =
  this.route.snapshot
    .queryParamMap
    .get('returnUrl');


if (
  returnUrl &&
  returnUrl.startsWith('/') &&
  !returnUrl.startsWith('//')
) {

  this.router
    .navigateByUrl(
      returnUrl
    );


  return;
}


this.router
  .navigateByUrl(
    '/cliente/cuenta'
  );
        },


        error: error => {

          this.cargando.set(
            false
          );


          this.error.set(
            this.obtenerMensajeError(
              error
            )
          );
        }
      });
  }


  private obtenerMensajeError(
    error: unknown
  ): string {

    if (
      error instanceof
      HttpErrorResponse
    ) {

      return (
        error.error?.message ??
        'No se pudo iniciar sesión'
      );
    }


    if (
      error instanceof Error
    ) {

      if (
        error.message ===
        'TOKEN_NO_RECIBIDO'
      ) {

        return 'El servidor no devolvió un token';
      }


      if (
        error.message ===
        'TOKEN_INVALIDO'
      ) {

        return 'El servidor devolvió un token inválido';
      }
    }


    return 'No se pudo iniciar sesión';
  }
}