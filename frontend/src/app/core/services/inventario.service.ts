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
  InventarioResultadoResponse,
  MovimientosResponse,
  RegistrarAjusteDto,
  RegistrarEntradaDto
} from '../../models/inventario.model';


@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    `${environment.apiUrl}/inventario`;


  registrarEntrada(
    datos: RegistrarEntradaDto
  ): Observable<InventarioResultadoResponse> {

    return this.http
      .post<InventarioResultadoResponse>(
        `${this.apiUrl}/entradas`,
        datos
      );
  }


  registrarAjuste(
    datos: RegistrarAjusteDto
  ): Observable<InventarioResultadoResponse> {

    return this.http
      .post<InventarioResultadoResponse>(
        `${this.apiUrl}/ajustes`,
        datos
      );
  }


  listarMovimientos(
    productoId?: number
  ): Observable<MovimientosResponse> {

    let params =
      new HttpParams();


    if (
      productoId !== undefined
    ) {

      params =
        params.set(
          'producto_id',
          productoId.toString()
        );
    }


    return this.http
      .get<MovimientosResponse>(
        `${this.apiUrl}/movimientos`,
        {
          params
        }
      );
  }
}