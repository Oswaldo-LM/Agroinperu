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
  MiPedidoResponse,
  MisPedidosResponse
} from '../../models/mis-pedidos.model';


@Injectable({
  providedIn: 'root'
})
export class MisPedidosService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    `${environment.apiUrl}/ventas/web/mis-pedidos`;


  listar():
    Observable<MisPedidosResponse> {

    return this.http
      .get<MisPedidosResponse>(
        this.apiUrl
      );
  }


  obtenerPorId(
    ventaId: number
  ): Observable<MiPedidoResponse> {

    return this.http
      .get<MiPedidoResponse>(
        `${this.apiUrl}/${ventaId}`
      );
  }
}