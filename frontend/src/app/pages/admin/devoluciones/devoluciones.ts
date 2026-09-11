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
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  AuthService
} from '../../../core/services/auth.service';

import {
  DevolucionService
} from '../../../core/services/devolucion.service';

import {
  DevolucionDetalle,
  DevolucionResumen,
  ProductoDevolvible,
  VentaEntregadaResumen
} from '../../../models/devolucion.model';


@Component({
  selector:
    'app-devoluciones',

  imports: [
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe
  ],

  templateUrl:
    './devoluciones.html',

  styleUrl:
    './devoluciones.css'
})
export class Devoluciones
  implements OnInit {

  readonly authService =
    inject(AuthService);


  private readonly devolucionService =
    inject(DevolucionService);


  private readonly fb =
    inject(
      NonNullableFormBuilder
    );


  readonly devoluciones =
    signal<DevolucionResumen[]>(
      []
    );


  readonly ventas =
    signal<VentaEntregadaResumen[]>(
      []
    );


  readonly productos =
    signal<ProductoDevolvible[]>(
      []
    );


  readonly cantidades =
    signal<Record<number, number>>(
      {}
    );


  readonly detalle =
    signal<DevolucionDetalle | null>(
      null
    );


  readonly cargando =
    signal(true);


  readonly cargandoProductos =
    signal(false);


  readonly cargandoDetalle =
    signal(false);


  readonly guardando =
    signal(false);


  readonly mostrarFormulario =
    signal(false);


  readonly error =
    signal<string | null>(
      null
    );


  readonly mensaje =
    signal<string | null>(
      null
    );


  readonly busqueda =
    signal('');


  readonly form =
    this.fb.group({

      venta_id: [
        0,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      motivo: [
        '',
        [
          Validators.required,
          Validators.maxLength(500)
        ]
      ]
    });


  readonly productosSeleccionados =
    computed(
      () => {

        const cantidades =
          this.cantidades();


        return this.productos()
          .filter(
            producto =>
              (
                cantidades[
                  producto.id_detalle_venta
                ]
                ?? 0
              ) > 0
          );
      }
    );


  readonly subtotal =
    computed(
      () => {

        const cantidades =
          this.cantidades();


        const total =
          this.productos()
            .reduce(
              (
                acumulado,
                producto
              ) => {

                const cantidad =
                  Number(
                    cantidades[
                      producto.id_detalle_venta
                    ]
                    ?? 0
                  );


                return (
                  acumulado +
                  Number(
                    producto.precio_unitario
                  ) *
                  cantidad
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


    let devolucionesListas =
      false;


    let ventasListas =
      false;


    const finalizar = () => {

      if (
        devolucionesListas &&
        ventasListas
      ) {

        this.cargando.set(
          false
        );
      }
    };


    this.devolucionService
      .listar()
      .subscribe({

        next: respuesta => {

          this.devoluciones.set(
            respuesta.data
          );


          devolucionesListas =
            true;


          finalizar();
        },


        error: error => {

          devolucionesListas =
            true;


          this.error.set(
            this.obtenerMensajeError(
              error
            )
          );


          finalizar();
        }
      });


    this.devolucionService
      .listarVentasEntregadas()
      .subscribe({

        next: respuesta => {

          this.ventas.set(
            respuesta.data
          );


          ventasListas =
            true;


          finalizar();
        },


        error: error => {

          ventasListas =
            true;


          this.error.set(
            this.obtenerMensajeError(
              error
            )
          );


          finalizar();
        }
      });
  }


  nuevaDevolucion(): void {

    if (
      !this.authService
        .esAdmin()
    ) {

      return;
    }


    this.limpiarMensajes();


    this.detalle.set(
      null
    );


    this.productos.set(
      []
    );


    this.cantidades.set(
      {}
    );


    this.form.reset({

      venta_id:
        0,

      motivo:
        ''
    });


    this.mostrarFormulario.set(
      true
    );
  }


  cancelarFormulario(): void {

    this.mostrarFormulario.set(
      false
    );


    this.productos.set(
      []
    );


    this.cantidades.set(
      {}
    );
  }


  cargarProductosVenta(): void {

    this.limpiarMensajes();


    const ventaId =
      Number(
        this.form.controls
          .venta_id.value
      );


    this.productos.set(
      []
    );


    this.cantidades.set(
      {}
    );


    if (
      !Number.isInteger(
        ventaId
      ) ||

      ventaId <= 0
    ) {

      return;
    }


    this.cargandoProductos.set(
      true
    );


    this.devolucionService
      .productosDevolvibles(
        ventaId
      )
      .subscribe({

        next: respuesta => {

          this.productos.set(
            respuesta.data
          );


          this.cargandoProductos.set(
            false
          );


          if (
            respuesta.data.length ===
            0
          ) {

            this.error.set(
              'Esta venta no tiene productos disponibles para devolución.'
            );
          }
        },


        error: error => {

          this.cargandoProductos.set(
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


  cantidadSeleccionada(
    detalleVentaId: number
  ): number {

    return (
      this.cantidades()[
        detalleVentaId
      ]
      ?? 0
    );
  }


  cambiarCantidad(
    producto: ProductoDevolvible,
    valor: string
  ): void {

    this.error.set(
      null
    );


    if (
      valor.trim() === ''
    ) {

      this.cantidades.update(
        cantidades => {

          const copia = {
            ...cantidades
          };


          delete copia[
            producto.id_detalle_venta
          ];


          return copia;
        }
      );


      return;
    }


    const cantidad =
      Number(valor);


    if (
      !Number.isFinite(
        cantidad
      ) ||

      cantidad < 0
    ) {

      this.error.set(
        'Ingresa una cantidad válida.'
      );

      return;
    }


    if (
      cantidad === 0
    ) {

      this.cantidades.update(
        cantidades => {

          const copia = {
            ...cantidades
          };


          delete copia[
            producto.id_detalle_venta
          ];


          return copia;
        }
      );


      return;
    }


    if (
      producto.unidad_medida !==
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


    const disponible =
      Number(
        producto
          .cantidad_disponible_devolucion
      );


    if (
      cantidad >
      disponible
    ) {

      this.error.set(
        `Solo puedes devolver ${disponible} de "${producto.producto_nombre}".`
      );

      return;
    }


    this.cantidades.update(
      cantidades => ({

        ...cantidades,

        [producto.id_detalle_venta]:
          cantidad
      })
    );
  }


  registrar(): void {

    if (
      !this.authService
        .esAdmin() ||

      this.guardando()
    ) {

      return;
    }


    this.limpiarMensajes();


    if (
      this.form.invalid
    ) {

      this.form
        .markAllAsTouched();

      return;
    }


    if (
      this.productosSeleccionados()
        .length === 0
    ) {

      this.error.set(
        'Indica al menos un producto para devolver.'
      );

      return;
    }


    const valores =
      this.form
        .getRawValue();


    const motivo =
      valores.motivo
        .trim();


    if (!motivo) {

      this.error.set(
        'El motivo de devolución es obligatorio.'
      );

      return;
    }


    if (
      !window.confirm(
        `¿Registrar la devolución por S/ ${this.total().toFixed(2)}?`
      )
    ) {

      return;
    }


    this.guardando.set(
      true
    );


    const cantidades =
      this.cantidades();


    this.devolucionService
      .crear({

        venta_id:
          Number(
            valores.venta_id
          ),

        motivo,

        productos:
          this.productosSeleccionados()
            .map(
              producto => ({

                detalle_venta_id:
                  producto.id_detalle_venta,

                cantidad:
                  Number(
                    cantidades[
                      producto.id_detalle_venta
                    ]
                  )
              })
            )

      })
      .subscribe({

        next: respuesta => {

          this.guardando.set(
            false
          );


          this.mostrarFormulario.set(
            false
          );


          this.productos.set(
            []
          );


          this.cantidades.set(
            {}
          );


          this.detalle.set(
            respuesta.data
          );


          this.mensaje.set(
            respuesta.message ??
            'Devolución registrada correctamente.'
          );


          this.recargarListados();
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


  buscarVentas(): void {

    this.devolucionService
      .listarVentasEntregadas(
        this.busqueda()
      )
      .subscribe({

        next: respuesta => {

          this.ventas.set(
            respuesta.data
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


  cambiarBusqueda(
    valor: string
  ): void {

    this.busqueda.set(
      valor
    );
  }


  verDetalle(
    devolucion: DevolucionResumen
  ): void {

    this.limpiarMensajes();


    this.mostrarFormulario.set(
      false
    );


    this.cargandoDetalle.set(
      true
    );


    this.detalle.set(
      null
    );


    this.devolucionService
      .obtenerPorId(
        devolucion.id_devolucion
      )
      .subscribe({

        next: respuesta => {

          this.detalle.set(
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

    this.detalle.set(
      null
    );
  }


  private recargarListados(): void {

    this.devolucionService
      .listar()
      .subscribe({

        next: respuesta => {

          this.devoluciones.set(
            respuesta.data
          );
        }
      });


    this.devolucionService
      .listarVentasEntregadas()
      .subscribe({

        next: respuesta => {

          this.ventas.set(
            respuesta.data
          );
        }
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

        return 'No tienes permisos para registrar devoluciones.';
      }


      const codigo =
        String(
          error.error?.message
          ?? ''
        );


      const mensajes:
        Record<string, string> = {

        ID_VENTA_INVALIDO:
          'La venta seleccionada no es válida.',

        VENTA_NO_ENCONTRADA:
          'La venta no existe.',

        VENTA_NO_ENTREGADA:
          'Solo se pueden devolver productos de una venta entregada.',

        MOTIVO_REQUERIDO:
          'El motivo de devolución es obligatorio.',

        DEVOLUCION_SIN_PRODUCTOS:
          'Selecciona al menos un producto.',

        DETALLE_VENTA_NO_ENCONTRADO:
          'Uno de los productos no pertenece a la venta.',

        CANTIDAD_INVALIDA:
          'Una de las cantidades no es válida.',

        CANTIDAD_FRACCIONARIA_INVALIDA:
          'Solo los productos vendidos por metro permiten cantidades fraccionarias.',

        CANTIDAD_DEVOLUCION_EXCEDIDA:
          'La cantidad supera lo disponible para devolución.'
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