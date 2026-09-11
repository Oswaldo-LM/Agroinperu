import {
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  DatePipe,
  DecimalPipe
} from '@angular/common';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  forkJoin,
  of
} from 'rxjs';

import {
  AuthService
} from '../../../core/services/auth.service';

import {
  CajaService
} from '../../../core/services/caja.service';

import {
  CajaSesion
} from '../../../models/caja.model';


@Component({
  selector:
    'app-caja',

  imports: [
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe
  ],

  templateUrl:
    './caja.html',

  styleUrl:
    './caja.css'
})
export class Caja
  implements OnInit {

  readonly authService =
    inject(AuthService);


  private readonly cajaService =
    inject(CajaService);


  private readonly fb =
    inject(
      NonNullableFormBuilder
    );


  readonly cajaActual =
    signal<CajaSesion | null>(
      null
    );


  readonly historial =
    signal<CajaSesion[]>(
      []
    );


  readonly historialGeneral =
    signal<CajaSesion[]>(
      []
    );


  readonly cargando =
    signal(true);


  readonly procesando =
    signal(false);


  readonly error =
    signal<string | null>(
      null
    );


  readonly mensaje =
    signal<string | null>(
      null
    );


  readonly formApertura =
    this.fb.group({

      monto_apertura: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ]
    });


  readonly formCierre =
    this.fb.group({

      efectivo_declarado: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      observacion: [
        '',
        [
          Validators.maxLength(500)
        ]
      ]
    });


  ngOnInit(): void {

    this.cargarTodo();
  }


  cargarTodo(): void {

    this.cargando.set(
      true
    );


    this.error.set(
      null
    );


    const historialGeneral$ =
      this.authService
        .esAdmin()

        ? this.cajaService
            .historialGeneral()

        : of({
            success: true,
            data: []
          });


    forkJoin({

      actual:
        this.cajaService
          .obtenerActual(),

      historial:
        this.cajaService
          .historial(),

      general:
        historialGeneral$

    })
      .subscribe({

        next: respuesta => {

          this.cajaActual.set(
            respuesta.actual.data
          );


          this.historial.set(
            respuesta.historial.data
          );


          this.historialGeneral.set(
            respuesta.general.data
          );


          this.cargando.set(
            false
          );


          this.prepararEfectivoDeclarado();
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


  refrescarCaja(): void {

    this.error.set(
      null
    );


    this.cajaService
      .obtenerActual()
      .subscribe({

        next: respuesta => {

          this.cajaActual.set(
            respuesta.data
          );


          this.prepararEfectivoDeclarado();
        },


        error: error => {

          this.error.set(
            this.obtenerMensajeError(
              error
            )
          );
        }
      });
  }


  abrirCaja(): void {

    if (
      this.procesando() ||
      this.formApertura.invalid
    ) {

      this.formApertura
        .markAllAsTouched();

      return;
    }


    const monto =
      Number(
        this.formApertura.controls
          .monto_apertura.value
      );


    if (
      !Number.isFinite(monto) ||
      monto < 0
    ) {

      this.error.set(
        'El monto de apertura no es válido.'
      );

      return;
    }


    this.limpiarMensajes();


    if (
      !window.confirm(
        `¿Abrir caja con S/ ${monto.toFixed(2)}?`
      )
    ) {

      return;
    }


    this.procesando.set(
      true
    );


    this.cajaService
      .abrir({
        monto_apertura:
          monto
      })
      .subscribe({

        next: respuesta => {

          this.procesando.set(
            false
          );


          this.mensaje.set(
            respuesta.message ??
            'Caja abierta correctamente.'
          );


          this.formApertura.reset({
            monto_apertura:
              0
          });


          this.cargarTodo();
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


  cerrarCaja(): void {

    if (
      this.procesando() ||
      this.formCierre.invalid
    ) {

      this.formCierre
        .markAllAsTouched();

      return;
    }


    const efectivo =
      Number(
        this.formCierre.controls
          .efectivo_declarado.value
      );


    if (
      !Number.isFinite(
        efectivo
      ) ||

      efectivo < 0
    ) {

      this.error.set(
        'El efectivo declarado no es válido.'
      );

      return;
    }


    const caja =
      this.cajaActual();


    if (!caja) {

      this.error.set(
        'No existe una caja abierta.'
      );

      return;
    }


    const esperado =
      Number(
        caja.resumen
          ?.efectivo_esperado
        ?? 0
      );


    const diferencia =
      this.redondear(
        efectivo -
        esperado
      );


    const textoDiferencia =
      diferencia === 0
        ? 'sin diferencia'
        : diferencia > 0
          ? `sobrante de S/ ${diferencia.toFixed(2)}`
          : `faltante de S/ ${Math.abs(diferencia).toFixed(2)}`;


    if (
      !window.confirm(
        `Efectivo esperado: S/ ${esperado.toFixed(2)}\n` +
        `Efectivo declarado: S/ ${efectivo.toFixed(2)}\n` +
        `Resultado: ${textoDiferencia}\n\n` +
        '¿Confirmas el cierre de caja?'
      )
    ) {

      return;
    }


    this.limpiarMensajes();


    this.procesando.set(
      true
    );


    this.cajaService
      .cerrar({

        efectivo_declarado:
          efectivo,

        observacion:
          this.formCierre.controls
            .observacion.value
            .trim()
          || null

      })
      .subscribe({

        next: respuesta => {

          this.procesando.set(
            false
          );


          this.mensaje.set(
            respuesta.message ??
            'Caja cerrada correctamente.'
          );


          this.formCierre.reset({

            efectivo_declarado:
              0,

            observacion:
              ''
          });


          this.cargarTodo();
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


  claseDiferencia(
    valor:
      string | number | null
  ): string {

    const diferencia =
      Number(
        valor ?? 0
      );


    if (
      diferencia > 0
    ) {

      return 'text-success';
    }


    if (
      diferencia < 0
    ) {

      return 'text-danger';
    }


    return 'text-muted';
  }


  textoDiferencia(
    valor:
      string | number | null
  ): string {

    const diferencia =
      Number(
        valor ?? 0
      );


    if (
      diferencia > 0
    ) {

      return (
        `+ S/ ${diferencia.toFixed(2)}`
      );
    }


    if (
      diferencia < 0
    ) {

      return (
        `- S/ ${Math.abs(
          diferencia
        ).toFixed(2)}`
      );
    }


    return 'S/ 0.00';
  }


  private prepararEfectivoDeclarado():
    void {

    const caja =
      this.cajaActual();


    if (!caja) {

      return;
    }


    const esperado =
      Number(
        caja.resumen
          ?.efectivo_esperado
        ?? 0
      );


    this.formCierre.patchValue({

      efectivo_declarado:
        esperado
    });
  }


  private redondear(
    valor: number
  ): number {

    return Number(
      valor.toFixed(2)
    );
  }


  private limpiarMensajes(): void {

    this.error.set(
      null
    );


    this.mensaje.set(
      null
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

        return 'La sesión ha expirado.';
      }


      if (
        error.status === 403
      ) {

        return 'No tienes permisos para realizar esta operación.';
      }


      const codigo =
        String(
          error.error?.message
          ?? ''
        );


      const mensajes:
        Record<string, string> = {

        MONTO_APERTURA_INVALIDO:
          'El monto de apertura no es válido.',

        EFECTIVO_DECLARADO_INVALIDO:
          'El efectivo declarado no es válido.',

        CAJA_YA_ABIERTA:
          'Ya tienes una caja abierta.',

        CAJA_NO_ABIERTA:
          'No tienes una caja abierta.'
      };


      return (
        mensajes[codigo]
        ??
        (
          codigo ||
          'No se pudo completar la operación.'
        )
      );
    }


    return 'No se pudo completar la operación.';
  }
}