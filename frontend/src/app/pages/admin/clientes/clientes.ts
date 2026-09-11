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
  ClienteService
} from '../../../core/services/cliente.service';

import {
  Cliente,
  GuardarClienteDto,
  TipoCliente,
  TipoDocumento
} from '../../../models/cliente.model';


@Component({
  selector:
    'app-clientes',

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './clientes.html',

  styleUrl:
    './clientes.css'
})
export class Clientes
  implements OnInit {

  readonly authService =
    inject(AuthService);


  private readonly clienteService =
    inject(ClienteService);


  private readonly fb =
    inject(
      NonNullableFormBuilder
    );


  readonly clientes =
    signal<Cliente[]>(
      []
    );


  readonly cargando =
    signal(true);


  readonly guardando =
    signal(false);


  readonly mostrarFormulario =
    signal(false);


  readonly clienteEditando =
    signal<Cliente | null>(
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


  readonly busqueda =
    signal('');


  readonly tiposDocumento:
    TipoDocumento[] = [

      'DNI',
      'RUC',
      'CE',
      'PASAPORTE',
      'SIN_DOCUMENTO'
    ];


  readonly clientesFiltrados =
    computed(
      () => {

        const texto =
          this.busqueda()
            .trim()
            .toLowerCase();


        if (!texto) {

          return this.clientes();
        }


        return this.clientes()
          .filter(
            cliente => {

              const contenido = [

                cliente.numero_documento,

                cliente.nombres,

                cliente.apellidos,

                cliente.razon_social,

                cliente.email,

                cliente.telefono

              ]
                .filter(Boolean)
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

      tipo_cliente: [
        'PERSONA' as TipoCliente,
        [
          Validators.required
        ]
      ],

      tipo_documento: [
        'DNI' as TipoDocumento,
        [
          Validators.required
        ]
      ],

      numero_documento: [
        ''
      ],

      nombres: [
        '',
        [
          Validators.maxLength(100)
        ]
      ],

      apellidos: [
        '',
        [
          Validators.maxLength(100)
        ]
      ],

      razon_social: [
        '',
        [
          Validators.maxLength(180)
        ]
      ],

      email: [
        '',
        [
          Validators.email,
          Validators.maxLength(120)
        ]
      ],

      telefono: [
        '',
        [
          Validators.maxLength(30)
        ]
      ],

      direccion: [
        '',
        [
          Validators.maxLength(255)
        ]
      ]
    });


  ngOnInit(): void {

    this.cargarClientes();
  }


  cargarClientes(): void {

    this.cargando.set(
      true
    );


    this.error.set(
      null
    );


    this.clienteService
      .listar()
      .subscribe({

        next: respuesta => {

          this.clientes.set(
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


  nuevoCliente(): void {

    this.limpiarMensajes();


    this.clienteEditando.set(
      null
    );


    this.form.reset({

      tipo_cliente:
        'PERSONA',

      tipo_documento:
        'DNI',

      numero_documento:
        '',

      nombres:
        '',

      apellidos:
        '',

      razon_social:
        '',

      email:
        '',

      telefono:
        '',

      direccion:
        ''
    });


    this.mostrarFormulario.set(
      true
    );
  }


  editarCliente(
    cliente: Cliente
  ): void {

    this.limpiarMensajes();


    this.clienteEditando.set(
      cliente
    );


    this.form.reset({

      tipo_cliente:
        cliente.tipo_cliente,

      tipo_documento:
        cliente.tipo_documento,

      numero_documento:
        cliente.numero_documento ?? '',

      nombres:
        cliente.nombres ?? '',

      apellidos:
        cliente.apellidos ?? '',

      razon_social:
        cliente.razon_social ?? '',

      email:
        cliente.email ?? '',

      telefono:
        cliente.telefono ?? '',

      direccion:
        cliente.direccion ?? ''
    });


    this.mostrarFormulario.set(
      true
    );
  }


  cancelarFormulario(): void {

    this.clienteEditando.set(
      null
    );


    this.mostrarFormulario.set(
      false
    );
  }


  cambiarTipoCliente(): void {

    const tipo =
      this.form.controls
        .tipo_cliente.value;


    if (
      tipo === 'EMPRESA'
    ) {

      this.form.controls
        .tipo_documento
        .setValue('RUC');


      this.form.controls
        .nombres
        .setValue('');


      this.form.controls
        .apellidos
        .setValue('');

    } else if (
      this.form.controls
        .tipo_documento.value ===
        'RUC'
    ) {

      this.form.controls
        .tipo_documento
        .setValue('DNI');


      this.form.controls
        .razon_social
        .setValue('');
    }
  }


  cambiarTipoDocumento(): void {

    if (
      this.form.controls
        .tipo_documento.value ===
        'SIN_DOCUMENTO'
    ) {

      this.form.controls
        .numero_documento
        .setValue('');
    }
  }


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
      this.form
        .getRawValue();


    const tipoCliente =
      valores.tipo_cliente;


    const tipoDocumento =
      valores.tipo_documento;


    /*
    |--------------------------------------------------------------------------
    | Validaciones según tipo de cliente
    |--------------------------------------------------------------------------
    */

    if (
      tipoCliente ===
      'PERSONA'
    ) {

      if (
        !valores.nombres.trim()
      ) {

        this.error.set(
          'Los nombres son obligatorios para una persona.'
        );

        return;
      }


      if (
        !valores.apellidos.trim()
      ) {

        this.error.set(
          'Los apellidos son obligatorios para una persona.'
        );

        return;
      }
    }


    if (
      tipoCliente ===
      'EMPRESA'
    ) {

      if (
        tipoDocumento !==
        'RUC'
      ) {

        this.error.set(
          'Una empresa debe utilizar RUC.'
        );

        return;
      }


      if (
        !valores.razon_social
          .trim()
      ) {

        this.error.set(
          'La razón social es obligatoria.'
        );

        return;
      }
    }


    /*
    |--------------------------------------------------------------------------
    | Documento
    |--------------------------------------------------------------------------
    */

    if (
      tipoDocumento !==
        'SIN_DOCUMENTO' &&

      !valores.numero_documento
        .trim()
    ) {

      this.error.set(
        'Ingresa el número de documento.'
      );

      return;
    }


    if (
      tipoDocumento ===
        'DNI' &&

      !/^\d{8}$/.test(
        valores.numero_documento
          .trim()
      )
    ) {

      this.error.set(
        'El DNI debe contener 8 dígitos.'
      );

      return;
    }


    if (
      tipoDocumento ===
        'RUC' &&

      !/^\d{11}$/.test(
        valores.numero_documento
          .trim()
      )
    ) {

      this.error.set(
        'El RUC debe contener 11 dígitos.'
      );

      return;
    }


    const datos:
      GuardarClienteDto = {

      tipo_cliente:
        tipoCliente,

      tipo_documento:
        tipoDocumento,

      numero_documento:
        tipoDocumento ===
          'SIN_DOCUMENTO'

          ? null

          : valores
              .numero_documento
              .trim(),

      nombres:
        tipoCliente ===
          'PERSONA'

          ? valores.nombres
              .trim()

          : null,

      apellidos:
        tipoCliente ===
          'PERSONA'

          ? valores.apellidos
              .trim()

          : null,

      razon_social:
        tipoCliente ===
          'EMPRESA'

          ? valores.razon_social
              .trim()

          : null,

      email:
        valores.email
          .trim()
          .toLowerCase()
          || null,

      telefono:
        valores.telefono
          .trim()
          || null,

      direccion:
        valores.direccion
          .trim()
          || null
    };


    this.guardando.set(
      true
    );


    const cliente =
      this.clienteEditando();


    if (cliente) {

      this.actualizarCliente(
        cliente.id_cliente,
        datos
      );

      return;
    }


    this.crearCliente(
      datos
    );
  }


  private crearCliente(
    datos: GuardarClienteDto
  ): void {

    this.clienteService
      .crear(datos)
      .subscribe({

        next: respuesta => {

          this.guardando.set(
            false
          );


          this.cancelarFormulario();


          this.mensaje.set(
            respuesta.message ??
            'Cliente registrado correctamente.'
          );


          this.cargarClientes();
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


  private actualizarCliente(
    id: number,
    datos: GuardarClienteDto
  ): void {

    this.clienteService
      .actualizar(
        id,
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
            'Cliente actualizado correctamente.'
          );


          this.cargarClientes();
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


  inactivarCliente(
    cliente: Cliente
  ): void {

    if (
      !this.authService
        .esAdmin()
    ) {

      return;
    }


    const nombre =
      this.nombreCliente(
        cliente
      );


    if (
      !window.confirm(
        `¿Deseas inactivar al cliente "${nombre}"?`
      )
    ) {

      return;
    }


    this.limpiarMensajes();


    this.clienteService
      .eliminar(
        cliente.id_cliente
      )
      .subscribe({

        next: respuesta => {

          this.mensaje.set(
            respuesta.message ??
            'Cliente inactivado correctamente.'
          );


          this.cargarClientes();
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


    const nombre = [

      cliente.nombres,
      cliente.apellidos

    ]
      .filter(Boolean)
      .join(' ')
      .trim();


    return (
      nombre ||
      'Cliente'
    );
  }


  cambiarBusqueda(
    valor: string
  ): void {

    this.busqueda.set(
      valor
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