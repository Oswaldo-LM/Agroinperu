import { Router } from 'express';
import {soloAdmin, verificarToken} from '../middlewares/auth.middleware';

import {
  actualizarCategoria,
  activarCategoria,
  crearCategoria,
  eliminarCategoria,
  listarCategorias,
  obtenerCategoria
} from '../controllers/categoria.controller';

const router = Router();

router.use(
  verificarToken,
  soloAdmin
);

router.get('/', listarCategorias);

router.get('/:id', obtenerCategoria);

router.post('/', crearCategoria);

router.put('/:id', actualizarCategoria);

router.delete('/:id', eliminarCategoria);

router.patch('/:id/activar', activarCategoria);

router.put('/:id/activar', activarCategoria);

export default router;