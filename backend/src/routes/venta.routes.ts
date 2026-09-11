import {
  Router
} from 'express';

import {
  anularVentaWeb,
  cambiarEstadoVentaWeb,
  confirmarVentaWeb,
  crearVentaTienda,
  listarVentasWeb,
  obtenerVentaWeb,
  reembolsarVentaWeb,
  listarMisPedidos,
  obtenerMiPedido
} from '../controllers/venta.controller';

import {
  soloClientes,
  soloUsuarios,
  verificarToken,
  soloAdmin
} from '../middlewares/auth.middleware';


const router =
  Router();


/*
|--------------------------------------------------------------------------
| CLIENTE
|--------------------------------------------------------------------------
*/

router.post(
  '/web/confirmar',

  verificarToken,

  soloClientes,

  confirmarVentaWeb
);

router.get(
  '/web/mis-pedidos',
  verificarToken,
  soloClientes,
  listarMisPedidos
);


router.get(
  '/web/mis-pedidos/:id',
  verificarToken,
  soloClientes,
  obtenerMiPedido
);

/*
|--------------------------------------------------------------------------
| ADMIN / CAJERO
|--------------------------------------------------------------------------
*/

router.get(
  '/web',

  verificarToken,

  soloUsuarios,

  listarVentasWeb
);


router.get(
  '/web/:id',

  verificarToken,

  soloUsuarios,

  obtenerVentaWeb
);


router.put(
  '/web/:id/estado',

  verificarToken,

  soloUsuarios,

  cambiarEstadoVentaWeb
);


router.put(
  '/web/:id/anular',

  verificarToken,

  soloUsuarios,

  anularVentaWeb
);

router.post(
  '/web/:id/reembolsar',

  verificarToken,

  soloUsuarios,

  reembolsarVentaWeb
);

router.put(
  '/web/:id/reembolsar',

  verificarToken,

  soloAdmin,

  reembolsarVentaWeb
);

router.post(
  '/tienda',
  verificarToken,
  soloUsuarios,
  crearVentaTienda
);



export default router;