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
  ReporteVentasResponse
} from '../../models/reporte-ventas.model';


@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    `${environment.apiUrl}/reportes`;


  ventas(
    desde: string,
    hasta: string
  ): Observable<ReporteVentasResponse> {

    const params =
      new HttpParams()
        .set(
          'desde',
          desde
        )
        .set(
          'hasta',
          hasta
        );


    return this.http
      .get<ReporteVentasResponse>(
        `${this.apiUrl}/ventas`,
        {
          params
        }
      );
  }


  exportarVentasCsv(
  desde: string,
  hasta: string
) {

  return this.http.get(
    `${this.apiUrl}/ventas/csv`,
    {
      params: {
        desde,
        hasta
      },

      responseType: 'blob'
    }
  );
}
}

