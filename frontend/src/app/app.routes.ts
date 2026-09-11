import {
  Routes
} from '@angular/router';

import {
  adminGuard,
  clienteGuard,
  usuarioGuard
} from './core/guards/auth.guard';


export const routes:
  Routes = [

  /*
  |--------------------------------------------------------------------------
  | SITIO PÚBLICO
  |--------------------------------------------------------------------------
  */

  {
    path: '',

    loadComponent:
      () =>
        import(
          './layouts/public-layout/public-layout'
        )
          .then(
            m =>
              m.PublicLayout
          ),

    children: [

      /*
      |--------------------------------------------------------------------------
      | Inicio
      |--------------------------------------------------------------------------
      */

      {
        path: '',

        loadComponent:
          () =>
            import(
              './pages/public/home/home'
            )
              .then(
                m =>
                  m.Home
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Catálogo
      |--------------------------------------------------------------------------
      */

      {
        path: 'catalogo',

        loadComponent:
          () =>
            import(
              './pages/public/catalogo/catalogo'
            )
              .then(
                m =>
                  m.Catalogo
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Login cliente
      |--------------------------------------------------------------------------
      */

      {
        path: 'login',

        loadComponent:
          () =>
            import(
              './pages/auth/login-cliente/login-cliente'
            )
              .then(
                m =>
                  m.LoginCliente
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Registro cliente
      |--------------------------------------------------------------------------
      */

      {
        path: 'registro',

        loadComponent:
          () =>
            import(
              './pages/auth/registro-cliente/registro-cliente'
            )
              .then(
                m =>
                  m.RegistroCliente
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Cuenta del cliente
      |--------------------------------------------------------------------------
      */

      {
        path:
          'cliente/cuenta',

        canActivate: [
          clienteGuard
        ],

        loadComponent:
          () =>
            import(
              './pages/client/cuenta/cuenta'
            )
              .then(
                m =>
                  m.Cuenta
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Mis pedidos
      |--------------------------------------------------------------------------
      */

      {
        path:
          'cliente/pedidos',

        canActivate: [
          clienteGuard
        ],

        loadComponent:
          () =>
            import(
              './pages/client/mis-pedidos/mis-pedidos'
            )
              .then(
                m =>
                  m.MisPedidos
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Pago web
      |--------------------------------------------------------------------------
      */

      {
        path:
          'cliente/pago/:ventaId',

        canActivate: [
          clienteGuard
        ],

        loadComponent:
          () =>
            import(
              './pages/client/pago-web/pago-web'
            )
              .then(
                m =>
                  m.PagoWeb
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Carrito
      |--------------------------------------------------------------------------
      */

      {
        path:
          'carrito',

        canActivate: [
          clienteGuard
        ],

        loadComponent:
          () =>
            import(
              './pages/client/carrito/carrito'
            )
              .then(
                m =>
                  m.CarritoComponent
              )
      }

    ]
  },


  /*
  |--------------------------------------------------------------------------
  | LOGIN ADMIN / CAJERO
  |--------------------------------------------------------------------------
  */

  {
    path:
      'admin/login',

    loadComponent:
      () =>
        import(
          './pages/auth/login-personal/login-personal'
        )
          .then(
            m =>
              m.LoginPersonal
          )
  },


  /*
  |--------------------------------------------------------------------------
  | ADMINISTRACIÓN
  |--------------------------------------------------------------------------
  */

  {
    path:
      'admin',

    canActivate: [
      usuarioGuard
    ],

    loadComponent:
      () =>
        import(
          './layouts/admin-layout/admin-layout'
        )
          .then(
            m =>
              m.AdminLayout
          ),

    children: [

      /*
      |--------------------------------------------------------------------------
      | Dashboard
      |--------------------------------------------------------------------------
      */

      {
        path: '',

        loadComponent:
          () =>
            import(
              './pages/admin/dashboard/dashboard'
            )
              .then(
                m =>
                  m.Dashboard
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Caja
      |--------------------------------------------------------------------------
      */

      {
        path:
          'caja',

        loadComponent:
          () =>
            import(
              './pages/admin/caja/caja'
            )
              .then(
                m =>
                  m.Caja
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Venta presencial
      |--------------------------------------------------------------------------
      */

      {
        path:
          'venta-tienda',

        loadComponent:
          () =>
            import(
              './pages/admin/venta-tienda/venta-tienda'
            )
              .then(
                m =>
                  m.VentaTienda
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Pedidos web
      |--------------------------------------------------------------------------
      */

      {
        path:
          'pedidos-web',

        loadComponent:
          () =>
            import(
              './pages/admin/pedidos-web/pedidos-web'
            )
              .then(
                m =>
                  m.PedidosWeb
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Clientes
      |--------------------------------------------------------------------------
      */

      {
        path:
          'clientes',

        loadComponent:
          () =>
            import(
              './pages/admin/clientes/clientes'
            )
              .then(
                m =>
                  m.Clientes
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Categorías
      |--------------------------------------------------------------------------
      */

      {
        path:
          'categorias',

        canActivate: [
          adminGuard
        ],

        loadComponent:
          () =>
            import(
              './pages/admin/categorias/categorias'
            )
              .then(
                m =>
                  m.Categorias
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Inventario
      |--------------------------------------------------------------------------
      */

      {
        path:
          'inventario',

        canActivate: [
          adminGuard
        ],

        loadComponent:
          () =>
            import(
              './pages/admin/inventario/inventario'
            )
              .then(
                m =>
                  m.Inventario
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Productos
      |--------------------------------------------------------------------------
      */

      {
        path:
          'productos',

        canActivate: [
          adminGuard
        ],

        loadComponent:
          () =>
            import(
              './pages/admin/productos/productos'
            )
              .then(
                m =>
                  m.Productos
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Usuarios
      |--------------------------------------------------------------------------
      */

      {
        path:
          'usuarios',

        canActivate: [
          adminGuard
        ],

        loadComponent:
          () =>
            import(
              './pages/admin/usuarios/usuarios'
            )
              .then(
                m =>
                  m.Usuarios
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Proformas
      |--------------------------------------------------------------------------
      */

      {
        path:
          'proformas',

        loadComponent:
          () =>
            import(
              './pages/admin/proformas/proformas'
            )
              .then(
                m =>
                  m.Proformas
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Devoluciones
      |--------------------------------------------------------------------------
      */

      {
        path:
          'devoluciones',

        loadComponent:
          () =>
            import(
              './pages/admin/devoluciones/devoluciones'
            )
              .then(
                m =>
                  m.Devoluciones
              )
      },


      /*
      |--------------------------------------------------------------------------
      | Reportes
      |--------------------------------------------------------------------------
      */

      {
        path:
          'reportes',

        canActivate: [
          adminGuard
        ],

        loadComponent:
          () =>
            import(
              './pages/admin/reportes/reportes'
            )
              .then(
                m =>
                  m.Reportes
              )
      }

    ]
  },


  /*
  |--------------------------------------------------------------------------
  | 404
  |--------------------------------------------------------------------------
  */

  {
    path:
      '**',

    redirectTo:
      ''
  }
];