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


interface HealthResponse {

  success: boolean;

  message: string;
}


@Injectable({
  providedIn: 'root'
})
export class HealthService {

  private readonly http =
    inject(HttpClient);


  verificar():
    Observable<HealthResponse> {

    return this.http
      .get<HealthResponse>(
        `${environment.apiUrl}/health`
      );
  }
}