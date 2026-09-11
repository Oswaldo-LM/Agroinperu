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
  DashboardResponse
} from '../../models/dashboard.model';


@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly http =
    inject(HttpClient);


  obtenerResumen():
    Observable<DashboardResponse> {

    return this.http
      .get<DashboardResponse>(
        `${environment.apiUrl}/dashboard/resumen`
      );
  }
}