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
  ActualizarProductoDto,
  CrearProductoDto,
  ProductoResponse,
  ProductosResponse
} from '../../models/producto.model';


@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    `${environment.apiUrl}/productos`;


  listar():
    Observable<ProductosResponse> {

    return this.http
      .get<ProductosResponse>(
        this.apiUrl
      );
  }


  obtenerPorId(
    id: number
  ): Observable<ProductoResponse> {

    return this.http
      .get<ProductoResponse>(
        `${this.apiUrl}/${id}`
      );
  }


  crear(
    datos: CrearProductoDto
  ): Observable<ProductoResponse> {

    return this.http
      .post<ProductoResponse>(
        this.apiUrl,
        datos
      );
  }


  actualizar(
    id: number,
    datos: ActualizarProductoDto
  ): Observable<ProductoResponse> {

    return this.http
      .put<ProductoResponse>(
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

  obtenerPorCodigoBarras(
  codigo: string
): Observable<ProductoResponse> {

  return this.http
    .get<ProductoResponse>(
      `${this.apiUrl}/codigo-barras/${encodeURIComponent(codigo)}`
    );
}
}