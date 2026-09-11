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
  CrearVentaTiendaDto,
  VentaTiendaResponse
} from '../../models/venta-tienda.model';


@Injectable({
  providedIn: 'root'
})
export class VentaTiendaService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    `${environment.apiUrl}/ventas/tienda`;


  registrar(
    datos: CrearVentaTiendaDto
  ): Observable<VentaTiendaResponse> {

    return this.http
      .post<VentaTiendaResponse>(
        this.apiUrl,
        datos
      );
  }
}