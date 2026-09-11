import {
  inject,
  Injectable
} from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';

import {
  EstadoVenta,
  OperacionVentaResponse,
  VentaWebDetalleResponse,
  VentasWebResponse
} from '../../models/pedido-web.model';


@Injectable({
  providedIn: 'root'
})
export class PedidoWebService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    `${environment.apiUrl}/ventas/web`;


  listar(
    estado?: EstadoVenta
  ): Observable<VentasWebResponse> {

    let params =
      new HttpParams();


    if (estado) {

      params =
        params.set(
          'estado',
          estado
        );
    }


    return this.http
      .get<VentasWebResponse>(
        this.apiUrl,
        {
          params
        }
      );
  }


  obtenerPorId(
    ventaId: number
  ): Observable<VentaWebDetalleResponse> {

    return this.http
      .get<VentaWebDetalleResponse>(
        `${this.apiUrl}/${ventaId}`
      );
  }


  cambiarEstado(
    ventaId: number,
    estado: EstadoVenta
  ): Observable<OperacionVentaResponse> {

    return this.http
      .put<OperacionVentaResponse>(
        `${this.apiUrl}/${ventaId}/estado`,
        {
          estado
        }
      );
  }
}