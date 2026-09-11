import {
  Router
} from 'express';

import {
  aprobarPago,
  listarPagosCliente,
  rechazarPago,
  registrarPagoWeb,
  listarPagosVentaInterno
} from '../controllers/pago.controller';

import {
  soloClientes,
  soloUsuarios,
  verificarToken
} from '../middlewares/auth.middleware';


const router =
  Router();


/*
|--------------------------------------------------------------------------
| CLIENTE
|--------------------------------------------------------------------------
*/

router.post(
  '/web',
  verificarToken,
  soloClientes,
  registrarPagoWeb
);


router.get(
  '/venta/:ventaId',
  verificarToken,
  soloClientes,
  listarPagosCliente
);


/*
|--------------------------------------------------------------------------
| ADMIN / CAJERO
|--------------------------------------------------------------------------
*/

router.put(
  '/:id/aprobar',
  verificarToken,
  soloUsuarios,
  aprobarPago
);


router.put(
  '/:id/rechazar',
  verificarToken,
  soloUsuarios,
  rechazarPago
);

router.get(
  '/admin/venta/:ventaId',
  verificarToken,
  soloUsuarios,
  listarPagosVentaInterno
);


export default router;