import {
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';

import {
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
  ClienteService
} from '../../../core/services/cliente.service';

import {
  ProductoService
} from '../../../core/services/producto.service';

import {
  VentaTiendaService
} from '../../../core/services/venta-tienda.service';

import {
  Cliente
} from '../../../models/cliente.model';

import {
  Producto
} from '../../../models/producto.model';

import {
  MetodoPago,
  TipoComprobante,
  VentaTiendaResultado
} from '../../../models/venta-tienda.model';


interface ItemVenta {

  producto:
    Producto;

  cantidad:
    number;

  subtotal:
    number;
}


@Component({
  selector:
    'app-venta-tienda',

  imports: [
    ReactiveFormsModule,
    DecimalPipe
  ],

  templateUrl:
    './venta-tienda.html',

  styleUrl:
    './venta-tienda.css'
})
export class VentaTienda
  implements OnInit {

  /*
  |--------------------------------------------------------------------------
  | Referencia al input del lector
  |--------------------------------------------------------------------------
  */

  @ViewChild(
    'codigoBarrasInput'
  )
  codigoBarrasInput?:
    ElementRef<HTMLInputElement>;


  /*
  |--------------------------------------------------------------------------
  | Servicios
  |--------------------------------------------------------------------------
  */

  private readonly clienteService =
    inject(
      ClienteService
    );


  private readonly productoService =
    inject(
      ProductoService
    );


  private readonly ventaTiendaService =
    inject(
      VentaTiendaService
    );


  private readonly fb =
    inject(
      NonNullableFormBuilder
    );


  /*
  |--------------------------------------------------------------------------
  | Código de barras
  |--------------------------------------------------------------------------
  */

  readonly codigoEscaneado =
    signal('');


  readonly escaneando =
    signal(false);


  /*
  |--------------------------------------------------------------------------
  | Datos
  |--------------------------------------------------------------------------
  */

  readonly clientes =
    signal<Cliente[]>(
      []
    );


  readonly productos =
    signal<Producto[]>(
      []
    );


  readonly items =
    signal<ItemVenta[]>(
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


  readonly ventaResultado =
    signal<VentaTiendaResultado | null>(
      null
    );


  /*
  |--------------------------------------------------------------------------
  | Listas
  |--------------------------------------------------------------------------
  */

  readonly metodosPago:
    MetodoPago[] = [

      'EFECTIVO',
      'TARJETA',
      'YAPE',
      'PLIN',
      'TRANSFERENCIA'
    ];


  readonly tiposComprobante:
    TipoComprobante[] = [

      'BOLETA',
      'FACTURA',
      'NOTA_VENTA'
    ];


  /*
  |--------------------------------------------------------------------------
  | Datos filtrados
  |--------------------------------------------------------------------------
  */

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


  readonly productosDisponibles =
    computed(
      () =>
        this.productos()
          .filter(
            producto =>
              producto.estado ===
                'ACTIVO' &&

              Number(
                producto.stock_disponible
              ) > 0
          )
    );


  /*
  |--------------------------------------------------------------------------
  | Totales visuales
  |--------------------------------------------------------------------------
  */

  readonly subtotal =
    computed(
      () =>
        this.redondear(
          this.items()
            .reduce(
              (
                total,
                item
              ) =>
                total +
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


  /*
  |--------------------------------------------------------------------------
  | Formulario principal
  |--------------------------------------------------------------------------
  */

  readonly ventaForm =
    this.fb.group({

      cliente_id: [
        0
      ],

      metodo_pago: [
        'EFECTIVO' as MetodoPago,
        [
          Validators.required
        ]
      ],

      referencia_transaccion: [
        ''
      ],

      tipo_comprobante: [
        'BOLETA' as TipoComprobante,
        [
          Validators.required
        ]
      ]
    });


  /*
  |--------------------------------------------------------------------------
  | Agregar productos manualmente
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | Inicio
  |--------------------------------------------------------------------------
  */

  ngOnInit(): void {

    this.cargarDatos();
  }


  /*
  |--------------------------------------------------------------------------
  | Cargar productos y clientes
  |--------------------------------------------------------------------------
  */

  cargarDatos(): void {

    this.cargando.set(
      true
    );


    this.error.set(
      null
    );


    let productosListos =
      false;


    let clientesListos =
      false;


    const finalizar = () => {

      if (
        productosListos &&
        clientesListos
      ) {

        this.cargando.set(
          false
        );


        this.enfocarCodigoBarras();
      }
    };


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
  }


  /*
  |--------------------------------------------------------------------------
  | Producto actualmente seleccionado
  |--------------------------------------------------------------------------
  */

  productoSeleccionado():
    Producto | null {

    const id =
      Number(
        this.productoForm.controls
          .producto_id.value
      );


    return (
      this.productos()
        .find(
          producto =>
            Number(
              producto.id_producto
            ) === id
        )
      ??
      null
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Cliente actualmente seleccionado
  |--------------------------------------------------------------------------
  */

  clienteSeleccionado():
    Cliente | null {

    const id =
      Number(
        this.ventaForm.controls
          .cliente_id.value
      );


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      return null;
    }


    return (
      this.clientes()
        .find(
          cliente =>
            Number(
              cliente.id_cliente
            ) === id
        )
      ??
      null
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Escanear código de barras
  |--------------------------------------------------------------------------
  */

  escanearCodigo(
    codigo: string
  ): void {

    const valor =
      codigo.trim();


    if (
      !valor ||
      this.escaneando()
    ) {

      return;
    }


    this.limpiarMensajes();


    this.escaneando.set(
      true
    );


    this.productoService
      .obtenerPorCodigoBarras(
        valor
      )
      .subscribe({

        next: respuesta => {

          this.escaneando.set(
            false
          );


          const producto =
            respuesta.data;


          /*
           * El lector agrega una unidad
           * en cada escaneo.
           *
           * Para productos METRO,
           * inicialmente agrega 1 metro.
           */
          const agregado =
            this.agregarProductoAItems(
              producto,
              1
            );


          if (agregado) {

            this.codigoEscaneado.set(
              ''
            );


            /*
             * Sin mensaje de éxito para
             * evitar llenar la pantalla
             * al escanear muchos productos.
             */
            this.error.set(
              null
            );
          }


          this.enfocarCodigoBarras();
        },


        error: error => {

          this.escaneando.set(
            false
          );


          this.codigoEscaneado.set(
            ''
          );


          if (
            error instanceof
              HttpErrorResponse &&
            error.status === 404
          ) {

            this.error.set(
              `No existe un producto activo con el código de barras "${valor}".`
            );

          } else {

            this.error.set(
              'No se pudo consultar el código de barras.'
            );
          }


          this.enfocarCodigoBarras();
        }
      });
  }


  /*
  |--------------------------------------------------------------------------
  | Agregar producto manual
  |--------------------------------------------------------------------------
  */

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


    const agregado =
      this.agregarProductoAItems(
        producto,
        cantidad
      );


    if (!agregado) {

      return;
    }


    /*
     * Preparar otra selección.
     */

    this.productoForm.reset({

      producto_id:
        0,

      cantidad:
        1
    });


    this.enfocarCodigoBarras();
  }


  /*
  |--------------------------------------------------------------------------
  | Lógica común para agregar productos
  |--------------------------------------------------------------------------
  |
  | Se utiliza tanto para selección manual
  | como para código de barras.
  |--------------------------------------------------------------------------
  */

  private agregarProductoAItems(
    producto: Producto,
    cantidad: number
  ): boolean {

    /*
     * Validar cantidad.
     */

    if (
      !Number.isFinite(
        cantidad
      ) ||

      cantidad <= 0
    ) {

      this.error.set(
        'Ingresa una cantidad válida.'
      );

      return false;
    }


    /*
     * Solo METRO permite cantidades
     * fraccionarias.
     */

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

      return false;
    }


    /*
     * Verificar que exista stock.
     */

    const stockDisponible =
      Number(
        producto.stock_disponible
      );


    if (
      !Number.isFinite(
        stockDisponible
      ) ||

      stockDisponible <= 0
    ) {

      this.error.set(
        `El producto "${producto.nombre}" no tiene stock disponible.`
      );

      return false;
    }


    /*
     * Buscar si ya está agregado.
     */

    const existente =
      this.items()
        .find(
          item =>
            item.producto
              .id_producto ===
            producto.id_producto
        );


    const cantidadActual =
      existente
        ? existente.cantidad
        : 0;


    const cantidadNueva =
      this.redondear(
        cantidadActual +
        cantidad
      );


    /*
     * No superar stock.
     */

    if (
      cantidadNueva >
      stockDisponible
    ) {

      this.error.set(
        `Stock insuficiente para "${producto.nombre}". Disponible: ${stockDisponible}.`
      );

      return false;
    }


    /*
    |--------------------------------------------------------------------------
    | Producto ya agregado
    |--------------------------------------------------------------------------
    */

    if (existente) {

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

                /*
                 * También actualizamos
                 * los datos del producto
                 * con la respuesta más
                 * reciente del backend.
                 */
                producto,

                cantidad:
                  cantidadNueva,

                subtotal:
                  this.redondear(
                    Number(
                      producto.precio
                    ) *
                    cantidadNueva
                  )
              };
            }
          )
      );


      return true;
    }


    /*
    |--------------------------------------------------------------------------
    | Producto nuevo
    |--------------------------------------------------------------------------
    */

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


    return true;
  }


  /*
  |--------------------------------------------------------------------------
  | Eliminar item
  |--------------------------------------------------------------------------
  */

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


    this.enfocarCodigoBarras();
  }


  /*
  |--------------------------------------------------------------------------
  | Cambiar cantidad desde tabla
  |--------------------------------------------------------------------------
  */

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
      !Number.isFinite(
        cantidad
      ) ||

      cantidad <= 0
    ) {

      this.error.set(
        'Ingresa una cantidad válida.'
      );

      return;
    }


    /*
     * Solo METRO admite decimales.
     */

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


    /*
     * Verificar stock.
     */

    if (
      cantidad >
      Number(
        item.producto
          .stock_disponible
      )
    ) {

      this.error.set(
        `Stock insuficiente para "${item.producto.nombre}". Disponible: ${item.producto.stock_disponible}.`
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
                    actual.producto.precio
                  ) *
                  cantidad
                )
            };
          }
        )
    );


    this.enfocarCodigoBarras();
  }


  /*
  |--------------------------------------------------------------------------
  | Método de pago
  |--------------------------------------------------------------------------
  */

  requiereReferencia():
    boolean {

    return (
      this.ventaForm.controls
        .metodo_pago.value !==
      'EFECTIVO'
    );
  }


  cambiarMetodoPago(): void {

    if (
      !this.requiereReferencia()
    ) {

      this.ventaForm.controls
        .referencia_transaccion
        .setValue('');
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Comprobante
  |--------------------------------------------------------------------------
  */

  cambiarComprobante(): void {

    if (
      this.ventaForm.controls
        .tipo_comprobante.value !==
      'FACTURA'
    ) {

      return;
    }


    const cliente =
      this.clienteSeleccionado();


    if (!cliente) {

      this.error.set(
        'Para emitir FACTURA debes seleccionar un cliente empresa con RUC.'
      );

      return;
    }


    if (
      cliente.tipo_cliente !==
        'EMPRESA' ||

      cliente.tipo_documento !==
        'RUC' ||

      !cliente.numero_documento ||

      !cliente.razon_social
    ) {

      this.error.set(
        'El cliente seleccionado no cumple los requisitos para FACTURA.'
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Registrar venta
  |--------------------------------------------------------------------------
  */

  registrarVenta(): void {

    if (
      this.procesando()
    ) {

      return;
    }


    this.limpiarMensajes();


    if (
      this.items().length === 0
    ) {

      this.error.set(
        'Agrega al menos un producto a la venta.'
      );

      return;
    }


    const cliente =
      this.clienteSeleccionado();


    const metodoPago =
      this.ventaForm.controls
        .metodo_pago.value;


    const referencia =
      this.ventaForm.controls
        .referencia_transaccion.value
        .trim();


    const tipoComprobante =
      this.ventaForm.controls
        .tipo_comprobante.value;


    /*
    |--------------------------------------------------------------------------
    | Referencia electrónica
    |--------------------------------------------------------------------------
    */

    if (
      metodoPago !==
        'EFECTIVO' &&

      !referencia
    ) {

      this.error.set(
        'Ingresa la referencia o número de operación del pago.'
      );

      return;
    }


    /*
    |--------------------------------------------------------------------------
    | FACTURA
    |--------------------------------------------------------------------------
    */

    if (
      tipoComprobante ===
      'FACTURA'
    ) {

      if (!cliente) {

        this.error.set(
          'Para emitir FACTURA debes seleccionar un cliente.'
        );

        return;
      }


      if (
        cliente.tipo_cliente !==
          'EMPRESA' ||

        cliente.tipo_documento !==
          'RUC' ||

        !cliente.numero_documento ||

        !cliente.razon_social
      ) {

        this.error.set(
          'Para emitir FACTURA el cliente debe ser una empresa con RUC y razón social.'
        );

        return;
      }
    }


    /*
    |--------------------------------------------------------------------------
    | DTO
    |--------------------------------------------------------------------------
    */

    const datos = {

      cliente_id:
        cliente?.id_cliente
        ?? null,

      metodo_pago:
        metodoPago,

      referencia_transaccion:
        metodoPago ===
          'EFECTIVO'

          ? null

          : referencia,

      tipo_comprobante:
        tipoComprobante,

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


    this.procesando.set(
      true
    );


    this.ventaTiendaService
      .registrar(
        datos
      )
      .subscribe({

        next: respuesta => {

          this.procesando.set(
            false
          );


          this.ventaResultado.set(
            respuesta.data
          );


          this.mensaje.set(
            respuesta.message
            ??
            'Venta registrada correctamente.'
          );


          /*
           * Actualizar stock.
           */

          this.recargarProductos();


          /*
           * Limpiar venta.
           */

          this.items.set(
            []
          );


          this.codigoEscaneado.set(
            ''
          );


          this.ventaForm.reset({

            cliente_id:
              0,

            metodo_pago:
              'EFECTIVO',

            referencia_transaccion:
              '',

            tipo_comprobante:
              'BOLETA'
          });


          this.productoForm.reset({

            producto_id:
              0,

            cantidad:
              1
          });
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


          this.enfocarCodigoBarras();
        }
      });
  }


  /*
  |--------------------------------------------------------------------------
  | Nueva venta
  |--------------------------------------------------------------------------
  */

  nuevaVenta(): void {

    this.ventaResultado.set(
      null
    );


    this.mensaje.set(
      null
    );


    this.error.set(
      null
    );


    this.codigoEscaneado.set(
      ''
    );


    this.enfocarCodigoBarras();
  }


  /*
  |--------------------------------------------------------------------------
  | Recargar productos
  |--------------------------------------------------------------------------
  */

  private recargarProductos():
    void {

    this.productoService
      .listar()
      .subscribe({

        next: respuesta => {

          this.productos.set(
            respuesta.data
          );
        },


        error: error => {

          console.error(
            'No se pudo actualizar el stock:',
            error
          );
        }
      });
  }


  /*
  |--------------------------------------------------------------------------
  | Nombre del cliente
  |--------------------------------------------------------------------------
  */

  nombreCliente(
    cliente: Cliente
  ): string {

    if (
      cliente.tipo_cliente ===
      'EMPRESA'
    ) {

      return (
        cliente.razon_social
        ??
        'Empresa'
      );
    }


    return [

      cliente.nombres,
      cliente.apellidos

    ]
      .filter(
        Boolean
      )
      .join(' ')
      .trim();
  }


  /*
  |--------------------------------------------------------------------------
  | Volver a enfocar lector
  |--------------------------------------------------------------------------
  */

  private enfocarCodigoBarras():
    void {

    setTimeout(
      () => {

        this.codigoBarrasInput
          ?.nativeElement
          .focus();

      },
      0
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

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

        return (
          'La sesión ha expirado o no es válida.'
        );
      }


      if (
        error.status === 403
      ) {

        return (
          'No tienes permisos para registrar ventas.'
        );
      }


      const mensaje =
        error.error?.message;


      if (
        mensaje ===
        'CAJA_NO_ABIERTA'
      ) {

        return (
          'Debes abrir tu caja antes de registrar una venta presencial.'
        );
      }


      if (
        mensaje ===
        'FACTURA_REQUIERE_RUC'
      ) {

        return (
          'Para emitir factura debes seleccionar una empresa con RUC y razón social.'
        );
      }


      if (
        mensaje ===
        'STOCK_INSUFICIENTE'
      ) {

        return (
          'El stock disponible cambió y ya no es suficiente. Actualiza los productos e intenta nuevamente.'
        );
      }


      return (
        mensaje
        ??
        'No se pudo registrar la venta.'
      );
    }


    return (
      'No se pudo registrar la venta.'
    );
  }
}