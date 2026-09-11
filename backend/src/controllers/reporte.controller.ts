import {
  Response
} from 'express';

import {
  AuthRequest
} from '../middlewares/auth.middleware';

import {
  ReporteService
} from '../services/reporte.service';


const reporteService =
  new ReporteService();


/*
|--------------------------------------------------------------------------
| Reporte JSON
|--------------------------------------------------------------------------
*/

export async function obtenerReporteVentas(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const desde =
      String(
        req.query.desde ?? ''
      );


    const hasta =
      String(
        req.query.hasta ?? ''
      );


    const reporte =
      await reporteService
        .obtenerReporteVentas(
          desde,
          hasta
        );


    res.status(200).json({

      success: true,

      data:
        reporte
    });


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


/*
|--------------------------------------------------------------------------
| Exportar CSV
|--------------------------------------------------------------------------
*/

export async function exportarReporteVentasCsv(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const desde =
      String(
        req.query.desde ?? ''
      );


    const hasta =
      String(
        req.query.hasta ?? ''
      );


    const csv =
      await reporteService
        .exportarVentasCsv(
          desde,
          hasta
        );


    const nombreArchivo =
      `reporte-ventas-${desde}-${hasta}.csv`;


    res.setHeader(
      'Content-Type',
      'text/csv; charset=utf-8'
    );


    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${nombreArchivo}"`
    );


    /*
     * BOM UTF-8.
     *
     * Ayuda a que Excel reconozca
     * correctamente tildes, ñ, etc.
     */
    res.status(200).send(
      '\uFEFF' +
      csv
    );


  } catch (error) {

    manejarError(
      error,
      res
    );
  }
}


/*
|--------------------------------------------------------------------------
| Manejo de errores
|--------------------------------------------------------------------------
*/

function manejarError(
  error: unknown,
  res: Response
): void {

  if (
    !(error instanceof Error)
  ) {

    res.status(500).json({

      success: false,

      message:
        'Error interno del servidor'
    });

    return;
  }


  const errores400 = [

    'FECHA_INVALIDA',

    'RANGO_FECHAS_INVALIDO',

    'RANGO_FECHAS_MUY_GRANDE'
  ];


  if (
    errores400.includes(
      error.message
    )
  ) {

    res.status(400).json({

      success: false,

      message:
        error.message
    });

    return;
  }


  console.error(
    'Error en reportes:',
    error
  );


  res.status(500).json({

    success: false,

    message:
      'Error interno del servidor'
  });
}