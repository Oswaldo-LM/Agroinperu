import {
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  HealthService
} from '../../../core/services/health.service';


@Component({
  selector:
    'app-home',

  imports: [
    RouterLink
  ],

  templateUrl:
    './home.html',

  styleUrl:
    './home.css'
})
export class Home
  implements OnInit {

  private readonly healthService =
    inject(HealthService);


  readonly apiConectada =
    signal(false);


  ngOnInit(): void {

    this.healthService
      .verificar()
      .subscribe({

        next: respuesta => {

          this.apiConectada.set(
            respuesta.success
          );
        },


        error: () => {

          this.apiConectada.set(
            false
          );
        }
      });
  }
}