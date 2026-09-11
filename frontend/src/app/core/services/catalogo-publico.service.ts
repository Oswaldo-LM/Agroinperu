import {
  inject,
  Injectable
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';

import {
  CategoriasPublicasResponse,
  ProductosPublicosResponse
} from '../../models/catalogo-publico.model';


@Injectable({
  providedIn: 'root'
})
export class CatalogoPublicoService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    `${environment.apiUrl}/public`;


  listarCategorias():
    Observable<CategoriasPublicasResponse> {

    return this.http
      .get<CategoriasPublicasResponse>(
        `${this.apiUrl}/categorias`
      );
  }


  listarProductos():
    Observable<ProductosPublicosResponse> {

    return this.http
      .get<ProductosPublicosResponse>(
        `${this.apiUrl}/productos`
      );
  }
}