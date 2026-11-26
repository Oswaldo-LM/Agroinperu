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

import {
  VoiceAccessibilityService
} from '../../core/services/voice-accessibility.service';


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

  readonly voiceService =
    inject(VoiceAccessibilityService);

  private readonly router =
    inject(Router);


  buscar(termino: string): void {
    const q = termino?.trim();
    if (q) {
      this.router.navigate(['/catalogo'], { queryParams: { q } });
    } else {
      this.router.navigate(['/catalogo']);
    }
  }


  cerrarSesion(): void {

    this.authService
      .cerrarSesion();

    this.router
      .navigateByUrl('/');
  }
}
