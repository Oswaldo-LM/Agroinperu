import {
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  DecimalPipe
} from '@angular/common';

import {
  Router
} from '@angular/router';

import {
  CatalogoPublicoService
} from '../../../core/services/catalogo-publico.service';

import {
  AuthService
} from '../../../core/services/auth.service';

import {
  CategoriaPublica,
  ProductoPublico
} from '../../../models/catalogo-publico.model';

import {
  CarritoService
} from '../../../core/services/carrito.service';


@Component({
  selector:
    'app-catalogo',

  imports: [
    DecimalPipe
  ],

  templateUrl:
    './catalogo.html',

  styleUrl:
    './catalogo.css'
})
export class Catalogo
  implements OnInit {

    private readonly carritoService =
  inject(CarritoService);


readonly agregandoProducto =
  signal<number | null>(
    null
  );


readonly mensaje =
  signal<string | null>(
    null
  );

  private readonly catalogoService =
    inject(
      CatalogoPublicoService
    );


  readonly authService =
    inject(AuthService);


  private readonly router =
    inject(Router);


  readonly productos =
    signal<ProductoPublico[]>(
      []
    );


  readonly categorias =
    signal<CategoriaPublica[]>(
      []
    );


  readonly cargando =
    signal(true);


  readonly error =
    signal<string | null>(
      null
    );


  readonly busqueda =
    signal('');


  readonly categoriaSeleccionada =
    signal<number | null>(
      null
    );


  readonly productosFiltrados =
    computed(
      () => {

        const texto =
          this.busqueda()
            .trim()
            .toLowerCase();


        const categoriaId =
          this.categoriaSeleccionada();


        return this.productos()
          .filter(
            producto => {

              const coincideCategoria =
                categoriaId === null ||
                Number(
                  producto.categoria_id
                ) === categoriaId;


              const coincideTexto =
                !texto ||

                producto.nombre
                  .toLowerCase()
                  .includes(texto) ||

                producto.codigo
                  .toLowerCase()
                  .includes(texto) ||

                (
                  producto.descripcion ??
                  ''
                )
                  .toLowerCase()
                  .includes(texto);


              return (
                coincideCategoria &&
                coincideTexto
              );
            }
          );
      }
    );


  ngOnInit(): void {

    this.cargarCatalogo();
  }


  cargarCatalogo(): void {

    this.cargando.set(
      true
    );


    this.error.set(
      null
    );


    let productosListos =
      false;


    let categoriasListas =
      false;


    const finalizar = () => {

      if (
        productosListos &&
        categoriasListas
      ) {

        this.cargando.set(
          false
        );
      }
    };


    this.catalogoService
      .listarProductos()
      .subscribe({

        next: respuesta => {

          this.productos.set(
            respuesta.data
          );


          productosListos =
            true;


          finalizar();
        },


        error: () => {

          productosListos =
            true;


          this.error.set(
            'No se pudo cargar el catálogo.'
          );


          finalizar();
        }
      });


    this.catalogoService
      .listarCategorias()
      .subscribe({

        next: respuesta => {

          this.categorias.set(
            respuesta.data
          );


          categoriasListas =
            true;


          finalizar();
        },


        error: () => {

          categoriasListas =
            true;


          this.error.set(
            'No se pudieron cargar las categorías.'
          );


          finalizar();
        }
      });
  }


  cambiarBusqueda(
    valor: string
  ): void {

    this.busqueda.set(
      valor
    );
  }


  cambiarCategoria(
    valor: string
  ): void {

    const id =
      Number(valor);


    this.categoriaSeleccionada.set(

      Number.isInteger(id) &&
      id > 0

        ? id

        : null
    );
  }


  nombreCategoria(
    categoriaId: number
  ): string {

    return (
      this.categorias()
        .find(
          categoria =>
            Number(
              categoria.id_categoria
            ) ===
            Number(categoriaId)
        )
        ?.nombre
      ??
      'Sin categoría'
    );
  }

  agregarAlCarrito(
  producto: ProductoPublico
): void {

  this.error.set(
    null
  );


  this.mensaje.set(
    null
  );


  if (
    !this.authService
      .esCliente()
  ) {

    this.router.navigate(
      ['/login'],
      {
        queryParams: {
          returnUrl:
            '/catalogo'
        }
      }
    );


    return;
  }


  if (
    Number(
      producto.stock_disponible
    ) <= 0
  ) {

    this.error.set(
      'El producto no tiene stock disponible.'
    );

    return;
  }


  this.agregandoProducto.set(
    producto.id_producto
  );


  this.carritoService
    .agregarProducto(
      producto.id_producto,
      1
    )
    .subscribe({

      next: respuesta => {

        this.agregandoProducto.set(
          null
        );


        this.mensaje.set(
          respuesta.message ??
          `"${producto.nombre}" fue agregado al carrito.`
        );
      },


      error: error => {

        this.agregandoProducto.set(
          null
        );


        if (
          error.status === 401 ||
          error.status === 403
        ) {

          this.router.navigate(
            ['/login'],
            {
              queryParams: {
                returnUrl:
                  '/catalogo'
              }
            }
          );


          return;
        }


        this.error.set(
          error.error?.message ??
          'No se pudo agregar el producto al carrito.'
        );
      }
    });
}

  


  


    /*
     * En el siguiente paso
     * conectaremos aquí el carrito.
     */
  
}