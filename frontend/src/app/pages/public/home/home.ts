import {
  Component,
  HostListener,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  DecimalPipe
} from '@angular/common';

import {
  HealthService
} from '../../../core/services/health.service';

import {
  CatalogoPublicoService
} from '../../../core/services/catalogo-publico.service';

import {
  AuthService
} from '../../../core/services/auth.service';

import {
  CarritoService
} from '../../../core/services/carrito.service';

import {
  CategoriaPublica,
  ProductoPublico
} from '../../../models/catalogo-publico.model';


@Component({
  selector:
    'app-home',

  imports: [
    RouterLink,
    DecimalPipe
  ],

  templateUrl:
    './home.html',

  styleUrl:
    './home.css'
})
export class Home
  implements OnInit {

  private readonly healthService =
    inject(HealthService);

  private readonly catalogoService =
    inject(CatalogoPublicoService);

  private readonly carritoService =
    inject(CarritoService);

  readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);


  readonly apiConectada =
    signal(false);

  readonly categorias =
    signal<CategoriaPublica[]>([]);

  readonly productosDestacados =
    signal<ProductoPublico[]>([]);

  readonly cargandoCatalogo =
    signal(true);

  readonly agregandoProducto =
    signal<number | null>(null);

  readonly mensajeExito =
    signal<string | null>(null);

  readonly errorOperacion =
    signal<string | null>(null);

  /* Señal que controla si el usuario ha hecho scroll hacia abajo */
  readonly scrolled =
    signal(false);


  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      const offset = window.scrollY || document.documentElement.scrollTop || 0;
      // Histeresis suave para evitar parpadeos y permitir leer arriba con libertad
      if (this.scrolled()) {
        if (offset <= 20) {
          this.scrolled.set(false);
        }
      } else {
        if (offset > 80) {
          this.scrolled.set(true);
        }
      }
    }
  }


  bajarSeccion(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 480,
        behavior: 'smooth'
      });
    }
  }


  ngOnInit(): void {

    this.healthService
      .verificar()
      .subscribe({

        next: respuesta => {

          this.apiConectada.set(
            respuesta.success
          );
        },

        error: () => {

          this.apiConectada.set(
            false
          );
        }
      });

    this.cargarDatosHome();
  }


  private cargarDatosHome(): void {

    this.cargandoCatalogo.set(true);

    let categoriasListas = false;
    let productosListos = false;

    const finalizar = () => {

      if (
        categoriasListas &&
        productosListos
      ) {

        this.cargandoCatalogo.set(
          false
        );
      }
    };

    this.catalogoService
      .listarCategorias()
      .subscribe({

        next: respuesta => {

          this.categorias.set(
            respuesta.data
          );

          categoriasListas = true;
          finalizar();
        },

        error: () => {
          categoriasListas = true;
          finalizar();
        }
      });

    this.catalogoService
      .listarProductos()
      .subscribe({

        next: respuesta => {

          this.productosDestacados.set(
            respuesta.data.slice(0, 6)
          );

          productosListos = true;
          finalizar();
        },

        error: () => {
          productosListos = true;
          finalizar();
        }
      });
  }


  agregarAlCarrito(producto: ProductoPublico): void {

    this.errorOperacion.set(null);
    this.mensajeExito.set(null);

    if (!this.authService.esCliente()) {

      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/' }
      });

      return;
    }

    if (Number(producto.stock_disponible) <= 0) {

      this.errorOperacion.set('Este producto no cuenta con stock disponible en este momento.');
      return;
    }

    this.agregandoProducto.set(producto.id_producto);

    this.carritoService
      .agregarProducto(producto.id_producto, 1)
      .subscribe({

        next: respuesta => {

          this.agregandoProducto.set(null);
          this.mensajeExito.set(
            respuesta.message ?? `"${producto.nombre}" ha sido agregado a tu carrito.`
          );

          setTimeout(() => {
            this.mensajeExito.set(null);
          }, 4000);
        },

        error: error => {

          this.agregandoProducto.set(null);

          if (error.status === 401 || error.status === 403) {

            this.router.navigate(['/login'], {
              queryParams: { returnUrl: '/' }
            });

            return;
          }

          this.errorOperacion.set(
            error.error?.message ?? 'No se pudo agregar el producto al carrito.'
          );

          setTimeout(() => {
            this.errorOperacion.set(null);
          }, 4000);
        }
      });
  }
}
