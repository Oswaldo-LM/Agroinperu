import {
  Router
} from 'express';

import {
  listarCategoriasPublicas,
  listarProductosPublicos,
  obtenerProductoPublico
} from '../controllers/public.controller';


const router =
  Router();


router.get(
  '/categorias',
  listarCategoriasPublicas
);


router.get(
  '/productos',
  listarProductosPublicos
);


router.get(
  '/productos/:id',
  obtenerProductoPublico
);


export default router;