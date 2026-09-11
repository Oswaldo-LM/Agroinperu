import {
  Component,
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
  ReporteService
} from '../../../core/services/reporte.service';

import {
  FilaReporte,
  ReporteVentas
} from '../../../models/reporte-ventas.model';


@Component({
  selector:
    'app-reportes',

  imports: [
    ReactiveFormsModule,
    DecimalPipe
  ],

  templateUrl:
    './reportes.html',

  styleUrl:
    './reportes.css'
})
export class Reportes
  implements OnInit {

  private readonly reporteService =
    inject(ReporteService);


  private readonly fb =
    inject(
      NonNullableFormBuilder
    );


  readonly reporte =
    signal<ReporteVentas | null>(
      null
    );


  readonly cargando =
    signal(false);


  readonly exportando =
    signal(false);


  readonly error =
    signal<string | null>(
      null
    );


  readonly mensaje =
    signal<string | null>(
      null
    );


  readonly form =
    this.fb.group({

      desde: [
        this.primerDiaMesActual(),
        [
          Validators.required
        ]
      ],

      hasta: [
        this.fechaActual(),
        [
          Validators.required
        ]
      ]
    });


  ngOnInit(): void {

    this.generarReporte();
  }


  /*
  |--------------------------------------------------------------------------
  | Generar reporte
  |--------------------------------------------------------------------------
  */

  generarReporte(): void {

    if (
      this.cargando() ||
      this.form.invalid
    ) {

      this.form
        .markAllAsTouched();

      return;
    }


    this.error.set(
      null
    );


    this.mensaje.set(
      null
    );


    const rango =
      this.obtenerRangoValido();


    if (!rango) {

      return;
    }


    this.cargando.set(
      true
    );


    this.reporteService
      .ventas(
        rango.desde,
        rango.hasta
      )
      .subscribe({

        next: respuesta => {

          this.reporte.set(
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
  | Exportar CSV
  |--------------------------------------------------------------------------
  */

  exportarCsv(): void {

    if (
      this.exportando() ||
      this.form.invalid
    ) {

      this.form
        .markAllAsTouched();

      return;
    }


    this.error.set(
      null
    );


    this.mensaje.set(
      null
    );


    const rango =
      this.obtenerRangoValido();


    if (!rango) {

      return;
    }


    this.exportando.set(
      true
    );


    this.reporteService
      .exportarVentasCsv(
        rango.desde,
        rango.hasta
      )
      .subscribe({

        next: archivo => {

          this.exportando.set(
            false
          );


          /*
           * Creamos una URL temporal
           * para el Blob recibido.
           */

          const url =
            URL.createObjectURL(
              archivo
            );


          /*
           * Creamos temporalmente un
           * enlace para iniciar la
           * descarga en el navegador.
           */

          const enlace =
            document.createElement(
              'a'
            );


          enlace.href =
            url;


          enlace.download =
            `reporte-ventas-${rango.desde}-${rango.hasta}.csv`;


          document.body
            .appendChild(
              enlace
            );


          enlace.click();


          enlace.remove();


          /*
           * Liberamos la URL temporal.
           */

          setTimeout(
            () => {

              URL.revokeObjectURL(
                url
              );

            },
            0
          );


          this.mensaje.set(
            'Reporte CSV exportado correctamente.'
          );
        },


        error: error => {

          this.exportando.set(
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
  | Validación común del rango
  |--------------------------------------------------------------------------
  */

  private obtenerRangoValido():
    {
      desde: string;
      hasta: string;
    }
    | null {

    const {
      desde,
      hasta
    } =
      this.form
        .getRawValue();


    if (
      !desde ||
      !hasta
    ) {

      this.error.set(
        'Selecciona ambas fechas.'
      );

      return null;
    }


    if (
      desde > hasta
    ) {

      this.error.set(
        'La fecha inicial no puede ser posterior a la fecha final.'
      );

      return null;
    }


    const dias =
      this.diferenciaDias(
        desde,
        hasta
      );


    if (
      dias > 366
    ) {

      this.error.set(
        'El rango del reporte no puede superar 366 días.'
      );

      return null;
    }


    return {
      desde,
      hasta
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Atajos
  |--------------------------------------------------------------------------
  */

  seleccionarMesActual(): void {

    this.form.setValue({

      desde:
        this.primerDiaMesActual(),

      hasta:
        this.fechaActual()
    });


    this.generarReporte();
  }


  seleccionarHoy(): void {

    const hoy =
      this.fechaActual();


    this.form.setValue({

      desde:
        hoy,

      hasta:
        hoy
    });


    this.generarReporte();
  }


  /*
  |--------------------------------------------------------------------------
  | Tablas dinámicas
  |--------------------------------------------------------------------------
  */

  columnas(
    filas: FilaReporte[]
  ): string[] {

    if (
      filas.length === 0
    ) {

      return [];
    }


    const resultado =
      new Set<string>();


    for (
      const fila
      of filas
    ) {

      Object.keys(
        fila
      )
        .forEach(
          columna =>
            resultado.add(
              columna
            )
        );
    }


    return Array.from(
      resultado
    );
  }


  valor(
    fila: FilaReporte,
    columna: string
  ): unknown {

    return fila[columna];
  }


  nombreColumna(
    columna: string
  ): string {

    const nombres:
      Record<string, string> = {

      id_venta:
        'ID',

      codigo_venta:
        'Código',

      canal_venta:
        'Canal',

      canal:
        'Canal',

      estado:
        'Estado',

      cliente:
        'Cliente',

      cliente_nombre:
        'Cliente',

      producto:
        'Producto',

      producto_nombre:
        'Producto',

      metodo_pago:
        'Método de pago',

      cantidad:
        'Cantidad',

      cantidad_ventas:
        'Ventas',

      subtotal:
        'Subtotal',

      igv:
        'IGV',

      total:
        'Total',

      total_vendido:
        'Total vendido',

      monto:
        'Monto',

      fecha:
        'Fecha',

      fecha_creacion:
        'Fecha'
    };


    if (
      nombres[columna]
    ) {

      return nombres[columna];
    }


    return columna
      .replaceAll(
        '_',
        ' '
      )
      .replace(
        /\b\w/g,
        letra =>
          letra.toUpperCase()
      );
  }


  formatearValor(
    columna: string,
    valor: unknown
  ): string {

    if (
      valor === null ||
      valor === undefined ||
      valor === ''
    ) {

      return '—';
    }


    /*
     * Fechas ISO.
     */

    if (
      typeof valor ===
        'string' &&

      (
        columna.includes(
          'fecha'
        ) ||

        /^\d{4}-\d{2}-\d{2}T/.test(
          valor
        )
      )
    ) {

      const fecha =
        new Date(
          valor
        );


      if (
        !Number.isNaN(
          fecha.getTime()
        )
      ) {

        return fecha
          .toLocaleString(
            'es-PE'
          );
      }
    }


    /*
     * Valores monetarios.
     */

    if (
      this.esColumnaMonetaria(
        columna
      )
    ) {

      const numero =
        Number(
          valor
        );


      if (
        Number.isFinite(
          numero
        )
      ) {

        return (
          'S/ ' +
          numero.toFixed(2)
        );
      }
    }


    if (
      typeof valor ===
      'boolean'
    ) {

      return valor
        ? 'Sí'
        : 'No';
    }


    if (
      typeof valor ===
      'object'
    ) {

      try {

        return JSON.stringify(
          valor
        );

      } catch {

        return String(
          valor
        );
      }
    }


    return String(
      valor
    );
  }


  private esColumnaMonetaria(
    columna: string
  ): boolean {

    return [

      'precio',
      'precio_unitario',
      'subtotal',
      'igv',
      'total',
      'total_vendido',
      'monto',
      'importe'

    ]
      .some(
        termino =>
          columna
            .toLowerCase()
            .includes(
              termino
            )
      );
  }


  /*
  |--------------------------------------------------------------------------
  | Fechas
  |--------------------------------------------------------------------------
  */

  private fechaActual():
    string {

    const fecha =
      new Date();


    return this.formatearFechaInput(
      fecha
    );
  }


  private primerDiaMesActual():
    string {

    const fecha =
      new Date();


    fecha.setDate(
      1
    );


    return this.formatearFechaInput(
      fecha
    );
  }


  private formatearFechaInput(
    fecha: Date
  ): string {

    const anio =
      fecha.getFullYear();


    const mes =
      String(
        fecha.getMonth() + 1
      )
        .padStart(
          2,
          '0'
        );


    const dia =
      String(
        fecha.getDate()
      )
        .padStart(
          2,
          '0'
        );


    return (
      `${anio}-${mes}-${dia}`
    );
  }


  private diferenciaDias(
    desde: string,
    hasta: string
  ): number {

    const inicio =
      new Date(
        `${desde}T00:00:00`
      );


    const fin =
      new Date(
        `${hasta}T00:00:00`
      );


    const diferencia =
      fin.getTime() -
      inicio.getTime();


    return Math.floor(
      diferencia /
      (
        1000 *
        60 *
        60 *
        24
      )
    );
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
          'Solo un administrador puede consultar reportes.'
        );
      }


      if (
        error.status === 400
      ) {

        /*
         * Cuando responseType es Blob,
         * un error del backend también
         * puede llegar como Blob.
         */
        if (
          error.error instanceof Blob
        ) {

          return (
            'El rango de fechas no es válido.'
          );
        }


        return (
          error.error?.message
          ??
          'El rango de fechas no es válido.'
        );
      }


      return (
        error.error?.message
        ??
        'No se pudo generar o exportar el reporte.'
      );
    }


    return (
      'No se pudo generar o exportar el reporte.'
    );
  }
}