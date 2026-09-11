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
  InventarioService
} from '../../../core/services/inventario.service';

import {
  ProductoService
} from '../../../core/services/producto.service';

import {
  MovimientoStock
} from '../../../models/inventario.model';

import {
  Producto
} from '../../../models/producto.model';


type TipoOperacionInventario =
  | 'ENTRADA'
  | 'AJUSTE';


@Component({
  selector:
    'app-inventario',

  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    DatePipe
  ],

  templateUrl:
    './inventario.html',

  styleUrl:
    './inventario.css'
})
export class Inventario
  implements OnInit {

  private readonly inventarioService =
    inject(
      InventarioService
    );


  private readonly productoService =
    inject(
      ProductoService
    );


  private readonly fb =
    inject(
      NonNullableFormBuilder
    );


  /*
  |--------------------------------------------------------------------------
  | Datos
  |--------------------------------------------------------------------------
  */

  readonly productos =
    signal<Producto[]>(
      []
    );


  readonly movimientos =
    signal<MovimientoStock[]>(
      []
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


  readonly cargando =
    signal(true);


  readonly cargandoMovimientos =
    signal(false);


  readonly guardando =
    signal(false);


  readonly error =
    signal<string | null>(
      null
    );


  readonly mensaje =
    signal<string | null>(
      null
    );


  /*
  |--------------------------------------------------------------------------
  | Operación
  |--------------------------------------------------------------------------
  */

  readonly mostrarOperacion =
    signal(false);


  readonly tipoOperacion =
    signal<
      TipoOperacionInventario | null
    >(
      null
    );


  /*
  |--------------------------------------------------------------------------
  | Filtro
  |--------------------------------------------------------------------------
  */

  readonly productoFiltro =
    signal<number | null>(
      null
    );


  /*
  |--------------------------------------------------------------------------
  | Producto seleccionado
  |--------------------------------------------------------------------------
  */

  productoSeleccionado():
  Producto | null {

  const productoId =
    Number(
      this.form.controls
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
          ) === productoId
      )
    ??
    null
  );
}


