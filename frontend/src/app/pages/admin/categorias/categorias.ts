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
  Categoria
} from '../../../models/categoria.model';

import {
  CategoriaService
} from '../../../core/services/categoria.service';


@Component({
  selector:
    'app-categorias',

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './categorias.html',

  styleUrl:
    './categorias.css'
})
export class Categorias
  implements OnInit {

  private readonly categoriaService =
    inject(CategoriaService);


  private readonly fb =
    inject(
      NonNullableFormBuilder
    );


  readonly categorias =
    signal<Categoria[]>(
      []
    );


  readonly cargando =
    signal(true);


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


  readonly mostrarFormulario =
    signal(false);


  readonly categoriaEditando =
    signal<Categoria | null>(
      null
    );


  readonly form =
    this.fb.group({

      nombre: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      descripcion: [
        '',
        [
          Validators.maxLength(255)
        ]
      ]
    });


  ngOnInit(): void {

    this.cargarCategorias();
  }


  /*
  |--------------------------------------------------------------------------
  | Listar
  |--------------------------------------------------------------------------
  */

  cargarCategorias(): void {

    this.cargando.set(
      true
    );


    this.error.set(
      null
    );


    this.categoriaService
      .listar()
      .subscribe({

        next: respuesta => {

          this.categorias.set(
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
  | Nueva categoría
  |--------------------------------------------------------------------------
  */

  nuevaCategoria(): void {

    this.limpiarMensajes();


    this.categoriaEditando.set(
      null
    );


    this.form.reset({
      nombre: '',
      descripcion: ''
    });


    this.mostrarFormulario.set(
      true
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Editar
  |--------------------------------------------------------------------------
  */

  editarCategoria(
    categoria: Categoria
  ): void {

    this.limpiarMensajes();


    this.categoriaEditando.set(
      categoria
    );


    this.form.setValue({

      nombre:
        categoria.nombre,

      descripcion:
        categoria.descripcion ?? ''
    });


    this.mostrarFormulario.set(
      true
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Cancelar formulario
  |--------------------------------------------------------------------------
  */

  cancelarFormulario(): void {

    this.form.reset({
      nombre: '',
      descripcion: ''
    });


    this.categoriaEditando.set(
      null
    );


    this.mostrarFormulario.set(
      false
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Crear / actualizar
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


    this.guardando.set(
      true
    );


    const valores =
      this.form.getRawValue();


    const datos = {

      nombre:
        valores.nombre.trim(),

      descripcion:
        valores.descripcion.trim()
          || null
    };


    const categoria =
      this.categoriaEditando();


    if (categoria) {

      this.categoriaService
        .actualizar(
          categoria.id_categoria,
          datos
        )
        .subscribe({

          next: () => {

            this.guardando.set(
              false
            );


            this.mensaje.set(
              'Categoría actualizada correctamente'
            );


            this.cancelarFormulario();


            this.cargarCategorias();
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


    this.categoriaService
      .crear(
        datos
      )
      .subscribe({

        next: () => {

          this.guardando.set(
            false
          );


          this.mensaje.set(
            'Categoría creada correctamente'
          );


          this.cancelarFormulario();


          this.cargarCategorias();
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

  eliminarCategoria(
    categoria: Categoria
  ): void {

    const confirmar =
      window.confirm(
        `¿Deseas inactivar la categoría "${categoria.nombre}"?`
      );


    if (!confirmar) {

      return;
    }


    this.limpiarMensajes();


    this.categoriaService
      .eliminar(
        categoria.id_categoria
      )
      .subscribe({

        next: () => {

          this.mensaje.set(
            'Categoría inactivada correctamente'
          );


          this.cargarCategorias();
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