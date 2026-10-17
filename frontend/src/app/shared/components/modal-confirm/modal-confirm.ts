import {
  Component,
  HostListener,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalConfirmService } from '../../../core/services/modal-confirm.service';

@Component({
  selector: 'app-modal-confirm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-confirm.html',
  styleUrl: './modal-confirm.css'
})
export class ModalConfirmComponent {
  readonly servicio = inject(ModalConfirmService);

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.servicio.estado()) {
      this.cancelar();
    }
  }

  confirmar(): void {
    this.servicio.aceptar();
  }

  cancelar(): void {
    this.servicio.cancelar();
  }

  actualizarPrompt(valor: string): void {
    this.servicio.actualizarValorPrompt(valor);
  }
}