stockFisicoSeleccionado():
  number {

  const producto =
    this.productoSeleccionado();


  if (!producto) {

    return 0;
  }


  return (
    Number(
      producto.stock_disponible
    ) +
    Number(
      producto.stock_reservado
    )
  );
}


  /*
  |--------------------------------------------------------------------------
  | Formulario
  |--------------------------------------------------------------------------
  */

  readonly form =
    this.fb.group({

      producto_id: [
        0,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      cantidad: [
        0,
        [
          Validators.min(0)
        ]
      ],

      nuevo_stock_fisico: [
        0,
        [
          Validators.min(0)
        ]
      ],

      motivo: [
        '',
        [
          Validators.required,
          Validators.maxLength(255)
        ]
      ]
    });


  ngOnInit(): void {

    this.cargarTodo();
  }


  /*
  |--------------------------------------------------------------------------
  | Carga inicial
  |--------------------------------------------------------------------------
  */

  cargarTodo(): void {

    this.cargando.set(
      true
    );


    this.error.set(
      null
    );


    this.productoService
      .listar()
      .subscribe({

        next: respuesta => {

          this.productos.set(
            respuesta.data
          );


          this.cargando.set(
            false
          );


          this.cargarMovimientos();
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
  | Historial
  |--------------------------------------------------------------------------
  */

  cargarMovimientos(): void {

    this.cargandoMovimientos.set(
      true
    );


    const productoId =
      this.productoFiltro()
      ?? undefined;


    this.inventarioService
      .listarMovimientos(
        productoId
      )
      .subscribe({

        next: respuesta => {

          this.movimientos.set(
            respuesta.data
          );


          this.cargandoMovimientos.set(
            false
          );
        },


        error: error => {

          this.cargandoMovimientos.set(
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

    const id =
      Number(
        valor
      );


    this.productoFiltro.set(
      Number.isInteger(id) &&
      id > 0

        ? id

        : null
    );


    this.cargarMovimientos();
  }


  /*
  |--------------------------------------------------------------------------
  | Nueva entrada
  |--------------------------------------------------------------------------
  */

  nuevaEntrada(): void {

    this.limpiarMensajes();


    this.tipoOperacion.set(
      'ENTRADA'
    );


    this.form.reset({

      producto_id: 0,

      cantidad: 0,

      nuevo_stock_fisico: 0,

      motivo: ''
    });


    this.mostrarOperacion.set(
      true
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Nuevo ajuste
  |--------------------------------------------------------------------------
  */

  nuevoAjuste(): void {

    this.limpiarMensajes();


    this.tipoOperacion.set(
      'AJUSTE'
    );


    this.form.reset({

      producto_id: 0,

      cantidad: 0,

      nuevo_stock_fisico: 0,

      motivo: ''
    });


    this.mostrarOperacion.set(
      true
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Abrir operación sobre un producto
  |--------------------------------------------------------------------------
  */

  entradaProducto(
    producto: Producto
  ): void {

    this.nuevaEntrada();


    this.form.controls
      .producto_id
      .setValue(
        producto.id_producto
      );
  }


  ajusteProducto(
    producto: Producto
  ): void {

    this.nuevoAjuste();


    this.form.controls
      .producto_id
      .setValue(
        producto.id_producto
      );


    this.form.controls
      .nuevo_stock_fisico
      .setValue(
        Number(
          producto.stock_disponible
        ) +
        Number(
          producto.stock_reservado
        )
      );
  }


  /*
  |--------------------------------------------------------------------------
  | Cancelar
  |--------------------------------------------------------------------------
  */

  cancelarOperacion(): void {

    this.mostrarOperacion.set(
      false
    );


    this.tipoOperacion.set(
      null
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Guardar
  |--------------------------------------------------------------------------
  */

  guardar(): void {

    if (
      this.guardando()
    ) {

      return;
    }


    this.limpiarMensajes();


    const productoId =
      Number(
        this.form.controls
          .producto_id.value
      );


    const motivo =
      this.form.controls
        .motivo.value
        .trim();


    if (
      !Number.isInteger(
        productoId
      ) ||

      productoId <= 0
    ) {

      this.error.set(
        'Selecciona un producto.'
      );

      return;
    }


    if (!motivo) {

      this.error.set(
        'El motivo es obligatorio.'
      );

      return;
    }


    const producto =
      this.productoSeleccionado();


    if (!producto) {

      this.error.set(
        'Producto no encontrado.'
      );

      return;
    }


    /*
    |--------------------------------------------------------------------------
    | ENTRADA
    |--------------------------------------------------------------------------
    */

    if (
      this.tipoOperacion() ===
      'ENTRADA'
    ) {

      const cantidad =
        Number(
          this.form.controls
            .cantidad.value
        );


      if (
        !Number.isFinite(cantidad) ||
        cantidad <= 0
      ) {

        this.error.set(
          'La cantidad de entrada debe ser mayor que cero.'
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
          'Solo los productos vendidos por metro pueden tener cantidades fraccionarias.'
        );

        return;
      }


      this.registrarEntrada(
        productoId,
        cantidad,
        motivo
      );


      return;
    }


    /*
    |--------------------------------------------------------------------------
    | AJUSTE
    |--------------------------------------------------------------------------
    */

    if (
      this.tipoOperacion() ===
      'AJUSTE'
    ) {

      const nuevoStockFisico =
        Number(
          this.form.controls
            .nuevo_stock_fisico.value
        );


      if (
        !Number.isFinite(
          nuevoStockFisico
        ) ||

        nuevoStockFisico < 0
      ) {

        this.error.set(
          'El nuevo stock físico es inválido.'
        );

        return;
      }


      if (
        producto.unidad_medida !==
          'METRO' &&

        !Number.isInteger(
          nuevoStockFisico
        )
      ) {

        this.error.set(
          'Solo los productos vendidos por metro pueden tener stock fraccionario.'
        );

        return;
      }


      if (
        nuevoStockFisico <
        Number(
          producto.stock_reservado
        )
      ) {

        this.error.set(
          'El stock físico no puede ser menor que el stock reservado.'
        );

        return;
      }


      this.registrarAjuste(
        productoId,
        nuevoStockFisico,
        motivo
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Registrar entrada
  |--------------------------------------------------------------------------
  */

  private registrarEntrada(
    productoId: number,
    cantidad: number,
    motivo: string
  ): void {

    this.guardando.set(
      true
    );


    this.inventarioService
      .registrarEntrada({

        producto_id:
          productoId,

        cantidad,

        motivo
      })
      .subscribe({

        next: respuesta => {

          this.guardando.set(
            false
          );


          this.cancelarOperacion();


          this.mensaje.set(
            respuesta.message ??
            'Entrada registrada correctamente.'
          );


          this.refrescarDespuesOperacion();
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


  /*
  |--------------------------------------------------------------------------
  | Registrar ajuste
  |--------------------------------------------------------------------------
  */

  private registrarAjuste(
    productoId: number,
    nuevoStockFisico: number,
    motivo: string
  ): void {

    this.guardando.set(
      true
    );


    this.inventarioService
      .registrarAjuste({

        producto_id:
          productoId,

        nuevo_stock_fisico:
          nuevoStockFisico,

        motivo
      })
      .subscribe({

        next: respuesta => {

          this.guardando.set(
            false
          );


          this.cancelarOperacion();


          this.mensaje.set(
            respuesta.message ??
            'Inventario ajustado correctamente.'
          );


          this.refrescarDespuesOperacion();
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


  /*
  |--------------------------------------------------------------------------
  | Refrescar
  |--------------------------------------------------------------------------
  */

  private refrescarDespuesOperacion():
    void {

    this.productoService
      .listar()
      .subscribe({

        next: respuesta => {

          this.productos.set(
            respuesta.data
          );


          this.cargarMovimientos();
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
  | Helpers visuales
  |--------------------------------------------------------------------------
  */

  stockFisico(
    producto: Producto
  ): number {

    return (
      Number(
        producto.stock_disponible
      ) +
      Number(
        producto.stock_reservado
      )
    );
  }


  stockBajo(
    producto: Producto
  ): boolean {

    return (
      Number(
        producto.stock_disponible
      ) <=
      Number(
        producto.stock_minimo
      )
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

        return 'La sesión ha expirado o no es válida.';
      }


      if (
        error.status === 403
      ) {

        return 'No tienes permisos para gestionar el inventario.';
      }


      if (
        error.error?.message ===
        'STOCK_FISICO_MENOR_QUE_RESERVADO'
      ) {

        return 'El stock físico no puede ser menor que la cantidad actualmente reservada.';
      }


      if (
        error.error?.message ===
        'AJUSTE_SIN_CAMBIOS'
      ) {

        return 'El stock ingresado es igual al stock actual. No existen cambios que registrar.';
      }


      return (
        error.error?.message ??
        'No se pudo completar la operación.'
      );
    }


    return 'No se pudo completar la operación.';
  }
}