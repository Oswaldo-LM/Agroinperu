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
    'app-admin-layout',

  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],

  templateUrl:
    './admin-layout.html',

  styleUrl:
    './admin-layout.css'
})
export class AdminLayout {

  readonly authService =
    inject(AuthService);


  private readonly router =
    inject(Router);


  cerrarSesion(): void {

    this.authService
      .cerrarSesion();


    this.router
      .navigateByUrl(
        '/admin/login'
      );
  }
}