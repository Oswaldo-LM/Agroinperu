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
  AbrirCajaDto,
  CajaActualResponse,
  CajaHistorialResponse,
  CajaOperacionResponse,
  CerrarCajaDto
} from '../../models/caja.model';


@Injectable({
  providedIn: 'root'
})
export class CajaService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    `${environment.apiUrl}/caja`;


  obtenerActual():
    Observable<CajaActualResponse> {

    return this.http
      .get<CajaActualResponse>(
        `${this.apiUrl}/actual`
      );
  }


  abrir(
    datos: AbrirCajaDto
  ): Observable<CajaOperacionResponse> {

    return this.http
      .post<CajaOperacionResponse>(
        `${this.apiUrl}/abrir`,
        datos
      );
  }


  cerrar(
    datos: CerrarCajaDto
  ): Observable<CajaOperacionResponse> {

    return this.http
      .post<CajaOperacionResponse>(
        `${this.apiUrl}/cerrar`,
        datos
      );
  }


  historial():
    Observable<CajaHistorialResponse> {

    return this.http
      .get<CajaHistorialResponse>(
        `${this.apiUrl}/historial`
      );
  }


  historialGeneral():
    Observable<CajaHistorialResponse> {

    return this.http
      .get<CajaHistorialResponse>(
        `${this.apiUrl}/admin/historial`
      );
  }
}