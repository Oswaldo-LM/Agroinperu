import {
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  DatePipe,
  DecimalPipe
} from '@angular/common';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  DashboardService
} from '../../../core/services/dashboard.service';

import {
  DashboardResumen
} from '../../../models/dashboard.model';


@Component({
  selector:
    'app-dashboard',

  imports: [
    DecimalPipe,
    DatePipe
  ],

  templateUrl:
    './dashboard.html',

  styleUrl:
    './dashboard.css'
})
export class Dashboard
  implements OnInit {

  private readonly dashboardService =
    inject(
      DashboardService
    );


  readonly cargando =
    signal(true);


  readonly error =
    signal<string | null>(
      null
    );


  readonly dashboard =
    signal<
      DashboardResumen | null
    >(
      null
    );


  ngOnInit(): void {

    this.cargarDashboard();
  }


  cargarDashboard(): void {

    this.cargando.set(
      true
    );


    this.error.set(
      null
    );


    this.dashboardService
      .obtenerResumen()
      .subscribe({

        next: respuesta => {

          this.dashboard.set(
            respuesta.data
          );


          this.cargando.set(
            false
          );
        },


        error: error => {

          console.error(
            'Error cargando dashboard:',
            error
          );


          this.cargando.set(
            false
          );


          if (
            error instanceof
            HttpErrorResponse
          ) {

            this.error.set(
              error.error?.message ??
              'No se pudo cargar el dashboard'
            );

            return;
          }


          this.error.set(
            'No se pudo cargar el dashboard'
          );
        }
      });
  }
}