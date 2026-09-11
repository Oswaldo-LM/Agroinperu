import {
  Router
} from 'express';

import {
  abrirCaja,
  cerrarCaja,
  historialCaja,
  historialCajaGeneral,
  obtenerCajaActual
} from '../controllers/caja.controller';

import {
  soloAdmin,
  soloUsuarios,
  verificarToken
} from '../middlewares/auth.middleware';


const router =
  Router();


router.get(
  '/actual',
  verificarToken,
  soloUsuarios,
  obtenerCajaActual
);


router.post(
  '/abrir',
  verificarToken,
  soloUsuarios,
  abrirCaja
);


router.post(
  '/cerrar',
  verificarToken,
  soloUsuarios,
  cerrarCaja
);


router.get(
  '/historial',
  verificarToken,
  soloUsuarios,
  historialCaja
);


router.get(
  '/admin/historial',
  verificarToken,
  soloAdmin,
  historialCajaGeneral
);


export default router;