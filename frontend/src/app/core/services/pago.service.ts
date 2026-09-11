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
  OperacionPagoResponse,
  PagosResponse
} from '../../models/pago.model';


@Injectable({
  providedIn: 'root'
})
export class PagoService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    `${environment.apiUrl}/pagos`;


  listarVenta(
    ventaId: number
  ): Observable<PagosResponse> {

    return this.http
      .get<PagosResponse>(
        `${this.apiUrl}/admin/venta/${ventaId}`
      );
  }


  aprobar(
    pagoId: number
  ): Observable<OperacionPagoResponse> {

    return this.http
      .put<OperacionPagoResponse>(
        `${this.apiUrl}/${pagoId}/aprobar`,
        {}
      );
  }


  rechazar(
    pagoId: number
  ): Observable<OperacionPagoResponse> {

    return this.http
      .put<OperacionPagoResponse>(
        `${this.apiUrl}/${pagoId}/rechazar`,
        {}
      );
  }
}