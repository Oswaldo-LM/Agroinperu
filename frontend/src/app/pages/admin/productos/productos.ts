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
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Categoria
} from '../../../models/categoria.model';

import {
  Producto,
  UnidadMedida
} from '../../../models/producto.model';

import {
  CategoriaService
} from '../../../core/services/categoria.service';

import {
  ProductoService
} from '../../../core/services/producto.service';


@Component({
  selector:
    'app-productos',

  imports: [
    ReactiveFormsModule,
    DecimalPipe
  ],

  templateUrl:
    './productos.html',

  styleUrl:
    './productos.css'
})
export class Productos
  implements OnInit {

  private readonly productoService =
    inject(
      ProductoService
    );


  private readonly categoriaService =
    inject(
      CategoriaService
    );


  private readonly fb =
    inject(
      NonNullableFormBuilder
    );


  /*
  |--------------------------------------------------------------------------
  | Estado
  |--------------------------------------------------------------------------
  */

  readonly productos =
    signal<Producto[]>(
      []
    );


  readonly categorias =
    signal<Categoria[]>(
      []
    );


  readonly categoriasActivas =
    computed(
      () =>
        this.categorias()
          .filter(
            categoria =>
              categoria.estado ===
              'ACTIVO'
          )
    );


  readonly cargando =
    signal(true);


  readonly guardando =
    signal(false);


  readonly mostrarFormulario =
    signal(false);


  readonly productoEditando =
    signal<Producto | null>(
      null
    );


  readonly error =
    signal<string | null>(
      null
    );


  readonly mensaje =
    signal<string | null>(
      null
    );


  readonly unidades:
    UnidadMedida[] = [

      'UNIDAD',
      'METRO',
      'ROLLO',
      'CAJA'
    ];


  /*
  |--------------------------------------------------------------------------
  | Formulario
  |--------------------------------------------------------------------------
  */

  readonly form =
    this.fb.group({

      categoria_id: [
        0,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      codigo: [
        '',
        [
          Validators.required,
          Validators.maxLength(50)
        ]
      ],

      codigo_barras: [
        '',
        [
          Validators.maxLength(100)
        ]
      ],

      nombre: [
        '',
        [
          Validators.required,
          Validators.maxLength(150)
        ]
      ],

      descripcion: [
        '',
        [
          Validators.maxLength(500)
        ]
      ],

      unidad_medida: [
        'UNIDAD' as UnidadMedida,
        [
          Validators.required
        ]
      ],

      precio: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      stock_disponible: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      stock_minimo: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      imagen_url: [
        ''
      ],

      visible_web: [
        true
      ]
    });


  ngOnInit(): void {

    this.cargarDatos();
  }


  /*
  |--------------------------------------------------------------------------
  | Carga inicial
  |--------------------------------------------------------------------------
  */

  cargarDatos(): void {

    this.cargando.set(
      true
    );


    this.error.set(
      null
    );


    let productosTerminados =
      false;


    let categoriasTerminadas =
      false;


    const finalizar = () => {

      if (
        productosTerminados &&
        categoriasTerminadas
      ) {

        this.cargando.set(
          false
        );
      }
    };


    this.productoService
      .listar()
      .subscribe({

        next: respuesta => {

          this.productos.set(
            respuesta.data
          );


          productosTerminados =
            true;


          finalizar();
        },


        error: error => {

          productosTerminados =
            true;


          this.error.set(
            this.obtenerMensajeError(
              error
            )
          );


          finalizar();
        }
      });


    this.categoriaService
      .listar()
      .subscribe({

        next: respuesta => {

          this.categorias.set(
            respuesta.data
          );


          categoriasTerminadas =
            true;


          finalizar();
        },


        error: error => {

          categoriasTerminadas =
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
  | Nuevo producto
  |--------------------------------------------------------------------------
  */

  nuevoProducto(): void {

    this.limpiarMensajes();


    this.productoEditando.set(
      null
    );


    this.form.reset({

      categoria_id:
        0,

      codigo:
        '',

      codigo_barras:
        '',

      nombre:
        '',

      descripcion:
        '',

      unidad_medida:
        'UNIDAD',

      precio:
        0,

      stock_disponible:
        0,

      stock_minimo:
        0,

      imagen_url:
        '',

      visible_web:
        true
    });


    this.form.controls
      .stock_disponible
      .enable();


    this.mostrarFormulario.set(
      true
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Editar
  |--------------------------------------------------------------------------
  */

  editarProducto(
    producto: Producto
  ): void {

    this.limpiarMensajes();


    this.productoEditando.set(
      producto
    );


    this.form.reset({

      categoria_id:
        producto.categoria_id,

      codigo:
        producto.codigo,

      codigo_barras:
        producto.codigo_barras
        ?? '',

      nombre:
        producto.nombre,

      descripcion:
        producto.descripcion
        ?? '',

      unidad_medida:
        producto.unidad_medida,

      precio:
        Number(
          producto.precio
        ),

      stock_disponible:
        Number(
          producto.stock_disponible
        ),

      stock_minimo:
        Number(
          producto.stock_minimo
        ),

      imagen_url:
        producto.imagen_url
        ?? '',

      visible_web:
        Boolean(
          producto.visible_web
        )
    });


    /*
     * El stock no puede modificarse
     * desde edición de producto.
     */
    this.form.controls
      .stock_disponible
      .disable();


    this.mostrarFormulario.set(
      true
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Cancelar
  |--------------------------------------------------------------------------
  */

  cancelarFormulario(): void {

    this.productoEditando.set(
      null
    );


    this.mostrarFormulario.set(
      false
    );


    this.form.controls
      .stock_disponible
      .enable();
  }


  /*
  |--------------------------------------------------------------------------
  | Guardar
  |--------------------------------------------------------------------------
  */

  guardar(): void {

    if (
      this.form.invalid ||
      this.guardando()
    ) {

      this.form
        .markAllAsTouched();

      return;
    }


    this.limpiarMensajes();


    const valores =
      this.form.getRawValue();


    const categoriaId =
      Number(
        valores.categoria_id
      );


    const precio =
      Number(
        valores.precio
      );


    const stockDisponible =
      Number(
        valores.stock_disponible
      );


    const stockMinimo =
      Number(
        valores.stock_minimo
      );


    /*
    |--------------------------------------------------------------------------
    | Validaciones adicionales
    |--------------------------------------------------------------------------
    */

    if (
      !Number.isFinite(
        precio
      ) ||
      precio < 0
    ) {

      this.error.set(
        'El precio es inválido.'
      );

      return;
    }


    if (
      !Number.isFinite(
        stockDisponible
      ) ||

      stockDisponible < 0
    ) {

      this.error.set(
        'El stock inicial es inválido.'
      );

      return;
    }


    if (
      !Number.isFinite(
        stockMinimo
      ) ||

      stockMinimo < 0
    ) {

      this.error.set(
        'El stock mínimo es inválido.'
      );

      return;
    }


    /*
     * Solo METRO admite cantidades
     * fraccionarias.
     */

    if (
      valores.unidad_medida !==
        'METRO' &&

      (
        !Number.isInteger(
          stockDisponible
        ) ||

        !Number.isInteger(
          stockMinimo
        )
      )
    ) {

      this.error.set(
        'Solo los productos vendidos por metro pueden utilizar stock fraccionario.'
      );

      return;
    }


    this.guardando.set(
      true
    );


    const productoEditando =
      this.productoEditando();


    /*
    |--------------------------------------------------------------------------
    | ACTUALIZAR
    |--------------------------------------------------------------------------
    */

    if (
      productoEditando
    ) {

      const datos = {

        categoria_id:
          categoriaId,

        codigo:
          valores.codigo
            .trim(),

        codigo_barras:
          valores.codigo_barras
            .trim()
          || null,

        nombre:
          valores.nombre
            .trim(),

        descripcion:
          valores.descripcion
            .trim()
          || null,

        unidad_medida:
          valores.unidad_medida,

        precio,

        stock_minimo:
          stockMinimo,

        imagen_url:
          valores.imagen_url
            .trim()
          || null,

        visible_web:
          valores.visible_web
      };


      this.productoService
        .actualizar(
          productoEditando
            .id_producto,

          datos
        )
        .subscribe({

          next: () => {

            this.guardando.set(
              false
            );


            this.cancelarFormulario();


            this.mensaje.set(
              'Producto actualizado correctamente.'
            );


            this.cargarProductos();
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


      return;
    }


    /*
    |--------------------------------------------------------------------------
    | CREAR
    |--------------------------------------------------------------------------
    */

    const datos = {

      categoria_id:
        categoriaId,

      codigo:
        valores.codigo
          .trim(),

      codigo_barras:
        valores.codigo_barras
          .trim()
        || null,

      nombre:
        valores.nombre
          .trim(),

      descripcion:
        valores.descripcion
          .trim()
        || null,

      unidad_medida:
        valores.unidad_medida,

      precio,

      stock_disponible:
        stockDisponible,

      stock_minimo:
        stockMinimo,

      imagen_url:
        valores.imagen_url
          .trim()
        || null,

      visible_web:
        valores.visible_web
    };


    this.productoService
      .crear(
        datos
      )
      .subscribe({

        next: () => {

          this.guardando.set(
            false
          );


          this.cancelarFormulario();


          this.mensaje.set(
            'Producto creado correctamente.'
          );


          this.cargarProductos();
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
  | Inactivar
  |--------------------------------------------------------------------------
  */

  eliminarProducto(
    producto: Producto
  ): void {

    const confirmar =
      window.confirm(
        `¿Deseas inactivar el producto "${producto.nombre}"?`
      );


    if (
      !confirmar
    ) {

      return;
    }


    this.limpiarMensajes();


    this.productoService
      .eliminar(
        producto.id_producto
      )
      .subscribe({

        next: () => {

          this.mensaje.set(
            'Producto inactivado correctamente.'
          );


          this.cargarProductos();
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
  | Solo refrescar productos
  |--------------------------------------------------------------------------
  */

  cargarProductos(): void {

    this.productoService
      .listar()
      .subscribe({

        next: respuesta => {

          this.productos.set(
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


  /*
  |--------------------------------------------------------------------------
  | Nombre de categoría
  |--------------------------------------------------------------------------
  */

  obtenerNombreCategoria(
    categoriaId: number
  ): string {

    return (
      this.categorias()
        .find(
          categoria =>
            categoria.id_categoria ===
            categoriaId
        )
        ?.nombre
      ??
      'Sin categoría'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

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
          'No tienes permisos para realizar esta operación.'
        );
      }


      if (
        error.status === 409
      ) {

        return (
          error.error?.message
          ??
          'El producto entra en conflicto con un registro existente.'
        );
      }


      return (
        error.error?.message
        ??
        'No se pudo completar la operación.'
      );
    }


    return (
      'No se pudo completar la operación.'
    );
  }
}