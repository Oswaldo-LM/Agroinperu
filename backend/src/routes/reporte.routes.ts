import {
  Router
} from 'express';

import {
  obtenerReporteVentas,
  exportarReporteVentasCsv
} from '../controllers/reporte.controller';

import {
  soloAdmin,
  verificarToken
} from '../middlewares/auth.middleware';


const router =
  Router();


/*
|--------------------------------------------------------------------------
| Reportes financieros: solo ADMIN
|--------------------------------------------------------------------------
*/

router.use(
  verificarToken,
  soloAdmin
);


router.get(
  '/ventas',
  obtenerReporteVentas
);

router.get(
  '/ventas/csv',
  verificarToken,
  soloAdmin,
  exportarReporteVentasCsv
);


router.get(
  '/ventas',
  verificarToken,
  soloAdmin,
  obtenerReporteVentas
);


export default router;