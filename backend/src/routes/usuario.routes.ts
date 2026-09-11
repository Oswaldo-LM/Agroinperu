import {
  Router
} from 'express';

import {
  actualizarUsuario,
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


export default router;