import {
  Router
} from 'express';

import {
  anularComprobante,
  emitirComprobante,
  obtenerComprobante,
  obtenerComprobantesVenta
} from '../controllers/comprobante.controller';

import {
  soloAdmin,
  soloUsuarios,
  verificarToken
} from '../middlewares/auth.middleware';


const router =
  Router();


router.post(
  '/venta/:ventaId',

  verificarToken,

  soloUsuarios,

  emitirComprobante
);


router.get(
  '/venta/:ventaId',

  verificarToken,

  soloUsuarios,

  obtenerComprobantesVenta
);


router.put(
  '/:id/anular',

  verificarToken,

  soloAdmin,

  anularComprobante
);


router.get(
  '/:id',

  verificarToken,

  soloUsuarios,

  obtenerComprobante
);


export default router;