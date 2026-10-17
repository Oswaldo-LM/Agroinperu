import {
  Router
} from 'express';

import {
  actualizarUsuario,
  activarUsuario,
  cambiarPasswordUsuario,
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
  obtenerUsuario
} from '../controllers/usuario.controller';

import {
  soloAdmin,
  verificarToken
} from '../middlewares/auth.middleware';


const router =
  Router();


/*
|--------------------------------------------------------------------------
| Todo el módulo es solo ADMIN
|--------------------------------------------------------------------------
*/

router.use(
  verificarToken,
  soloAdmin
);


router.get(
  '/',
  listarUsuarios
);


router.get(
  '/:id',
  obtenerUsuario
);


router.post(
  '/',
  crearUsuario
);


router.put(
  '/:id',
  actualizarUsuario
);


router.put(
  '/:id/password',
  cambiarPasswordUsuario
);


router.delete(
  '/:id',
  eliminarUsuario
);

router.patch(
  '/:id/activar',
  activarUsuario
);

router.put(
  '/:id/activar',
  activarUsuario
);


export default router;