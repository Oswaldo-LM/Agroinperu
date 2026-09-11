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
  ConfirmarVentaWebResponse
} from '../../models/carrito.model';


@Injectable({
  providedIn: 'root'
})
export class VentaWebService {

  private readonly http =
    inject(HttpClient);


  confirmarCompra():
    Observable<ConfirmarVentaWebResponse> {

    return this.http
      .post<ConfirmarVentaWebResponse>(
        `${environment.apiUrl}/ventas/web/confirmar`,
        {}
      );
  }
}