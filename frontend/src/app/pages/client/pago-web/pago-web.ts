import {
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  PagoWebService
} from '../../../core/services/pago-web.service';

import {
  MetodoPagoWeb
} from '../../../models/pago.model';


@Component({
  selector:
    'app-pago-web',

  imports: [
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './pago-web.html',

  styleUrl:
    './pago-web.css'
})
export class PagoWeb
  implements OnInit {

  private readonly pagoWebService =
    inject(
      PagoWebService
    );


  private readonly route =
    inject(
      ActivatedRoute
    );


  private readonly router =
    inject(
      Router
    );


  private readonly fb =
    inject(
      NonNullableFormBuilder
    );


  readonly ventaId =
    signal<number | null>(
      null
    );


  readonly procesando =
    signal(false);


  readonly pagoRegistrado =
    signal(false);


  readonly error =
    signal<string | null>(
      null
    );


  readonly mensaje =
    signal<string | null>(
      null
    );


  readonly metodosPago:
    MetodoPagoWeb[] = [

      'YAPE',
      'PLIN',
      'TRANSFERENCIA'
    ];


  readonly form =
    this.fb.group({

      metodo_pago: [
        'YAPE' as MetodoPagoWeb,
        [
          Validators.required
        ]
      ],

      referencia_transaccion: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ]
    });


  ngOnInit(): void {

    const id =
      Number(
        this.route.snapshot
          .paramMap
          .get('ventaId')
      );


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      this.error.set(
        'El pedido indicado no es válido.'
      );


      return;
    }


    this.ventaId.set(
      id
    );
  }


  registrarPago(): void {

    if (
      this.procesando() ||
      this.pagoRegistrado()
    ) {

      return;
    }


    if (
      this.form.invalid
    ) {

      this.form
        .markAllAsTouched();


      return;
    }


    this.error.set(
      null
    );


    this.mensaje.set(
      null
    );


    const ventaId =
      this.ventaId();


    if (!ventaId) {

      this.error.set(
        'No se pudo identificar el pedido.'
      );


      return;
    }


    const valores =
      this.form
        .getRawValue();


    const referencia =
      valores
        .referencia_transaccion
        .trim();


    if (!referencia) {

      this.error.set(
        'Ingresa el número o referencia de la operación.'
      );


      return;
    }


    this.procesando.set(
      true
    );


    this.pagoWebService
      .registrarPago({

        venta_id:
          ventaId,

        metodo_pago:
          valores.metodo_pago,

        referencia_transaccion:
          referencia

      })
      .subscribe({

        next: respuesta => {

          this.procesando.set(
            false
          );


          this.pagoRegistrado.set(
            true
          );


          this.mensaje.set(
            respuesta.message ??
            'Pago registrado correctamente.'
          );


          this.form.disable();
        },


        error: error => {

          this.procesando.set(
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


  volverCatalogo(): void {

    this.router.navigateByUrl(
      '/catalogo'
    );
  }


  irCuenta(): void {

    this.router.navigateByUrl(
      '/cliente/cuenta'
    );
  }


  private obtenerMensajeError(
    error: unknown
  ): string {

    if (
      error instanceof
      HttpErrorResponse
    ) {

      if (
        error.status === 401
      ) {

        return 'La sesión ha expirado. Inicia sesión nuevamente.';
      }


      if (
        error.status === 403
      ) {

        return 'No tienes autorización para registrar el pago de este pedido.';
      }


      const mensaje =
        error.error?.message;


      if (
        mensaje ===
        'VENTA_NO_ENCONTRADA'
      ) {

        return 'El pedido no existe.';
      }


      if (
        mensaje ===
        'VENTA_NO_PERTENECE_CLIENTE'
      ) {

        return 'Este pedido no pertenece a tu cuenta.';
      }


      if (
        mensaje ===
        'VENTA_NO_PENDIENTE_PAGO'
      ) {

        return 'Este pedido ya no se encuentra pendiente de pago.';
      }


      if (
        mensaje ===
        'PAGO_PENDIENTE_EXISTENTE'
      ) {

        return 'Ya existe un pago pendiente de validación para este pedido.';
      }


      if (
        mensaje ===
        'METODO_PAGO_INVALIDO'
      ) {

        return 'Selecciona un método de pago válido.';
      }


      if (
        mensaje ===
        'REFERENCIA_REQUERIDA'
      ) {

        return 'Ingresa la referencia de la operación.';
      }


      return (
        mensaje ??
        'No se pudo registrar el pago.'
      );
    }


    return 'No se pudo registrar el pago.';
  }
}