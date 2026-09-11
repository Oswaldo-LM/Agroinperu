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
  CarritoResponse,
  OperacionCarritoResponse
} from '../../models/carrito.model';


@Injectable({
  providedIn: 'root'
})
export class CarritoService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    `${environment.apiUrl}/carrito`;


  obtener():
    Observable<CarritoResponse> {

    return this.http
      .get<CarritoResponse>(
        this.apiUrl
      );
  }


  agregarProducto(
    productoId: number,
    cantidad: number
  ): Observable<OperacionCarritoResponse> {

    return this.http
      .post<OperacionCarritoResponse>(
        `${this.apiUrl}/productos`,
        {
          producto_id:
            productoId,

          cantidad
        }
      );
  }


  actualizarCantidad(
    productoId: number,
    cantidad: number
  ): Observable<OperacionCarritoResponse> {

    return this.http
      .put<OperacionCarritoResponse>(
        `${this.apiUrl}/productos/${productoId}`,
        {
          cantidad
        }
      );
  }


  eliminarProducto(
    productoId: number
  ): Observable<OperacionCarritoResponse> {

    return this.http
      .delete<OperacionCarritoResponse>(
        `${this.apiUrl}/productos/${productoId}`
      );
  }
}