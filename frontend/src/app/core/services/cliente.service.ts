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
  ClienteResponse,
  ClientesResponse,
  GuardarClienteDto
} from '../../models/cliente.model';


@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    `${environment.apiUrl}/clientes`;


  listar():
    Observable<ClientesResponse> {

    return this.http
      .get<ClientesResponse>(
        this.apiUrl
      );
  }


  obtenerPorId(
    id: number
  ): Observable<ClienteResponse> {

    return this.http
      .get<ClienteResponse>(
        `${this.apiUrl}/${id}`
      );
  }


  crear(
    datos: GuardarClienteDto
  ): Observable<ClienteResponse> {

    return this.http
      .post<ClienteResponse>(
        this.apiUrl,
        datos
      );
  }


  actualizar(
    id: number,
    datos: GuardarClienteDto
  ): Observable<ClienteResponse> {

    return this.http
      .put<ClienteResponse>(
        `${this.apiUrl}/${id}`,
        datos
      );
  }


  eliminar(
    id: number
  ): Observable<{
    success: boolean;
    message?: string;
  }> {

    return this.http
      .delete<{
        success: boolean;
        message?: string;
      }>(
        `${this.apiUrl}/${id}`
      );
  }
}