import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceAccessibilityService } from '../../services/voice-accessibility.service';

@Component({
  selector: 'app-voice-accessibility',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voice-accessibility.html',
  styleUrl: './voice-accessibility.css',
})
export class VoiceAccessibilityComponent {
  readonly voiceService = inject(VoiceAccessibilityService);

  narrarTodosLosComandos(): void {
    const comandosTexto = this.voiceService.comandosDisponibles
      .map((c) => `${c.categoria}: ${c.frases.join(' o ')}. Para: ${c.descripcion}`)
      .join('. ');

    this.voiceService.hablar(
      `Comandos por voz disponibles en AGROINPERU. ${comandosTexto}. Puedes cerrar este panel diciendo "cerrar ayuda" o presionando Escape.`,
      true,
    );
  }
}
