import {
  Router,
  Response
} from 'express';

import {
  loginCliente,
  loginUsuario
} from '../controllers/auth.controller';

import {
  AuthRequest,
  verificarToken
} from '../middlewares/auth.middleware';


const router = Router();


router.post(
  '/clientes/login',
  loginCliente
);


router.post(
  '/usuarios/login',
  loginUsuario
);


router.get(
  '/me',
  verificarToken,
  (
    req: AuthRequest,
    res: Response
  ) => {

    res.status(200).json({
      success: true,
      data: req.auth
    });
  }
);


export default router;