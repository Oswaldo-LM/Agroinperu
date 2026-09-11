import {
  Router
} from 'express';

import {
  crearDevolucion,
  listarDevoluciones,
  obtenerDevolucion,
  obtenerProductosDevolvibles,
  listarVentasEntregadas
} from '../controllers/devolucion.controller';

import {
  soloAdmin,
  soloUsuarios,
  verificarToken
} from '../middlewares/auth.middleware';


const router =
  Router();


router.get(
  '/',
  verificarToken,
  soloUsuarios,
  listarDevoluciones
);


router.get(
  '/venta/:ventaId/productos',
  verificarToken,
  soloUsuarios,
  obtenerProductosDevolvibles
);

router.get(
  '/ventas-entregadas',
  verificarToken,
  soloUsuarios,
  listarVentasEntregadas
);

router.get(
  '/:id',
  verificarToken,
  soloUsuarios,
  obtenerDevolucion
);


/*
 * Registrar una devolución modifica
 * inventario, por eso la dejamos
 * únicamente para ADMIN.
 */
router.post(
  '/',
  verificarToken,
  soloAdmin,
  crearDevolucion
);


export default router;