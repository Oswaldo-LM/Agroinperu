import {
  Component,
  inject
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  AuthService
} from '../../../core/services/auth.service';


@Component({
  selector:
    'app-cuenta',

  imports: [
    RouterLink
  ],

  templateUrl:
    './cuenta.html',

  styleUrl:
    './cuenta.css'
})
export class Cuenta {

  readonly authService =
    inject(
      AuthService
    );


  private readonly router =
    inject(
      Router
    );


  cerrarSesion(): void {

    this.authService
      .cerrarSesion();


    this.router
      .navigateByUrl('/');
  }
}