import { computed, effect, Injectable, NgZone, signal } from '@angular/core';
import {
  InfoDaltonismo,
  LISTA_DALTONISMO,
  ModoDaltonismo,
  TipoDaltonismo,
} from '../../models/colorblind.model';

const STORAGE_KEY_TYPE = 'agroin_colorblind_type';
const STORAGE_KEY_MODE = 'agroin_colorblind_mode';

@Injectable({
  providedIn: 'root',
})
export class ColorblindService {
  readonly listaTipos = LISTA_DALTONISMO;

  // Signals reactivos principales
  readonly tipoActual = signal<TipoDaltonismo>('normal');
  readonly modoAplicacion = signal<ModoDaltonismo>('asistencia');

  // Control de ventanas / paneles
  readonly panelSelectorAbierto = signal<boolean>(false);
  readonly modalEducativaAbierta = signal<boolean>(false);

  // Notificación tipo toast
  readonly notificacion = signal<{ texto: string; icono: string } | null>(null);
  private notifTimeout: any = null;

  // Estados computados
  readonly estaActivo = computed(() => this.tipoActual() !== 'normal');
  readonly infoActual = computed(() => this.obtenerInfo(this.tipoActual()));

  constructor(private readonly ngZone: NgZone) {
    this.cargarPreferenciasGuardadas();

    // Efecto para sincronizar atributos con el DOM (elemento <html>)
    effect(() => {
      const tipo = this.tipoActual();
      const modo = this.modoAplicacion();
      this.aplicarEnDOM(tipo, modo);
    });
  }

  /**
   * Carga la configuración guardada del usuario desde localStorage
   */
  private cargarPreferenciasGuardadas(): void {
    if (typeof window === 'undefined') return;

    try {
      const tipoGuardado = localStorage.getItem(STORAGE_KEY_TYPE) as TipoDaltonismo;
      const modoGuardado = localStorage.getItem(STORAGE_KEY_MODE) as ModoDaltonismo;

      const tipoValido = this.listaTipos.some((t) => t.id === tipoGuardado) ? tipoGuardado : 'normal';
      const modoValido = modoGuardado === 'simulacion' ? 'simulacion' : 'asistencia';

      this.tipoActual.set(tipoValido);
      this.modoAplicacion.set(modoValido);
      this.aplicarEnDOM(tipoValido, modoValido);
    } catch (e) {
      console.warn('No se pudo acceder al almacenamiento local para modo daltónico:', e);
    }
  }

  /**
   * Establece un modo específico de daltonismo
   */
  setTipo(tipo: TipoDaltonismo, modo?: ModoDaltonismo): void {
    const modoFinal = modo ?? this.modoAplicacion();
    this.tipoActual.set(tipo);
    this.modoAplicacion.set(modoFinal);

    this.guardarEnStorage(tipo, modoFinal);
    this.aplicarEnDOM(tipo, modoFinal);

    const info = this.obtenerInfo(tipo);
    const mensaje =
      tipo === 'normal'
        ? 'Visión estándar restaurada'
        : `Modo ${info.nombre} activado (${modoFinal === 'simulacion' ? 'Simulación' : 'Asistencia'})`;

    this.mostrarNotificacion(mensaje, info.icono);
  }

  /**
   * Cambia entre Asistencia (paletas accesibles) y Simulación (filtros visuales)
   */
  setModoAplicacion(modo: ModoDaltonismo): void {
    this.modoAplicacion.set(modo);
    this.guardarEnStorage(this.tipoActual(), modo);
    this.aplicarEnDOM(this.tipoActual(), modo);

    const tipo = this.tipoActual();
    if (tipo !== 'normal') {
      const info = this.obtenerInfo(tipo);
      const texto = modo === 'simulacion' ? 'Simulación visual activada' : 'Asistencia accesible adaptada';
      this.mostrarNotificacion(`${info.nombre}: ${texto}`, 'bi-sliders');
    }
  }

  /**
   * Desactiva el modo daltónico y vuelve a visión estándar
   */
  restablecer(): void {
    this.setTipo('normal', 'asistencia');
  }

  /**
   * Avanza cíclicamente al siguiente tipo de daltonismo
   */
  siguienteTipo(): void {
    const tipos: TipoDaltonismo[] = [
      'normal',
      'deuteranopia',
      'protanopia',
      'tritanopia',
      'achromatopsia',
      'high-contrast',
    ];
    const currentIndex = tipos.indexOf(this.tipoActual());
    const nextIndex = (currentIndex + 1) % tipos.length;
    this.setTipo(tipos[nextIndex]);
  }

  /**
   * Aplica data-attributes en <html> para que CSS y SVG actúen globalmente
   */
  private aplicarEnDOM(tipo: TipoDaltonismo, modo: ModoDaltonismo): void {
    if (typeof document === 'undefined') return;

    const html = document.documentElement;
    if (tipo === 'normal') {
      html.removeAttribute('data-colorblind');
      html.removeAttribute('data-colorblind-mode');
    } else {
      html.setAttribute('data-colorblind', tipo);
      html.setAttribute('data-colorblind-mode', modo);
    }
  }

  /**
   * Persiste la configuración en localStorage
   */
  private guardarEnStorage(tipo: TipoDaltonismo, modo: ModoDaltonismo): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_TYPE, tipo);
      localStorage.setItem(STORAGE_KEY_MODE, modo);
    } catch (e) {
      console.warn('Error al guardar configuración en localStorage:', e);
    }
  }

  /**
   * Retorna la información y metadata para un tipo de daltonismo
   */
  obtenerInfo(tipo: TipoDaltonismo): InfoDaltonismo {
    return this.listaTipos.find((t) => t.id === tipo) || this.listaTipos[0];
  }

  /**
   * Muestra un toast breve con retroalimentación visual
   */
  mostrarNotificacion(texto: string, icono: string): void {
    this.ngZone.run(() => {
      if (this.notifTimeout) clearTimeout(this.notifTimeout);
      this.notificacion.set({ texto, icono });

      this.notifTimeout = setTimeout(() => {
        this.notificacion.set(null);
      }, 3500);
    });
  }

  // Métodos de control visual del selector
  togglePanelSelector(): void {
    this.panelSelectorAbierto.update((v) => !v);
  }

  abrirPanelSelector(): void {
    this.panelSelectorAbierto.set(true);
  }

  cerrarPanelSelector(): void {
    this.panelSelectorAbierto.set(false);
  }

  toggleModalEducativa(): void {
    this.modalEducativaAbierta.update((v) => !v);
  }

  abrirModalEducativa(): void {
    this.modalEducativaAbierta.set(true);
  }

  cerrarModalEducativa(): void {
    this.modalEducativaAbierta.set(false);
  }
}
