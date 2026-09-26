import {
  Router
} from 'express';

import {
  soloAdmin,
  verificarToken,
  soloUsuarios
} from '../middlewares/auth.middleware';

import {
  actualizarProducto,
  activarProducto,
  crearProducto,
  eliminarProducto,
  listarProductos,
  obtenerProducto,
  obtenerProductoPorCodigo,
  obtenerProductoPorCodigoBarras
} from '../controllers/producto.controller';


const router =
  Router();


/*
|--------------------------------------------------------------------------
| CONSULTA DE PRODUCTOS
|--------------------------------------------------------------------------
| ADMIN y CAJERO
|--------------------------------------------------------------------------
*/


router.get(
  '/',

  verificarToken,

  soloUsuarios,

  listarProductos
);


router.get(
  '/codigo/:codigo',

  verificarToken,

  soloUsuarios,

  obtenerProductoPorCodigo
);


router.get(
  '/codigo-barras/:codigo',

  verificarToken,

  soloUsuarios,

  obtenerProductoPorCodigoBarras
);


router.get(
  '/:id',

  verificarToken,

  soloUsuarios,

  obtenerProducto
);


/*
|--------------------------------------------------------------------------
| ADMINISTRACIÓN DE PRODUCTOS
|--------------------------------------------------------------------------
| Solo ADMIN
|--------------------------------------------------------------------------
*/


router.post(
  '/',

  verificarToken,

  soloAdmin,

  crearProducto
);


router.put(
  '/:id',

  verificarToken,

  soloAdmin,

  actualizarProducto
);


router.delete(
  '/:id',

  verificarToken,

  soloAdmin,

  eliminarProducto
);


router.patch(
  '/:id/activar',

  verificarToken,

  soloAdmin,

  activarProducto
);


export default router;