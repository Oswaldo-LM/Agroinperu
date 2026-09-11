import {
  Response
} from 'express';

import {
  AuthRequest
} from '../middlewares/auth.middleware';

import {
  DashboardService
} from '../services/dashboard.service';


const dashboardService =
  new DashboardService();


export async function obtenerResumenDashboard(
  req: AuthRequest,
  res: Response
): Promise<void> {

  try {

    const resumen =
      await dashboardService
        .obtenerResumen();


    res.status(200).json({

      success: true,

      data:
        resumen
    });


  } catch (error) {

    console.error(error);


    res.status(500).json({

      success: false,

      message:
        'Error interno del servidor'
    });
  }
}