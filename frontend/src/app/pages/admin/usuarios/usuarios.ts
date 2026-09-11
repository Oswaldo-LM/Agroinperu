import {
  Component,
  computed,
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
  AuthService
} from '../../../core/services/auth.service';

import {
  UsuarioService
} from '../../../core/services/usuario.service';

import {
  ActualizarUsuarioDto,
  CrearUsuarioDto,
  EstadoUsuario,
  RolUsuarioInterno,
  Usuario
} from '../../../models/usuario.model';


@Component({
  selector:
    'app-usuarios',

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './usuarios.html',

  styleUrl:
    './usuarios.css'
})
export class Usuarios
  implements OnInit {

  readonly authService =
    inject(AuthService);


  private readonly usuarioService =
    inject(UsuarioService);


  private readonly fb =
    inject(
      NonNullableFormBuilder
    );


  readonly usuarios =
    signal<Usuario[]>(
      []
    );


  readonly cargando =
    signal(true);


  readonly guardando =
    signal(false);


  readonly cambiandoPassword =
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


  readonly mostrarPassword =
    signal(false);


  readonly usuarioEditando =
    signal<Usuario | null>(
      null
    );


  readonly usuarioPassword =
    signal<Usuario | null>(
      null
    );


  readonly busqueda =
    signal('');


  readonly roles:
    RolUsuarioInterno[] = [

      'ADMIN',
      'CAJERO'
    ];


  readonly estados:
    EstadoUsuario[] = [

      'ACTIVO',
      'INACTIVO',
      'BLOQUEADO'
    ];


  readonly usuariosFiltrados =
    computed(
      () => {

        const texto =
          this.busqueda()
            .trim()
            .toLowerCase();


        if (!texto) {

          return this.usuarios();
        }


        return this.usuarios()
          .filter(
            usuario => {

              const contenido = [

                usuario.nombre,
                usuario.email,
                usuario.rol,
                usuario.estado

              ]
                .join(' ')
                .toLowerCase();


              return contenido
                .includes(texto);
            }
          );
      }
    );


  readonly form =
    this.fb.group({

      nombre: [
        '',
        [
          Validators.required,
          Validators.maxLength(120)
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(120)
        ]
      ],

      password: [
        '',
        [
          Validators.minLength(8),
          Validators.maxLength(72)
        ]
      ],

      rol: [
        'CAJERO' as RolUsuarioInterno,
        [
          Validators.required
        ]
      ],

      estado: [
        'ACTIVO' as EstadoUsuario,
        [
          Validators.required
        ]
      ]
    });


  readonly passwordForm =
    this.fb.group({

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(72)
        ]
      ],

      confirmar_password: [
        '',
        [
          Validators.required
        ]
      ]
    });


  ngOnInit(): void {

    this.cargarUsuarios();
  }


  /*
  |--------------------------------------------------------------------------
  | Listar
  |--------------------------------------------------------------------------
  */

  cargarUsuarios(): void {

    this.cargando.set(
      true
    );


    this.error.set(
      null
    );


    this.usuarioService
      .listar()
      .subscribe({

        next: respuesta => {

          this.usuarios.set(
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
  | Nuevo
  |--------------------------------------------------------------------------
  */

  nuevoUsuario(): void {

    this.limpiarMensajes();


    this.usuarioEditando.set(
      null
    );


    this.form.reset({

      nombre: '',

      email: '',

      password: '',

      rol:
        'CAJERO',

      estado:
        'ACTIVO'
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

  editarUsuario(
    usuario: Usuario
  ): void {

    this.limpiarMensajes();


    this.usuarioEditando.set(
      usuario
    );


    this.form.reset({

      nombre:
        usuario.nombre,

      email:
        usuario.email,

      password:
        '',

      rol:
        usuario.rol,

      estado:
        usuario.estado
    });


    this.mostrarFormulario.set(
      true
    );
  }


  cancelarFormulario(): void {

    this.mostrarFormulario.set(
      false
    );


    this.usuarioEditando.set(
      null
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Saber si es la sesión actual
  |--------------------------------------------------------------------------
  */

  esUsuarioActual(
    usuario: Usuario
  ): boolean {

    return (
      this.authService
        .sesion()
        ?.id ===
      usuario.id_usuario
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


    if (
      this.form.invalid
    ) {

      this.form
        .markAllAsTouched();

      return;
    }


    this.limpiarMensajes();


    const valores =
      this.form
        .getRawValue();


    const nombre =
      valores.nombre
        .trim();


    const email =
      valores.email
        .trim()
        .toLowerCase();


    if (
      !nombre ||
      !email
    ) {

      this.error.set(
        'Nombre y correo son obligatorios.'
      );

      return;
    }


    const usuario =
      this.usuarioEditando();


    /*
    |--------------------------------------------------------------------------
    | CREAR
    |--------------------------------------------------------------------------
    */

    if (!usuario) {

      const password =
        valores.password;


      if (
        password.length < 8 ||
        password.length > 72
      ) {

        this.error.set(
          'La contraseña debe tener entre 8 y 72 caracteres.'
        );

        return;
      }


      const datos:
        CrearUsuarioDto = {

        nombre,

        email,

        password,

        rol:
          valores.rol
      };


      this.guardando.set(
        true
      );


      this.usuarioService
        .crear(datos)
        .subscribe({

          next: respuesta => {

            this.guardando.set(
              false
            );


            this.cancelarFormulario();


            this.mensaje.set(
              respuesta.message ??
              'Usuario creado correctamente.'
            );


            this.cargarUsuarios();
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
    | ACTUALIZAR
    |--------------------------------------------------------------------------
    */

    const datos:
      ActualizarUsuarioDto = {

      nombre,

      email
    };


    /*
     * El backend no permite cambiar
     * nuestro propio rol ni
     * desactivar nuestra propia cuenta.
     *
     * No los enviamos cuando editamos
     * la sesión actual.
     */

    if (
      !this.esUsuarioActual(
        usuario
      )
    ) {

      datos.rol =
        valores.rol;


      datos.estado =
        valores.estado;
    }


    this.guardando.set(
      true
    );


    this.usuarioService
      .actualizar(
        usuario.id_usuario,
        datos
      )
      .subscribe({

        next: respuesta => {

          this.guardando.set(
            false
          );


          this.cancelarFormulario();


          this.mensaje.set(
            respuesta.message ??
            'Usuario actualizado correctamente.'
          );


          this.cargarUsuarios();
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
  | Password
  |--------------------------------------------------------------------------
  */

  abrirCambioPassword(
    usuario: Usuario
  ): void {

    this.limpiarMensajes();


    this.usuarioPassword.set(
      usuario
    );


    this.passwordForm.reset({

      password: '',

      confirmar_password: ''
    });


    this.mostrarPassword.set(
      true
    );
  }


  cancelarPassword(): void {

    this.mostrarPassword.set(
      false
    );


    this.usuarioPassword.set(
      null
    );
  }


  guardarPassword(): void {

    if (
      this.cambiandoPassword() ||
      this.passwordForm.invalid
    ) {

      this.passwordForm
        .markAllAsTouched();

      return;
    }


    this.limpiarMensajes();


    const usuario =
      this.usuarioPassword();


    if (!usuario) {

      return;
    }


    const valores =
      this.passwordForm
        .getRawValue();


    if (
      valores.password !==
      valores.confirmar_password
    ) {

      this.error.set(
        'Las contraseñas no coinciden.'
      );

      return;
    }


    if (
      valores.password.length < 8 ||
      valores.password.length > 72
    ) {

      this.error.set(
        'La contraseña debe tener entre 8 y 72 caracteres.'
      );

      return;
    }


    this.cambiandoPassword.set(
      true
    );


    this.usuarioService
      .cambiarPassword(
        usuario.id_usuario,
        {
          password:
            valores.password
        }
      )
      .subscribe({

        next: respuesta => {

          this.cambiandoPassword.set(
            false
          );


          this.cancelarPassword();


          this.mensaje.set(
            respuesta.message ??
            'Contraseña actualizada correctamente.'
          );
        },


        error: error => {

          this.cambiandoPassword.set(
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

  inactivarUsuario(
    usuario: Usuario
  ): void {

    this.limpiarMensajes();


    if (
      this.esUsuarioActual(
        usuario
      )
    ) {

      this.error.set(
        'No puedes inactivar tu propia cuenta.'
      );

      return;
    }


    if (
      !window.confirm(
        `¿Deseas inactivar al usuario "${usuario.nombre}"?`
      )
    ) {

      return;
    }


    this.usuarioService
      .inactivar(
        usuario.id_usuario
      )
      .subscribe({

        next: respuesta => {

          this.mensaje.set(
            respuesta.message ??
            'Usuario inactivado correctamente.'
          );


          this.cargarUsuarios();
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


  /*
  |--------------------------------------------------------------------------
  | Errores
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

        return 'La sesión ha expirado.';
      }


      if (
        error.status === 403
      ) {

        return 'No tienes permisos para administrar usuarios.';
      }


      const mensaje =
        String(
          error.error?.message ??
          ''
        );


      if (
        mensaje ===
        'EMAIL_EN_USO'
      ) {

        return 'El correo electrónico ya está registrado.';
      }


      if (
        mensaje.includes(
          'ULTIMO_ADMIN'
        )
      ) {

        return 'No se puede modificar al último administrador activo del sistema.';
      }


      if (
        mensaje.includes(
          'PROPIO'
        )
      ) {

        return 'No puedes realizar esa operación sobre tu propia cuenta.';
      }


      return (
        mensaje ||
        'No se pudo completar la operación.'
      );
    }


    return 'No se pudo completar la operación.';
  }
}