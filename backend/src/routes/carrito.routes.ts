import {
  Router
} from 'express';

import {
  actualizarCantidad,
  agregarProducto,
  eliminarProducto,
  obtenerCarrito,
  vaciarCarrito
} from '../controllers/carrito.controller';

import {
  soloClientes,
  verificarToken
} from '../middlewares/auth.middleware';


const router = Router();


/*
|--------------------------------------------------------------------------
| Todas las rutas requieren CLIENTE autenticado
|--------------------------------------------------------------------------
*/

router.use(
  verificarToken,
  soloClientes
);


router.get(
  '/',
  obtenerCarrito
);


router.post(
  '/productos',
  agregarProducto
);


router.put(
  '/productos/:productoId',
  actualizarCantidad
);


router.delete(
  '/productos/:productoId',
  eliminarProducto
);


router.delete(
  '/',
  vaciarCarrito
);


export default router;