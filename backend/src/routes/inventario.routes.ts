import {
  Router
} from 'express';

import {
  listarMovimientos,
  registrarAjuste,
  registrarEntrada
} from '../controllers/inventario.controller';

import {
  soloAdmin,
  verificarToken
} from '../middlewares/auth.middleware';


const router =
  Router();


/*
|--------------------------------------------------------------------------
| Todo inventario requiere ADMIN
|--------------------------------------------------------------------------
*/

router.use(
  verificarToken,
  soloAdmin
);


/*
|--------------------------------------------------------------------------
| Entrada de mercadería
|--------------------------------------------------------------------------
*/

router.post(
  '/entradas',
  registrarEntrada
);


/*
|--------------------------------------------------------------------------
| Ajuste manual
|--------------------------------------------------------------------------
*/

router.post(
  '/ajustes',
  registrarAjuste
);


/*
|--------------------------------------------------------------------------
| Historial
|--------------------------------------------------------------------------
*/

router.get(
  '/movimientos',
  listarMovimientos
);


export default router;