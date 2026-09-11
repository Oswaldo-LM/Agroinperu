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
  crearProducto,
  eliminarProducto,
  listarProductos,
  obtenerProducto,
  obtenerProductoPorCodigo,
  obtenerProductoPorCodigoBarras
} from '../controllers/producto.controller';


const router = Router();

router.use(
  verificarToken,
  soloAdmin
);


router.get(
  '/',
  listarProductos
);


router.get(
  '/codigo/:codigo',
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
  obtenerProducto
);


router.post(
  '/',
  crearProducto
);


router.put(
  '/:id',
  actualizarProducto
);


router.delete(
  '/:id',
  eliminarProducto
);


export default router;