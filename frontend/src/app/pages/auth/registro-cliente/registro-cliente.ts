import {
  Component,
  inject,
  signal
} from '@angular/core';

import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  environment
} from '../../../../environments/environment';


@Component({
  selector:
    'app-registro-cliente',

  imports: [
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './registro-cliente.html',

  styleUrl:
    './registro-cliente.css'
})
export class RegistroCliente {

  private readonly http =
    inject(HttpClient);


  private readonly fb =
    inject(
      NonNullableFormBuilder
    );


  private readonly router =
    inject(Router);


  readonly guardando =
    signal(false);


  readonly error =
    signal<string | null>(
      null
    );


  readonly form =
    this.fb.group({

      tipo_documento: [
        'DNI',
        [
          Validators.required
        ]
      ],

      numero_documento: [
        '',
        [
          Validators.required
        ]
      ],

      nombres: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      apellidos: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(120)
        ]
      ],

      telefono: [
        '',
        [
          Validators.maxLength(30)
        ]
      ],

      direccion: [
        '',
        [
          Validators.maxLength(255)
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8)
        ]
      ],

      confirmar_password: [
        '',
        [
          Validators.required
        ]
      ]
    });


  registrar(): void {

    if (
      this.form.invalid ||
      this.guardando()
    ) {

      this.form
        .markAllAsTouched();

      return;
    }


    this.error.set(
      null
    );


    const valores =
      this.form
        .getRawValue();


    if (
      valores.password !==
      valores.confirmar_password
    ) {

      this.error.set(
        'Las contraseñas no coinciden.'
      );

      return;
    }


    const documento =
      valores.numero_documento
        .trim();


    if (
      valores.tipo_documento ===
        'DNI' &&

      !/^\d{8}$/.test(
        documento
      )
    ) {

      this.error.set(
        'El DNI debe contener 8 dígitos.'
      );

      return;
    }


    if (
      valores.tipo_documento ===
        'RUC' &&

      !/^\d{11}$/.test(
        documento
      )
    ) {

      this.error.set(
        'El RUC debe contener 11 dígitos.'
      );

      return;
    }


    this.guardando.set(
      true
    );


    this.http
      .post(
        `${environment.apiUrl}/clientes/registro`,
        {

          tipo_cliente:
            'PERSONA',

          tipo_documento:
            valores.tipo_documento,

          numero_documento:
            documento,

          nombres:
            valores.nombres
              .trim(),

          apellidos:
            valores.apellidos
              .trim(),

          email:
            valores.email
              .trim()
              .toLowerCase(),

          telefono:
            valores.telefono
              .trim() || null,

          direccion:
            valores.direccion
              .trim() || null,

          password:
            valores.password
        }
      )
      .subscribe({

        next: () => {

          this.guardando.set(
            false
          );


          this.router.navigate(
            ['/login'],
            {
              queryParams: {
                registrado:
                  'true'
              }
            }
          );
        },


        error: error => {

          this.guardando.set(
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
        'No se pudo registrar la cuenta.'
      );
    }


    return 'No se pudo registrar la cuenta.';
  }
}