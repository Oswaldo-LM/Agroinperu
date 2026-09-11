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
  ActualizarCategoriaDto,
  CategoriaResponse,
  CategoriasResponse,
  CrearCategoriaDto
} from '../../models/categoria.model';


@Injectable({
  providedIn: 'root'
})
export class CategoriaService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    `${environment.apiUrl}/categorias`;


  listar():
    Observable<CategoriasResponse> {

    return this.http
      .get<CategoriasResponse>(
        this.apiUrl
      );
  }


  obtenerPorId(
    id: number
  ): Observable<CategoriaResponse> {

    return this.http
      .get<CategoriaResponse>(
        `${this.apiUrl}/${id}`
      );
  }


  crear(
    datos: CrearCategoriaDto
  ): Observable<CategoriaResponse> {

    return this.http
      .post<CategoriaResponse>(
        this.apiUrl,
        datos
      );
  }


  actualizar(
    id: number,
    datos: ActualizarCategoriaDto
  ): Observable<CategoriaResponse> {

    return this.http
      .put<CategoriaResponse>(
        `${this.apiUrl}/${id}`,
        datos
      );
  }


  eliminar(
    id: number
  ): Observable<{
    success: boolean;
    message?: string;
  }> {

    return this.http
      .delete<{
        success: boolean;
        message?: string;
      }>(
        `${this.apiUrl}/${id}`
      );
  }
}