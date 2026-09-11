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
  ActualizarUsuarioDto,
  CambiarPasswordUsuarioDto,
  CrearUsuarioDto,
  OperacionUsuarioResponse,
  UsuarioResponse,
  UsuariosResponse
} from '../../models/usuario.model';


@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    `${environment.apiUrl}/usuarios`;


  listar():
    Observable<UsuariosResponse> {

    return this.http
      .get<UsuariosResponse>(
        this.apiUrl
      );
  }


  obtenerPorId(
    id: number
  ): Observable<UsuarioResponse> {

    return this.http
      .get<UsuarioResponse>(
        `${this.apiUrl}/${id}`
      );
  }


  crear(
    datos: CrearUsuarioDto
  ): Observable<UsuarioResponse> {

    return this.http
      .post<UsuarioResponse>(
        this.apiUrl,
        datos
      );
  }


  actualizar(
    id: number,
    datos: ActualizarUsuarioDto
  ): Observable<UsuarioResponse> {

    return this.http
      .put<UsuarioResponse>(
        `${this.apiUrl}/${id}`,
        datos
      );
  }


  cambiarPassword(
    id: number,
    datos: CambiarPasswordUsuarioDto
  ): Observable<OperacionUsuarioResponse> {

    return this.http
      .put<OperacionUsuarioResponse>(
        `${this.apiUrl}/${id}/password`,
        datos
      );
  }


  inactivar(
    id: number
  ): Observable<OperacionUsuarioResponse> {

    return this.http
      .delete<OperacionUsuarioResponse>(
        `${this.apiUrl}/${id}`
      );
  }
}