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
  RegistrarPagoWebDto,
  RegistrarPagoWebResponse,
  PagosResponse
} from '../../models/pago.model';


@Injectable({
  providedIn: 'root'
})
export class PagoWebService {

  private readonly http =
    inject(HttpClient);


  registrarPago(
    datos: RegistrarPagoWebDto
  ): Observable<RegistrarPagoWebResponse> {

    return this.http
      .post<RegistrarPagoWebResponse>(
        `${environment.apiUrl}/pagos/web`,
        datos
      );
  }

  listarPagosVenta(
  ventaId: number
): Observable<PagosResponse> {

  return this.http
    .get<PagosResponse>(
      `${environment.apiUrl}/pagos/web/venta/${ventaId}`
    );
}
}