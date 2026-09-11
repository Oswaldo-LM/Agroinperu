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
  CrearProformaDto,
  ProformaResponse,
  ProformasResponse
} from '../../models/proforma.model';


@Injectable({
  providedIn: 'root'
})
export class ProformaService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    `${environment.apiUrl}/proformas`;


  listar():
    Observable<ProformasResponse> {

    return this.http
      .get<ProformasResponse>(
        this.apiUrl
      );
  }


  obtenerPorId(
    id: number
  ): Observable<ProformaResponse> {

    return this.http
      .get<ProformaResponse>(
        `${this.apiUrl}/${id}`
      );
  }


  crear(
    datos: CrearProformaDto
  ): Observable<ProformaResponse> {

    return this.http
      .post<ProformaResponse>(
        this.apiUrl,
        datos
      );
  }


  anular(
    id: number,
    motivo: string
  ): Observable<ProformaResponse> {

    return this.http
      .put<ProformaResponse>(
        `${this.apiUrl}/${id}/anular`,
        {
          motivo
        }
      );
  }
}