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
  ClienteService
} from '../../../core/services/cliente.service';

import {
  ProductoService
} from '../../../core/services/producto.service';

import {
  ProformaService
} from '../../../core/services/proforma.service';

import {
  Cliente
} from '../../../models/cliente.model';

import {
  Producto
} from '../../../models/producto.model';

import {
  CrearProformaDto,
  ProformaDetalle,
  ProformaResumen
} from '../../../models/proforma.model';


interface ItemProforma {

  producto:
    Producto;

  cantidad:
    number;

  subtotal:
    number;
}


@Component({
  selector:
    'app-proformas',

  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    DatePipe
  ],

  templateUrl:
    './proformas.html',

  styleUrl:
    './proformas.css'
})
export class Proformas
  implements OnInit {

  readonly authService =
    inject(AuthService);


  private readonly clienteService =
    inject(ClienteService);


  private readonly productoService =
    inject(ProductoService);


  private readonly proformaService =
    inject(ProformaService);


  private readonly fb =
    inject(
      NonNullableFormBuilder
    );


  readonly proformas =
    signal<ProformaResumen[]>(
      []
    );


  readonly clientes =
    signal<Cliente[]>(
      []
    );


  readonly productos =
    signal<Producto[]>(
      []
    );


  readonly items =
    signal<ItemProforma[]>(
      []
    );


  readonly detalle =
    signal<ProformaDetalle | null>(
      null
    );


  readonly cargando =
    signal(true);


  readonly guardando =
    signal(false);


  readonly cargandoDetalle =
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


  readonly clientesActivos =
    computed(
      () =>
        this.clientes()
          .filter(
            cliente =>
              cliente.estado ===
              'ACTIVO'
          )
    );


  readonly productosActivos =
    computed(
      () =>
        this.productos()
          .filter(
            producto =>
              producto.estado ===
              'ACTIVO'
          )
    );


  readonly proformasFiltradas =
    computed(
      () => {

        const texto =
          this.busqueda()
            .trim()
            .toLowerCase();


        if (!texto) {

          return this.proformas();
        }


        return this.proformas()
          .filter(
            proforma => {

              const contenido = [

                proforma.codigo_proforma,

                proforma.cliente_nombre,

                proforma.usuario_nombre,

                proforma.estado

              ]
                .join(' ')
                .toLowerCase();


              return contenido
                .includes(texto);
            }
          );
      }
    );


  readonly subtotal =
    computed(
      () =>
        this.redondear(
          this.items()
            .reduce(
              (
                acumulado,
                item
              ) =>
                acumulado +
                item.subtotal,

              0
            )
        )
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


  readonly form =
    this.fb.group({

      cliente_id: [
        0,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      fecha_vencimiento: [
        this.fechaVencimientoInicial(),
        [
          Validators.required
        ]
      ],

      observacion: [
        '',
        [
          Validators.maxLength(500)
        ]
      ]
    });


  readonly productoForm =
    this.fb.group({

      producto_id: [
        0,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      cantidad: [
        1,
        [
          Validators.required,
          Validators.min(0.01)
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


    let proformasListas =
      false;

    let clientesListos =
      false;

    let productosListos =
      false;


    const finalizar = () => {

      if (
        proformasListas &&
        clientesListos &&
        productosListos
      ) {

        this.cargando.set(
          false
        );
      }
    };


    this.proformaService
      .listar()
      .subscribe({

        next: respuesta => {

          this.proformas.set(
            respuesta.data
          );


          proformasListas =
            true;


          finalizar();
        },


        error: error => {

          proformasListas =
            true;


          this.error.set(
            this.obtenerMensajeError(
              error
            )
          );


          finalizar();
        }
      });


    this.clienteService
      .listar()
      .subscribe({

        next: respuesta => {

          this.clientes.set(
            respuesta.data
          );


          clientesListos =
            true;


          finalizar();
        },


        error: error => {

          clientesListos =
            true;


          this.error.set(
            this.obtenerMensajeError(
              error
            )
          );


          finalizar();
        }
      });


    this.productoService
      .listar()
      .subscribe({

        next: respuesta => {

          this.productos.set(
            respuesta.data
          );


          productosListos =
            true;


          finalizar();
        },


        error: error => {

          productosListos =
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


  nuevaProforma(): void {

    this.limpiarMensajes();


    this.detalle.set(
      null
    );


    this.items.set(
      []
    );


    this.form.reset({

      cliente_id:
        0,

      fecha_vencimiento:
        this.fechaVencimientoInicial(),

      observacion:
        ''
    });


    this.productoForm.reset({

      producto_id:
        0,

      cantidad:
        1
    });


    this.mostrarFormulario.set(
      true
    );
  }


  cancelarFormulario(): void {

    this.mostrarFormulario.set(
      false
    );


    this.items.set(
      []
    );
  }


  productoSeleccionado():
    Producto | null {

    const productoId =
      Number(
        this.productoForm.controls
          .producto_id.value
      );


    if (
      !Number.isInteger(
        productoId
      ) ||

      productoId <= 0
    ) {

      return null;
    }


    return (
      this.productos()
        .find(
          producto =>
            Number(
              producto.id_producto
            ) ===
            productoId
        )
      ??
      null
    );
  }


  agregarProducto(): void {

    this.limpiarMensajes();


    const producto =
      this.productoSeleccionado();


    const cantidad =
      Number(
        this.productoForm.controls
          .cantidad.value
      );


    if (!producto) {

      this.error.set(
        'Selecciona un producto.'
      );

      return;
    }


    if (
      !Number.isFinite(cantidad) ||
      cantidad <= 0
    ) {

      this.error.set(
        'Ingresa una cantidad válida.'
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


    const existente =
      this.items()
        .find(
          item =>
            item.producto
              .id_producto ===
            producto.id_producto
        );


    if (existente) {

      const nuevaCantidad =
        this.redondear(
          existente.cantidad +
          cantidad
        );


      this.items.update(
        items =>
          items.map(
            item => {

              if (
                item.producto
                  .id_producto !==
                producto.id_producto
              ) {

                return item;
              }


              return {

                ...item,

                cantidad:
                  nuevaCantidad,

                subtotal:
                  this.redondear(
                    Number(
                      producto.precio
                    ) *
                    nuevaCantidad
                  )
              };
            }
          )
      );

    } else {

      this.items.update(
        items => [

          ...items,

          {

            producto,

            cantidad,

            subtotal:
              this.redondear(
                Number(
                  producto.precio
                ) *
                cantidad
              )
          }
        ]
      );
    }


    this.productoForm.reset({

      producto_id:
        0,

      cantidad:
        1
    });
  }


  cambiarCantidad(
    productoId: number,
    valor: string
  ): void {

    const cantidad =
      Number(valor);


    const item =
      this.items()
        .find(
          item =>
            item.producto
              .id_producto ===
            productoId
        );


    if (!item) {

      return;
    }


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
      item.producto
        .unidad_medida !==
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


    this.error.set(
      null
    );


    this.items.update(
      items =>
        items.map(
          actual => {

            if (
              actual.producto
                .id_producto !==
              productoId
            ) {

              return actual;
            }


            return {

              ...actual,

              cantidad,

              subtotal:
                this.redondear(
                  Number(
                    actual.producto
                      .precio
                  ) *
                  cantidad
                )
            };
          }
        )
    );
  }


  quitarProducto(
    productoId: number
  ): void {

    this.items.update(
      items =>
        items.filter(
          item =>
            item.producto
              .id_producto !==
            productoId
        )
    );
  }


  crearProforma(): void {

    if (
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
      this.items().length === 0
    ) {

      this.error.set(
        'Agrega al menos un producto.'
      );

      return;
    }


    const valores =
      this.form
        .getRawValue();


    const clienteId =
      Number(
        valores.cliente_id
      );


    if (
      !Number.isInteger(
        clienteId
      ) ||

      clienteId <= 0
    ) {

      this.error.set(
        'Selecciona un cliente.'
      );

      return;
    }


    const datos:
      CrearProformaDto = {

      cliente_id:
        clienteId,

      fecha_vencimiento:
        valores.fecha_vencimiento,

      observacion:
        valores.observacion
          .trim()
        || null,

      productos:
        this.items()
          .map(
            item => ({

              producto_id:
                item.producto
                  .id_producto,

              cantidad:
                item.cantidad
            })
          )
    };


    this.guardando.set(
      true
    );


    this.proformaService
      .crear(datos)
      .subscribe({

        next: respuesta => {

          this.guardando.set(
            false
          );


          this.mostrarFormulario.set(
            false
          );


          this.items.set(
            []
          );


          this.mensaje.set(
            respuesta.message ??
            'Proforma creada correctamente.'
          );


          this.detalle.set(
            respuesta.data
          );


          this.cargarProformas();
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


  cargarProformas(): void {

    this.proformaService
      .listar()
      .subscribe({

        next: respuesta => {

          this.proformas.set(
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


  verDetalle(
    proforma: ProformaResumen
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


    this.proformaService
      .obtenerPorId(
        proforma.id_proforma
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


  anular(
    proforma: ProformaDetalle
  ): void {

    if (
      !this.authService
        .esAdmin()
    ) {

      return;
    }


    const motivo =
      window.prompt(
        `Motivo de anulación de ${proforma.codigo_proforma}:`
      );


    if (
      motivo === null
    ) {

      return;
    }


    const motivoLimpio =
      motivo.trim();


    if (!motivoLimpio) {

      this.error.set(
        'El motivo de anulación es obligatorio.'
      );

      return;
    }


    if (
      !window.confirm(
        `¿Confirmas la anulación de ${proforma.codigo_proforma}?`
      )
    ) {

      return;
    }


    this.guardando.set(
      true
    );


    this.limpiarMensajes();


    this.proformaService
      .anular(
        proforma.id_proforma,
        motivoLimpio
      )
      .subscribe({

        next: respuesta => {

          this.guardando.set(
            false
          );


          this.detalle.set(
            respuesta.data
          );


          this.mensaje.set(
            respuesta.message ??
            'Proforma anulada correctamente.'
          );


          this.cargarProformas();
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


  nombreCliente(
    cliente: Cliente
  ): string {

    if (
      cliente.tipo_cliente ===
      'EMPRESA'
    ) {

      return (
        cliente.razon_social ??
        'Empresa'
      );
    }


    return [

      cliente.nombres,
      cliente.apellidos

    ]
      .filter(Boolean)
      .join(' ')
      .trim();
  }


  nombreClienteDetalle(
    proforma: ProformaDetalle
  ): string {

    if (
      proforma.tipo_cliente ===
      'EMPRESA'
    ) {

      return (
        proforma.razon_social ??
        'Empresa'
      );
    }


    return [

      proforma.nombres,
      proforma.apellidos

    ]
      .filter(Boolean)
      .join(' ')
      .trim();
  }


  cambiarBusqueda(
    valor: string
  ): void {

    this.busqueda.set(
      valor
    );
  }


  claseEstado(
    estado: string
  ): string {

    switch (estado) {

      case 'VIGENTE':
        return 'text-bg-success';

      case 'VENCIDA':
        return 'text-bg-warning';

      case 'ANULADA':
        return 'text-bg-secondary';

      default:
        return 'text-bg-light';
    }
  }


  fechaHoy():
    string {

    const fecha =
      new Date();


    return this.formatearFecha(
      fecha
    );
  }


  private fechaVencimientoInicial():
    string {

    const fecha =
      new Date();


    fecha.setDate(
      fecha.getDate() +
      15
    );


    return this.formatearFecha(
      fecha
    );
  }


  private formatearFecha(
    fecha: Date
  ): string {

    const year =
      fecha.getFullYear();


    const month =
      String(
        fecha.getMonth() + 1
      )
        .padStart(
          2,
          '0'
        );


    const day =
      String(
        fecha.getDate()
      )
        .padStart(
          2,
          '0'
        );


    return (
      `${year}-${month}-${day}`
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

        return 'La sesión ha expirado.';
      }


      if (
        error.status === 403
      ) {

        return 'No tienes permisos para realizar esta operación.';
      }


      const mensaje =
        String(
          error.error?.message ??
          ''
        );


      const errores:
        Record<string, string> = {

        CLIENTE_INVALIDO:
          'Selecciona un cliente válido.',

        CLIENTE_NO_ENCONTRADO:
          'El cliente no existe o está inactivo.',

        FECHA_VENCIMIENTO_INVALIDA:
          'La fecha de vencimiento no es válida.',

        PROFORMA_SIN_PRODUCTOS:
          'Agrega al menos un producto.',

        PRODUCTO_INVALIDO:
          'Uno de los productos no es válido.',

        PRODUCTO_NO_ENCONTRADO:
          'Uno de los productos ya no está disponible.',

        PRODUCTO_DUPLICADO:
          'No se puede repetir un producto en la proforma.',

        CANTIDAD_INVALIDA:
          'Una de las cantidades no es válida.',

        CANTIDAD_FRACCIONARIA_INVALIDA:
          'Solo los productos vendidos por metro permiten cantidades fraccionarias.',

        PROFORMA_NO_ENCONTRADA:
          'La proforma no existe.',

        PROFORMA_YA_ANULADA:
          'La proforma ya se encuentra anulada.',

        MOTIVO_ANULACION_REQUERIDO:
          'El motivo de anulación es obligatorio.'
      };


      return (
        errores[mensaje]
        ??
        mensaje
        ??
        'No se pudo completar la operación.'
      );
    }


    return 'No se pudo completar la operación.';
  }
}