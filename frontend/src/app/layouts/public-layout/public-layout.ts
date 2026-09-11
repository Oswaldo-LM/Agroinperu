import {
  Component,
  inject
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import {
  AuthService
} from '../../core/services/auth.service';


@Component({
  selector:
    'app-public-layout',

  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],

  templateUrl:
    './public-layout.html',

  styleUrl:
    './public-layout.css'
})
export class PublicLayout {

  readonly authService =
    inject(AuthService);


  private readonly router =
    inject(Router);


  cerrarSesion(): void {

    this.authService
      .cerrarSesion();


    this.router
      .navigateByUrl('/');
  }
}