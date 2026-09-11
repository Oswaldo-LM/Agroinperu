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
  CrearDevolucionDto,
  DevolucionResponse,
  DevolucionesResponse,
  ProductosDevolviblesResponse,
  VentasEntregadasResponse
} from '../../models/devolucion.model';


@Injectable({
  providedIn: 'root'
})
export class DevolucionService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    `${environment.apiUrl}/devoluciones`;


  listar():
    Observable<DevolucionesResponse> {

    return this.http
      .get<DevolucionesResponse>(
        this.apiUrl
      );
  }


  listarVentasEntregadas(
    buscar = ''
  ): Observable<VentasEntregadasResponse> {

    let params =
      new HttpParams();


    if (
      buscar.trim()
    ) {

      params =
        params.set(
          'buscar',
          buscar.trim()
        );
    }


    return this.http
      .get<VentasEntregadasResponse>(
        `${this.apiUrl}/ventas-entregadas`,
        {
          params
        }
      );
  }


  productosDevolvibles(
    ventaId: number
  ): Observable<ProductosDevolviblesResponse> {

    return this.http
      .get<ProductosDevolviblesResponse>(
        `${this.apiUrl}/venta/${ventaId}/productos`
      );
  }


  crear(
    datos: CrearDevolucionDto
  ): Observable<DevolucionResponse> {

    return this.http
      .post<DevolucionResponse>(
        this.apiUrl,
        datos
      );
  }


  obtenerPorId(
    id: number
  ): Observable<DevolucionResponse> {

    return this.http
      .get<DevolucionResponse>(
        `${this.apiUrl}/${id}`
      );
  }
}