import {
  Router
} from 'express';

import {
  anularProforma,
  crearProforma,
  listarProformas,
  obtenerProforma
} from '../controllers/proforma.controller';

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
  listarProformas
);


router.get(
  '/:id',
  verificarToken,
  soloUsuarios,
  obtenerProforma
);


router.post(
  '/',
  verificarToken,
  soloUsuarios,
  crearProforma
);


router.put(
  '/:id/anular',
  verificarToken,
  soloAdmin,
  anularProforma
);


export default router;