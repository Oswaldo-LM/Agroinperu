import {
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  DecimalPipe
} from '@angular/common';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  Router
} from '@angular/router';

import {
  CarritoService
} from '../../../core/services/carrito.service';

import {
  VentaWebService
} from '../../../core/services/venta-web.service';

import {
  Carrito,
  CarritoItem
} from '../../../models/carrito.model';


@Component({
  selector:
    'app-carrito',

  imports: [
    DecimalPipe
  ],

  templateUrl:
    './carrito.html',

  styleUrl:
    './carrito.css'
})
export class CarritoComponent
  implements OnInit {

  private readonly carritoService =
    inject(CarritoService);


  private readonly ventaWebService =
    inject(VentaWebService);


  private readonly router =
    inject(Router);


  readonly carrito =
    signal<Carrito | null>(
      null
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


  readonly subtotal =
  computed(
    () => {

      const carrito =
        this.carrito();


      if (!carrito) {

        return 0;
      }


      const total =
        carrito.detalles
          .reduce(
            (
              acumulado,
              detalle
            ) => {

              return (
                acumulado +
                Number(
                  detalle.precio
                ) *
                Number(
                  detalle.cantidad
                )
              );
            },
            0
          );


      return this.redondear(
        total
      );
    }
  );


  readonly igv =
    computed(
      () =>
        this.redondear(
          this.subtotal() *
          0.18
        )
    );


  readonly total =
    computed(
      () =>
        this.redondear(
          this.subtotal() +
          this.igv()
        )
    );


  readonly cantidadProductos =
    computed(
      () =>
        this.carrito()
          ?.detalles
          .length
        ?? 0
    );


  ngOnInit(): void {

    this.cargarCarrito();
  }


  cargarCarrito(): void {

    this.cargando.set(
      true
    );


    this.error.set(
      null
    );


    this.carritoService
      .obtener()
      .subscribe({

        next: respuesta => {

          this.carrito.set(
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


  cambiarCantidad(
    item: CarritoItem,
    valor: string
  ): void {

    if (
      this.procesando()
    ) {

      return;
    }


    this.limpiarMensajes();


    const cantidad =
      Number(valor);


    if (
      !Number.isFinite(cantidad) ||
      cantidad <= 0
    ) {

      this.error.set(
        'La cantidad debe ser mayor que cero.'
      );

      return;
    }


    if (
  item.unidad_medida !==
    'METRO' &&

  !Number.isInteger(
    cantidad
  )
) {

  this.error.set(
    'Solo los productos vendidos por metro permiten cantidades fraccionarias.'
  );

  return;
}


    if (
  cantidad >
  Number(
    item.stock_disponible
  )
) {

  this.error.set(
    `Solo existen ${item.stock_disponible} disponibles.`
  );

  return;
}


    this.procesando.set(
      true
    );


    this.carritoService
      .actualizarCantidad(
        item.producto_id,
        cantidad
      )
      .subscribe({

        next: respuesta => {

          this.procesando.set(
            false
          );


          this.mensaje.set(
            respuesta.message ??
            'Cantidad actualizada.'
          );


          this.cargarCarrito();
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


          /*
           * Recuperamos el valor real
           * del backend.
           */
          this.cargarCarrito();
        }
      });
  }


eliminar(
  item: CarritoItem
): void {

  if (
    this.procesando()
  ) {

    return;
  }


  if (
    !window.confirm(
      `¿Deseas quitar "${item.nombre}" del carrito?`
    )
  ) {

    return;
  }


  this.limpiarMensajes();


  this.procesando.set(
    true
  );


  this.carritoService
    .eliminarProducto(
      item.producto_id
    )
    .subscribe({

      next: respuesta => {

        this.procesando.set(
          false
        );


        this.mensaje.set(
          respuesta.message ??
          'Producto eliminado del carrito.'
        );


        this.cargarCarrito();
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


  confirmarCompra(): void {

    if (
      this.procesando()
    ) {

      return;
    }


    const carrito =
      this.carrito();


    if (
      !carrito ||
      carrito.detalles.length === 0
    ) {

      this.error.set(
        'El carrito está vacío.'
      );

      return;
    }


    if (
      !window.confirm(
        `¿Confirmar la compra por S/ ${this.total().toFixed(2)}?`
      )
    ) {

      return;
    }


    this.limpiarMensajes();


    this.procesando.set(
      true
    );


    this.ventaWebService
      .confirmarCompra()
      .subscribe({

        next: respuesta => {

          this.procesando.set(
            false
          );


          /*
           * La venta ya existe.
           * Mandamos al cliente al pago.
           */

          this.router.navigate(
            [
              '/cliente/pago',
              respuesta.data.id_venta
            ]
          );
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


          /*
           * Si stock/precios cambiaron,
           * refrescamos el carrito.
           */

          this.cargarCarrito();
        }
      });
  }


  volverCatalogo(): void {

    this.router.navigateByUrl(
      '/catalogo'
    );
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

        return 'La sesión ha expirado. Inicia sesión nuevamente.';
      }


      if (
        error.status === 403
      ) {

        return 'Esta operación solo está disponible para clientes.';
      }


      const mensaje =
        error.error?.message;


      if (
        mensaje ===
        'STOCK_INSUFICIENTE'
      ) {

        return 'Uno de los productos ya no tiene stock suficiente.';
      }


      if (
        mensaje ===
        'CARRITO_VACIO'
      ) {

        return 'El carrito está vacío.';
      }


      if (
        mensaje ===
        'PRODUCTO_NO_DISPONIBLE'
      ) {

        return 'Uno de los productos ya no se encuentra disponible.';
      }


      return (
        mensaje ??
        'No se pudo completar la operación.'
      );
    }


    return 'No se pudo completar la operación.';
  }
}