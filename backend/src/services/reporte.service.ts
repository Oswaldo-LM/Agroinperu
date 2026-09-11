import {
  ReporteVentas,
  ReporteVentaDetalle
} from '../models/reporte.model';

import {
  ReporteRepository
} from '../repositories/reporte.repository';


export class ReporteService {

  private reporteRepository =
    new ReporteRepository();


  /*
  |--------------------------------------------------------------------------
  | Reporte principal
  |--------------------------------------------------------------------------
  */

  async obtenerReporteVentas(
    desde: string,
    hasta: string
  ): Promise<ReporteVentas> {

    this.validarRangoFechas(
      desde,
      hasta
    );


    /*
    |--------------------------------------------------------------------------
    | Consultas independientes
    |--------------------------------------------------------------------------
    */

    const [
      resumen,
      porCanal,
      productos,
      metodosPago,
      ventas
    ] =
      await Promise.all([

        this.reporteRepository
          .obtenerResumenVentas(
            desde,
            hasta
          ),

        this.reporteRepository
          .obtenerVentasPorCanal(
            desde,
            hasta
          ),

        this.reporteRepository
          .obtenerProductosMasVendidos(
            desde,
            hasta
          ),

        this.reporteRepository
          .obtenerMetodosPago(
            desde,
            hasta
          ),

        this.reporteRepository
          .obtenerVentas(
            desde,
            hasta
          )
      ]);


    return {

      resumen,

      por_canal:
        porCanal,

      productos_mas_vendidos:
        productos,

      metodos_pago:
        metodosPago,

      ventas
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Exportación CSV
  |--------------------------------------------------------------------------
  */

  async exportarVentasCsv(
    desde: string,
    hasta: string
  ): Promise<string> {

    /*
     * Reutilizamos el reporte principal.
     *
     * De esta forma utilizamos exactamente
     * las mismas validaciones y consultas
     * que el reporte mostrado en pantalla.
     */

    const reporte =
      await this.obtenerReporteVentas(
        desde,
        hasta
      );


    const ventas:
      ReporteVentaDetalle[] =
        reporte.ventas;


    /*
     * Si no existen ventas,
     * devolvemos igualmente un CSV válido.
     */

    if (
      ventas.length === 0
    ) {

      return [

        'REPORTE DE VENTAS',

        `Desde,${this.escaparCsv(desde)}`,

        `Hasta,${this.escaparCsv(hasta)}`,

        '',

        'No existen ventas en el rango seleccionado.'

      ].join('\r\n');
    }


    /*
     * Object.keys() devuelve string[].
     *
     * Como nosotros sabemos que estas
     * claves pertenecen al objeto
     * ReporteVentaDetalle, hacemos
     * el tipado explícito.
     */

    const columnas =
      Object.keys(
        ventas[0]
      ) as Array<
        keyof ReporteVentaDetalle
      >;


    /*
    |--------------------------------------------------------------------------
    | Encabezados
    |--------------------------------------------------------------------------
    */

    const encabezados =
      columnas
        .map(
          columna =>
            this.escaparCsv(
              this.formatearEncabezado(
                String(
                  columna
                )
              )
            )
        )
        .join(',');


    /*
    |--------------------------------------------------------------------------
    | Filas
    |--------------------------------------------------------------------------
    */

    const filas =
      ventas.map(
        venta =>

          columnas
            .map(
              columna =>

                this.escaparCsv(
                  this.formatearValor(
                    venta[columna]
                  )
                )
            )
            .join(',')
      );


    /*
    |--------------------------------------------------------------------------
    | Resultado final
    |--------------------------------------------------------------------------
    */

    return [

      'REPORTE DE VENTAS',

      `Desde,${this.escaparCsv(desde)}`,

      `Hasta,${this.escaparCsv(hasta)}`,

      '',

      encabezados,

      ...filas

    ].join('\r\n');
  }


  /*
  |--------------------------------------------------------------------------
  | Validación del rango
  |--------------------------------------------------------------------------
  */

  private validarRangoFechas(
    desde: string,
    hasta: string
  ): void {

    this.validarFecha(
      desde
    );


    this.validarFecha(
      hasta
    );


    const fechaDesde =
      new Date(
        `${desde}T00:00:00`
      );


    const fechaHasta =
      new Date(
        `${hasta}T00:00:00`
      );


    if (
      fechaDesde.getTime() >
      fechaHasta.getTime()
    ) {

      throw new Error(
        'RANGO_FECHAS_INVALIDO'
      );
    }


    /*
     * Evitamos rangos demasiado grandes.
     *
     * Máximo permitido: 366 días.
     */

    const diferenciaMs =
      fechaHasta.getTime() -
      fechaDesde.getTime();


    const diferenciaDias =
      diferenciaMs /
      (
        1000 *
        60 *
        60 *
        24
      );


    if (
      diferenciaDias > 366
    ) {

      throw new Error(
        'RANGO_FECHAS_MUY_GRANDE'
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Validar fecha YYYY-MM-DD
  |--------------------------------------------------------------------------
  */

  private validarFecha(
    fecha: string
  ): void {

    if (
      typeof fecha !==
        'string'
    ) {

      throw new Error(
        'FECHA_INVALIDA'
      );
    }


    const regex =
      /^\d{4}-\d{2}-\d{2}$/;


    if (
      !regex.test(
        fecha
      )
    ) {

      throw new Error(
        'FECHA_INVALIDA'
      );
    }


    const [
      anio,
      mes,
      dia
    ] =
      fecha
        .split('-')
        .map(Number);


    const fechaValidada =
      new Date(
        anio,
        mes - 1,
        dia
      );


    if (
      fechaValidada.getFullYear()
        !== anio ||

      fechaValidada.getMonth()
        !== mes - 1 ||

      fechaValidada.getDate()
        !== dia
    ) {

      throw new Error(
        'FECHA_INVALIDA'
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Formatear encabezados
  |--------------------------------------------------------------------------
  |
  | Ejemplo:
  |
  | codigo_venta
  |
  | pasa a:
  |
  | Codigo Venta
  |--------------------------------------------------------------------------
  */

  private formatearEncabezado(
    nombre: string
  ): string {

    return nombre
      .replace(
        /_/g,
        ' '
      )
      .replace(
        /\b\w/g,
        letra =>
          letra.toUpperCase()
      );
  }


  /*
  |--------------------------------------------------------------------------
  | Formatear valores
  |--------------------------------------------------------------------------
  */

  private formatearValor(
    valor: unknown
  ): string {

    if (
      valor === null ||
      valor === undefined
    ) {

      return '';
    }


    /*
     * Fechas obtenidas directamente
     * como objetos Date.
     */

    if (
      valor instanceof Date
    ) {

      return valor
        .toISOString();
    }


    /*
     * Booleanos.
     */

    if (
      typeof valor ===
      'boolean'
    ) {

      return valor
        ? 'Sí'
        : 'No';
    }


    /*
     * Resto de valores:
     *
     * number
     * string
     * decimal de MySQL
     * etc.
     */

    return String(
      valor
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Escapar valores CSV
  |--------------------------------------------------------------------------
  */

  private escaparCsv(
    valor: unknown
  ): string {

    let texto =
      String(
        valor ?? ''
      );


    /*
     * Protección contra CSV Injection.
     *
     * Evitamos que Excel interprete
     * textos como:
     *
     * =SUM(...)
     * +CMD
     * -CMD
     * @CMD
     *
     * como fórmulas.
     */

    if (
      /^[=+\-@]/.test(
        texto
      )
    ) {

      texto =
        `'${texto}`;
    }


    /*
     * Una comilla dentro de CSV
     * debe duplicarse.
     *
     * Ejemplo:
     *
     * Producto "Especial"
     *
     * pasa a:
     *
     * Producto ""Especial""
     */

    texto =
      texto.replace(
        /"/g,
        '""'
      );


    /*
     * Siempre encerramos el valor
     * entre comillas.
     */

    return `"${texto}"`;
  }
}