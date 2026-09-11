import express, {
  Application,
  Request,
  Response
} from 'express';

import cors
  from 'cors';

import {
  corsOptions
} from './config/cors';


import authRoutes
  from './routes/auth.routes';

import publicRoutes
  from './routes/public.routes';

import clienteRoutes
  from './routes/cliente.routes';

import usuarioRoutes
  from './routes/usuario.routes';

import categoriaRoutes
  from './routes/categoria.routes';

import productoRoutes
  from './routes/producto.routes';

import carritoRoutes
  from './routes/carrito.routes';

import ventaRoutes
  from './routes/venta.routes';

import pagoRoutes
  from './routes/pago.routes';

import comprobanteRoutes
  from './routes/comprobante.routes';

import inventarioRoutes
  from './routes/inventario.routes';

import dashboardRoutes
  from './routes/dashboard.routes';

import reporteRoutes
  from './routes/reporte.routes';


import {
  rutaNoEncontrada
} from './middlewares/not-found.middleware';

import {
  manejarErrorGlobal
} from './middlewares/error.middleware';

import proformaRoutes
  from './routes/proforma.routes';

import devolucionRoutes
  from './routes/devolucion.routes';

import cajaRoutes
  from './routes/caja.routes'


const app:
  Application =
    express();


/*
|--------------------------------------------------------------------------
| Configuración general
|--------------------------------------------------------------------------
*/

app.disable(
  'x-powered-by'
);


app.use(
  cors(
    corsOptions
  )
);


app.use(
  express.json({
    limit: '1mb'
  })
);


app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb'
  })
);


/*
|--------------------------------------------------------------------------
| Health check
|--------------------------------------------------------------------------
*/

app.get(
  '/api/health',

  (
    req: Request,
    res: Response
  ) => {

    res.status(200).json({

      success: true,

      message:
        'API de AGROINPERU funcionando correctamente'
    });
  }
);


/*
|--------------------------------------------------------------------------
| Rutas
|--------------------------------------------------------------------------
*/

app.use(
  '/api/public',
  publicRoutes
);


app.use(
  '/api/auth',
  authRoutes
);


app.use(
  '/api/clientes',
  clienteRoutes
);


app.use(
  '/api/usuarios',
  usuarioRoutes
);


app.use(
  '/api/categorias',
  categoriaRoutes
);


app.use(
  '/api/productos',
  productoRoutes
);


app.use(
  '/api/carrito',
  carritoRoutes
);


app.use(
  '/api/ventas',
  ventaRoutes
);


app.use(
  '/api/pagos',
  pagoRoutes
);


app.use(
  '/api/comprobantes',
  comprobanteRoutes
);


app.use(
  '/api/inventario',
  inventarioRoutes
);


app.use(
  '/api/dashboard',
  dashboardRoutes
);


app.use(
  '/api/reportes',
  reporteRoutes
);

app.use(
  '/api/proformas',
  proformaRoutes
);

app.use(
  '/api/devoluciones',
  devolucionRoutes
);

app.use(
  '/api/caja',
  cajaRoutes
);
/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
|
| SIEMPRE después de todas las rutas.
|--------------------------------------------------------------------------
*/

app.use(
  rutaNoEncontrada
);


/*
|--------------------------------------------------------------------------
| Errores globales
|--------------------------------------------------------------------------
|
| SIEMPRE al final.
|--------------------------------------------------------------------------
*/

app.use(
  manejarErrorGlobal
);


export default app;