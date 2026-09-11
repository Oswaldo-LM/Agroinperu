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
  RouterLink
} from '@angular/router';

import {
  AuthService
} from '../../../core/services/auth.service';


@Component({
  selector:
    'app-login-personal',

  imports: [
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './login-personal.html',

  styleUrl:
    './login-personal.css'
})
export class LoginPersonal {

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
      .loginUsuario(
        this.form
          .getRawValue()
      )
      .subscribe({

        next: () => {

          this.cargando.set(
            false
          );


          this.router
            .navigateByUrl(
              '/admin'
            );
        },


        error: error => {

          this.cargando.set(
            false
          );


          if (
            error instanceof
            HttpErrorResponse
          ) {

            this.error.set(
              error.error?.message ??
              'Credenciales incorrectas'
            );

            return;
          }


          this.error.set(
            'No se pudo iniciar sesión'
          );
        }
      });
  }
}