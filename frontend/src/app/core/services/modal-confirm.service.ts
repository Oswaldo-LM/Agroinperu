import { Injectable, signal } from '@angular/core';

export type TipoModal = 'danger' | 'warning' | 'success' | 'info';

export interface ModalConfirmConfig {
  titulo: string;
  mensaje: string;
  submensaje?: string;
  tipo?: TipoModal;
  textoConfirmar?: string;
  textoCancelar?: string;
  icono?: string;
  esPrompt?: boolean;
  promptPlaceholder?: string;
  promptValorInicial?: string;
  promptRequerido?: boolean;
}

export interface ModalInternoEstado {
  config: ModalConfirmConfig;
  resolver: (valor: any) => void;
  valorPrompt: string;
  errorPrompt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModalConfirmService {
  readonly estado = signal<ModalInternoEstado | null>(null);

  /**
   * Abre un modal de confirmación y retorna una Promise<boolean>
   */
  confirmar(config: ModalConfirmConfig): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.estado.set({
        config: {
          tipo: 'warning',
          textoConfirmar: 'Confirmar',
          textoCancelar: 'Cancelar',
          ...config,
          esPrompt: false
        },
        resolver: (res) => resolve(!!res),
        valorPrompt: '',
        errorPrompt: ''
      });
    });
  }

  /**
   * Abre un modal con entrada de texto (sustituto moderno de window.prompt)
   * Retorna una Promise<string | null>
   */
  prompt(config: ModalConfirmConfig): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      this.estado.set({
        config: {
          tipo: 'warning',
          textoConfirmar: 'Aceptar',
          textoCancelar: 'Cancelar',
          promptRequerido: true,
          ...config,
          esPrompt: true
        },
        resolver: (res) => resolve(typeof res === 'string' ? res : null),
        valorPrompt: config.promptValorInicial ?? '',
        errorPrompt: ''
      });
    });
  }

  /**
   * Confirma la acción actual
   */
  aceptar(): void {
    const actual = this.estado();
    if (!actual) return;

    if (actual.config.esPrompt) {
      const valor = actual.valorPrompt.trim();
      if (actual.config.promptRequerido && !valor) {
        this.estado.update((st) =>
          st ? { ...st, errorPrompt: 'Este campo es obligatorio.' } : null
        );
        return;
      }
      this.estado.set(null);
      actual.resolver(valor);
    } else {
      this.estado.set(null);
      actual.resolver(true);
    }
  }

  /**
   * Cancela la acción actual
   */
  cancelar(): void {
    const actual = this.estado();
    if (!actual) return;

    this.estado.set(null);
    actual.resolver(actual.config.esPrompt ? null : false);
  }

  actualizarValorPrompt(valor: string): void {
    this.estado.update((st) =>
      st ? { ...st, valorPrompt: valor, errorPrompt: '' } : null
    );
  }
}
