import {
  Router
} from 'express';

import {
  obtenerResumenDashboard
} from '../controllers/dashboard.controller';

import {
  soloUsuarios,
  verificarToken
} from '../middlewares/auth.middleware';


const router =
  Router();


router.use(
  verificarToken,
  soloUsuarios
);


router.get(
  '/resumen',
  obtenerResumenDashboard
);


export default router;