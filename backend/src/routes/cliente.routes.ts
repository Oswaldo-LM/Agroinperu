import {
  Router
} from 'express';

import {
  soloAdmin,
  soloUsuarios,
  verificarToken
} from '../middlewares/auth.middleware';

import {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
  listarClientes,
  obtenerCliente,
  registrarClienteWeb
} from '../controllers/cliente.controller';


const router = Router();


/*
|--------------------------------------------------------------------------
| Registro público desde la web
|--------------------------------------------------------------------------
*/

router.post(
  '/registro',
  registrarClienteWeb
);


/*
|--------------------------------------------------------------------------
| Administración
|--------------------------------------------------------------------------
*/

router.get(
  '/',
  verificarToken,
  soloUsuarios,
  listarClientes
);

router.get(
  '/:id',
  verificarToken,
  soloUsuarios,
  obtenerCliente
);

router.post(
  '/',
  verificarToken,
  soloAdmin,
  crearCliente
);

router.put(
  '/:id',
  verificarToken,
  soloUsuarios,
  actualizarCliente
);

router.delete(
  '/:id',
  verificarToken,
  soloAdmin,
  eliminarCliente
);


export default router;