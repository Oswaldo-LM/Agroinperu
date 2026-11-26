import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorblindService } from '../../services/colorblind.service';
import { TipoDaltonismo } from '../../../models/colorblind.model';

@Component({
  selector: 'app-colorblind-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './colorblind-filters.html',
  styleUrl: './colorblind-filters.css',
})
export class ColorblindFiltersComponent {
  readonly colorblindService = inject(ColorblindService);

  seleccionarTipo(tipo: TipoDaltonismo): void {
    this.colorblindService.setTipo(tipo);
  }

  cambiarModo(modo: 'asistencia' | 'simulacion'): void {
    this.colorblindService.setModoAplicacion(modo);
  }

  restablecer(): void {
    this.colorblindService.restablecer();
  }

  cerrarSelector(): void {
    this.colorblindService.cerrarPanelSelector();
  }

  abrirSelector(): void {
    this.colorblindService.abrirPanelSelector();
  }

  cerrarModalEducativa(): void {
    this.colorblindService.cerrarModalEducativa();
  }

  abrirModalEducativa(): void {
    this.colorblindService.abrirModalEducativa();
  }
}
