import {
  Component,
  computed,
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
  PedidoWebService
} from '../../../core/services/pedido-web.service';

import {
  PagoService
} from '../../../core/services/pago.service';

import {
  EstadoVenta,
  VentaWebDetalle,
  VentaWebResumen
} from '../../../models/pedido-web.model';

import {
  Pago
} from '../../../models/pago.model';


@Component({
  selector:
    'app-pedidos-web',

  imports: [
    DecimalPipe,
    DatePipe
  ],

  templateUrl:
    './pedidos-web.html',

  styleUrl:
    './pedidos-web.css'
})
export class PedidosWeb
  implements OnInit {

  private readonly pedidoWebService =
    inject(PedidoWebService);


  private readonly pagoService =
    inject(PagoService);


  readonly ventas =
    signal<VentaWebResumen[]>(
      []
    );


  readonly ventaSeleccionada =
    signal<VentaWebDetalle | null>(
      null
    );


  readonly pagos =
    signal<Pago[]>(
      []
    );


  readonly cargando =
    signal(true);


  readonly cargandoDetalle =
    signal(false);


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


  readonly filtroEstado =
    signal<EstadoVenta | null>(
      null
    );


  readonly estados:
    EstadoVenta[] = [

      'PENDIENTE_PAGO',
      'PAGADA',
      'EN_PREPARACION',
      'LISTA_PARA_RECOGER',
      'ENTREGADA',
      'ANULADA'
    ];


  /*
  |--------------------------------------------------------------------------
  | Pago pendiente
  |--------------------------------------------------------------------------
  */

  readonly pagoPendiente =
    computed(
      () =>
        this.pagos()
          .find(
            pago =>
              pago.estado_pago ===
              'PENDIENTE'
          )
        ??
        null
    );


  /*
  |--------------------------------------------------------------------------
  | Próximo estado permitido
  |--------------------------------------------------------------------------
  */

  readonly siguienteEstado =
    computed<
      EstadoVenta | null
    >(
      () => {

        const venta =
          this.ventaSeleccionada();


        if (!venta) {

          return null;
        }


        switch (
          venta.estado
        ) {

          case 'PAGADA':

            return 'EN_PREPARACION';


          case 'EN_PREPARACION':

            return 'LISTA_PARA_RECOGER';


          case 'LISTA_PARA_RECOGER':

            return 'ENTREGADA';


          default:

            return null;
        }
      }
    );


  ngOnInit(): void {

    this.cargarVentas();
  }


  /*
  |--------------------------------------------------------------------------
  | Listado
  |--------------------------------------------------------------------------
  */

  cargarVentas(): void {

    this.cargando.set(
      true
    );


    this.error.set(
      null
    );


    this.pedidoWebService
      .listar(
        this.filtroEstado()
          ?? undefined
      )
      .subscribe({

        next: respuesta => {

          this.ventas.set(
            respuesta.data
          );


          this.cargando.set(
            false
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


  cambiarFiltro(
    valor: string
  ): void {

    const estadosValidos:
      EstadoVenta[] =
        this.estados;


    const estado =
      estadosValidos.find(
        item =>
          item === valor
      )
      ?? null;


    this.filtroEstado.set(
      estado
    );


    this.cargarVentas();
  }


  /*
  |--------------------------------------------------------------------------
  | Detalle
  |--------------------------------------------------------------------------
  */

  verDetalle(
    venta: VentaWebResumen
  ): void {

    this.limpiarMensajes();


    this.cargandoDetalle.set(
      true
    );


    this.ventaSeleccionada.set(
      null
    );


    this.pagos.set(
      []
    );


    this.pedidoWebService
      .obtenerPorId(
        venta.id_venta
      )
      .subscribe({

        next: respuesta => {

          this.ventaSeleccionada.set(
            respuesta.data
          );


          this.cargarPagos(
            venta.id_venta
          );
        },


        error: error => {

          this.cargandoDetalle.set(
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


  cargarPagos(
    ventaId: number
  ): void {

    this.pagoService
      .listarVenta(
        ventaId
      )
      .subscribe({

        next: respuesta => {

          this.pagos.set(
            respuesta.data
          );


          this.cargandoDetalle.set(
            false
          );
        },


        error: error => {

          this.cargandoDetalle.set(
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


  cerrarDetalle(): void {

    this.ventaSeleccionada.set(
      null
    );


    this.pagos.set(
      []
    );


    this.limpiarMensajes();
  }


  /*
  |--------------------------------------------------------------------------
  | Aprobar pago
  |--------------------------------------------------------------------------
  */

  aprobarPago(
    pago: Pago
  ): void {

    if (
      this.procesando()
    ) {

      return;
    }


    if (
      !window.confirm(
        '¿Confirmas que el pago fue validado correctamente?'
      )
    ) {

      return;
    }


    this.procesando.set(
      true
    );


    this.limpiarMensajes();


    this.pagoService
      .aprobar(
        pago.id_pago
      )
      .subscribe({

        next: respuesta => {

          this.procesando.set(
            false
          );


          this.mensaje.set(
            respuesta.message ??
            'Pago aprobado correctamente.'
          );


          this.refrescarPedido();
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


  /*
  |--------------------------------------------------------------------------
  | Rechazar pago
  |--------------------------------------------------------------------------
  */

  rechazarPago(
    pago: Pago
  ): void {

    if (
      this.procesando()
    ) {

      return;
    }


    if (
      !window.confirm(
        '¿Confirmas que deseas rechazar este pago?'
      )
    ) {

      return;
    }


    this.procesando.set(
      true
    );


    this.limpiarMensajes();


    this.pagoService
      .rechazar(
        pago.id_pago
      )
      .subscribe({

        next: respuesta => {

          this.procesando.set(
            false
          );


          this.mensaje.set(
            respuesta.message ??
            'Pago rechazado correctamente.'
          );


          this.refrescarPedido();
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


  /*
  |--------------------------------------------------------------------------
  | Avanzar pedido
  |--------------------------------------------------------------------------
  */

  avanzarEstado(): void {

    const venta =
      this.ventaSeleccionada();


    const estado =
      this.siguienteEstado();


    if (
      !venta ||
      !estado ||
      this.procesando()
    ) {

      return;
    }


    if (
      !window.confirm(
        `¿Cambiar el pedido a ${this.nombreEstado(estado)}?`
      )
    ) {

      return;
    }


    this.procesando.set(
      true
    );


    this.limpiarMensajes();


    this.pedidoWebService
      .cambiarEstado(
        venta.id_venta,
        estado
      )
      .subscribe({

        next: respuesta => {

          this.procesando.set(
            false
          );


          this.mensaje.set(
            respuesta.message ??
            'Estado actualizado correctamente.'
          );


          this.refrescarPedido();
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


  /*
  |--------------------------------------------------------------------------
  | Refrescar pedido + listado
  |--------------------------------------------------------------------------
  */

  private refrescarPedido(): void {

    const ventaId =
      this.ventaSeleccionada()
        ?.id_venta;


    this.cargarVentas();


    if (!ventaId) {

      return;
    }


    this.pedidoWebService
      .obtenerPorId(
        ventaId
      )
      .subscribe({

        next: respuesta => {

          this.ventaSeleccionada.set(
            respuesta.data
          );


          this.cargarPagos(
            ventaId
          );
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


  /*
  |--------------------------------------------------------------------------
  | Labels
  |--------------------------------------------------------------------------
  */

  nombreEstado(
    estado: EstadoVenta
  ): string {

    switch (estado) {

      case 'PENDIENTE_PAGO':
        return 'Pendiente de pago';

      case 'PAGADA':
        return 'Pagada';

      case 'EN_PREPARACION':
        return 'En preparación';

      case 'LISTA_PARA_RECOGER':
        return 'Lista para recoger';

      case 'ENTREGADA':
        return 'Entregada';

      case 'ANULADA':
        return 'Anulada';
    }
  }


  textoSiguienteEstado(): string {

    const estado =
      this.siguienteEstado();


    switch (estado) {

      case 'EN_PREPARACION':
        return 'Iniciar preparación';

      case 'LISTA_PARA_RECOGER':
        return 'Marcar lista para recoger';

      case 'ENTREGADA':
        return 'Confirmar entrega';

      default:
        return '';
    }
  }


  claseEstado(
    estado: EstadoVenta
  ): string {

    switch (estado) {

      case 'PENDIENTE_PAGO':
        return 'text-bg-warning';

      case 'PAGADA':
        return 'text-bg-primary';

      case 'EN_PREPARACION':
        return 'text-bg-info';

      case 'LISTA_PARA_RECOGER':
        return 'text-bg-success';

      case 'ENTREGADA':
        return 'text-bg-dark';

      case 'ANULADA':
        return 'text-bg-secondary';
    }
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

        return 'La sesión ha expirado o no es válida.';
      }


      if (
        error.status === 403
      ) {

        return 'No tienes permisos para realizar esta operación.';
      }


      return (
        error.error?.message ??
        'No se pudo completar la operación.'
      );
    }


    return 'No se pudo completar la operación.';
  }
}