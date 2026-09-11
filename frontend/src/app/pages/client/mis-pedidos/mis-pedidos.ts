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
  Router
} from '@angular/router';

import {
  MisPedidosService
} from '../../../core/services/mis-pedidos.service';

import {
  PagoWebService
} from '../../../core/services/pago-web.service';

import {
  MiPedidoDetalle,
  MiPedidoResumen
} from '../../../models/mis-pedidos.model';

import {
  EstadoVenta
} from '../../../models/pedido-web.model';

import {
  Pago
} from '../../../models/pago.model';


@Component({
  selector:
    'app-mis-pedidos',

  imports: [
    DatePipe,
    DecimalPipe
  ],

  templateUrl:
    './mis-pedidos.html',

  styleUrl:
    './mis-pedidos.css'
})
export class MisPedidos
  implements OnInit {

  private readonly misPedidosService =
    inject(
      MisPedidosService
    );


  private readonly pagoWebService =
    inject(
      PagoWebService
    );


  private readonly router =
    inject(
      Router
    );


  readonly pedidos =
    signal<MiPedidoResumen[]>(
      []
    );


  readonly pedidoSeleccionado =
    signal<MiPedidoDetalle | null>(
      null
    );


  readonly pagos =
    signal<Pago[]>(
      []
    );


  readonly cargando =
    signal(
      true
    );


  readonly cargandoDetalle =
    signal(
      false
    );


  readonly error =
    signal<string | null>(
      null
    );


  readonly filtro =
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
  | Pedidos filtrados
  |--------------------------------------------------------------------------
  */

  readonly pedidosFiltrados =
    computed(
      () => {

        const estado =
          this.filtro();


        if (!estado) {

          return this.pedidos();
        }


        return this.pedidos()
          .filter(
            pedido =>
              pedido.estado ===
              estado
          );
      }
    );


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
  | Último pago
  |--------------------------------------------------------------------------
  */

  readonly ultimoPago =
    computed(
      () => {

        const pagos =
          this.pagos();


        if (
          pagos.length === 0
        ) {

          return null;
        }


        return pagos[0];
      }
    );


  /*
  |--------------------------------------------------------------------------
  | Inicio
  |--------------------------------------------------------------------------
  */

  ngOnInit(): void {

    this.cargarPedidos();
  }


  /*
  |--------------------------------------------------------------------------
  | Cargar pedidos
  |--------------------------------------------------------------------------
  */

  cargarPedidos(): void {

    this.cargando.set(
      true
    );


    this.error.set(
      null
    );


    this.misPedidosService
      .listar()
      .subscribe({

        next: respuesta => {

          this.pedidos.set(
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


  /*
  |--------------------------------------------------------------------------
  | Cambiar filtro
  |--------------------------------------------------------------------------
  */

  cambiarFiltro(
    valor: string
  ): void {

    const estado =
      this.estados
        .find(
          estado =>
            estado === valor
        )
      ??
      null;


    this.filtro.set(
      estado
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Ver detalle
  |--------------------------------------------------------------------------
  |
  | Antes utilizábamos forkJoin().
  |
  | Eso provocaba que si la consulta de pagos
  | fallaba, también desapareciera el detalle
  | completo del pedido.
  |
  | Ahora:
  |
  | 1. cargamos el pedido;
  | 2. mostramos el pedido;
  | 3. cargamos los pagos.
  |--------------------------------------------------------------------------
  */

  verDetalle(
    pedido: MiPedidoResumen
  ): void {

    this.error.set(
      null
    );


    this.cargandoDetalle.set(
      true
    );


    this.pedidoSeleccionado.set(
      null
    );


    this.pagos.set(
      []
    );


    /*
    |--------------------------------------------------------------------------
    | 1. Obtener pedido
    |--------------------------------------------------------------------------
    */

    this.misPedidosService
      .obtenerPorId(
        pedido.id_venta
      )
      .subscribe({

        next: respuestaPedido => {

          /*
           * El pedido existe y pertenece
           * al cliente.
           */

          this.pedidoSeleccionado.set(
            respuestaPedido.data
          );


          /*
          |--------------------------------------------------------------------------
          | 2. Obtener pagos
          |--------------------------------------------------------------------------
          */

          this.cargarPagosPedido(
            pedido.id_venta
          );
        },


        error: errorPedido => {

          this.cargandoDetalle.set(
            false
          );


          this.error.set(
            this.obtenerMensajeError(
              errorPedido
            )
          );
        }
      });
  }


  /*
  |--------------------------------------------------------------------------
  | Cargar pagos del pedido
  |--------------------------------------------------------------------------
  */

  private cargarPagosPedido(
    ventaId: number
  ): void {

    this.pagoWebService
      .listarPagosVenta(
        ventaId
      )
      .subscribe({

        next: respuestaPagos => {

          this.pagos.set(
            respuestaPagos.data
          );


          this.cargandoDetalle.set(
            false
          );
        },


        error: errorPagos => {

          /*
           * Si solamente falla la consulta
           * de pagos, NO ocultamos el pedido.
           */

          console.error(
            'No se pudieron cargar los pagos del pedido:',
            errorPagos
          );


          this.pagos.set(
            []
          );


          this.cargandoDetalle.set(
            false
          );
        }
      });
  }


  /*
  |--------------------------------------------------------------------------
  | Cerrar detalle
  |--------------------------------------------------------------------------
  */

  cerrarDetalle(): void {

    this.pedidoSeleccionado.set(
      null
    );


    this.pagos.set(
      []
    );


    this.error.set(
      null
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Puede registrar pago
  |--------------------------------------------------------------------------
  */

  puedeRegistrarPago():
    boolean {

    const pedido =
      this.pedidoSeleccionado();


    if (
      !pedido ||

      pedido.estado !==
        'PENDIENTE_PAGO'
    ) {

      return false;
    }


    /*
     * Si existe un pago pendiente,
     * no permitimos crear otro.
     */

    return (
      this.pagoPendiente() ===
      null
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Registrar pago
  |--------------------------------------------------------------------------
  */

  registrarPago(): void {

    const pedido =
      this.pedidoSeleccionado();


    if (!pedido) {

      return;
    }


    this.router.navigate(
      [
        '/cliente/pago',
        pedido.id_venta
      ]
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Volver al catálogo
  |--------------------------------------------------------------------------
  */

  volverCatalogo(): void {

    this.router.navigateByUrl(
      '/catalogo'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Nombre del estado
  |--------------------------------------------------------------------------
  */

  nombreEstado(
    estado: EstadoVenta
  ): string {

    switch (estado) {

      case 'PENDIENTE_PAGO':

        return (
          'Pendiente de pago'
        );


      case 'PAGADA':

        return (
          'Pago aprobado'
        );


      case 'EN_PREPARACION':

        return (
          'En preparación'
        );


      case 'LISTA_PARA_RECOGER':

        return (
          'Lista para recoger'
        );


      case 'ENTREGADA':

        return (
          'Entregada'
        );


      case 'ANULADA':

        return (
          'Anulada'
        );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Clase estado pedido
  |--------------------------------------------------------------------------
  */

  claseEstado(
    estado: EstadoVenta
  ): string {

    switch (estado) {

      case 'PENDIENTE_PAGO':

        return (
          'text-bg-warning'
        );


      case 'PAGADA':

        return (
          'text-bg-primary'
        );


      case 'EN_PREPARACION':

        return (
          'text-bg-info'
        );


      case 'LISTA_PARA_RECOGER':

        return (
          'text-bg-success'
        );


      case 'ENTREGADA':

        return (
          'text-bg-dark'
        );


      case 'ANULADA':

        return (
          'text-bg-secondary'
        );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Clase estado pago
  |--------------------------------------------------------------------------
  */

  clasePago(
    estado: string
  ): string {

    switch (estado) {

      case 'PENDIENTE':

        return (
          'text-bg-warning'
        );


      case 'APROBADO':

        return (
          'text-bg-success'
        );


      case 'RECHAZADO':

        return (
          'text-bg-danger'
        );


      case 'REEMBOLSADO':

        return (
          'text-bg-info'
        );


      default:

        return (
          'text-bg-secondary'
        );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Errores
  |--------------------------------------------------------------------------
  */

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

        return (
          'La sesión ha expirado.'
        );
      }


      if (
        error.status === 403
      ) {

        return (
          'No tienes autorización para consultar este pedido.'
        );
      }


      if (
        error.status === 404
      ) {

        return (
          'El pedido no existe o no pertenece a tu cuenta.'
        );
      }


      return (
        error.error?.message
        ??
        'No se pudieron cargar tus pedidos.'
      );
    }


    return (
      'No se pudieron cargar tus pedidos.'
    );
  }
}