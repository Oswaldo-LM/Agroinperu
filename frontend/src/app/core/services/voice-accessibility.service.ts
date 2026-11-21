import { inject, Injectable, NgZone, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface ComandoAyuda {
  frases: string[];
  descripcion: string;
  categoria: 'Navegación' | 'Búsqueda' | 'Lectura' | 'Control';
}

export interface NotificacionAtajo {
  texto: string;
  icono: string;
}

@Injectable({
  providedIn: 'root',
})
export class VoiceAccessibilityService {
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  // Estados reactivos (Signals)
  readonly soportaSintesis = signal<boolean>(false);
  readonly soportaReconocimiento = signal<boolean>(false);

  readonly narradorActivo = signal<boolean>(false);
  readonly modoLectorHover = signal<boolean>(false);
  readonly estaHablando = signal<boolean>(false);
  readonly estaEscuchando = signal<boolean>(false);

  readonly comandoDetectado = signal<string>('');
  readonly transcripcionEnVivo = signal<string>('');
  readonly ultimoMensaje = signal<string>('');
  readonly errorMicrofono = signal<string | null>(null);

  readonly panelAbierto = signal<boolean>(false);
  readonly modalComandosAbierto = signal<boolean>(false);

  readonly velocidad = signal<number>(1.0);
  readonly volumen = signal<number>(1.0);

  // Notificación flotante visual para atajos de teclado
  readonly notificacionAtajo = signal<NotificacionAtajo | null>(null);
  private toastTimeout: any = null;

  // Referencias internas
  private synthesis: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private recognition: any = null;
  private hoverDebounceTimer: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private debeSeguirEscuchando = false;

  // Lista de comandos disponibles documentados
  readonly comandosDisponibles: ComandoAyuda[] = [
    {
      categoria: 'Navegación',
      frases: ['"Inicio"', '"Ir a inicio"', '"Página principal"'],
      descripcion: 'Te lleva a la página de inicio de AGROINPERU',
    },
    {
      categoria: 'Navegación',
      frases: ['"Catálogo"', '"Ir a catálogo"', '"Ver productos"'],
      descripcion: 'Abre el catálogo completo de productos agrícolas',
    },
    {
      categoria: 'Navegación',
      frases: ['"Carrito"', '"Ver carrito"', '"Ir al carrito"'],
      descripcion: 'Abre tu carrito de compras',
    },
    {
      categoria: 'Navegación',
      frases: ['"Iniciar sesión"', '"Login"', '"Entrar"'],
      descripcion: 'Abre el formulario para acceder a tu cuenta',
    },
    {
      categoria: 'Navegación',
      frases: ['"Registrarse"', '"Crear cuenta"', '"Registro"'],
      descripcion: 'Te lleva a la página de registro de cliente',
    },
    {
      categoria: 'Navegación',
      frases: ['"Mis pedidos"', '"Ver mis pedidos"'],
      descripcion: 'Muestra el historial y estado de tus compras',
    },
    {
      categoria: 'Navegación',
      frases: ['"Mi cuenta"', '"Mi perfil"'],
      descripcion: 'Accede a la configuración de tu perfil',
    },
    {
      categoria: 'Búsqueda',
      frases: ['"Buscar mangueras"', '"Buscar tuberías"', '"Buscar [producto]"'],
      descripcion: 'Busca automáticamente cualquier producto en el catálogo',
    },
    {
      categoria: 'Lectura',
      frases: ['"Narrar página"', '"Leer página"', '"Leer contenido"'],
      descripcion: 'Narra en voz alta el contenido y secciones de la pantalla actual',
    },
    {
      categoria: 'Lectura',
      frases: ['"Modo lector"', '"Activar lector"', '"Desactivar lector"'],
      descripcion: 'Activa la lectura automática al pasar el cursor o navegar con Tab',
    },
    {
      categoria: 'Control',
      frases: ['"Silencio"', '"Parar"', '"Detener"'],
      descripcion: 'Detiene inmediatamente la narración de voz',
    },
    {
      categoria: 'Control',
      frases: ['"Subir"', '"Ir arriba"', '"Arriba"'],
      descripcion: 'Desplaza suavemente la pantalla hacia el principio',
    },
    {
      categoria: 'Control',
      frases: ['"Bajar"', '"Ir abajo"', '"Abajo"'],
      descripcion: 'Desplaza suavemente la pantalla hacia el final',
    },
    {
      categoria: 'Control',
      frases: ['"Más rápido"', '"Más lento"', '"Velocidad normal"'],
      descripcion: 'Ajusta la velocidad de la voz del asistente',
    },
    {
      categoria: 'Control',
      frases: ['"Ayuda"', '"Comandos"', '"¿Qué puedo decir?"'],
      descripcion: 'Abre la guía de ayuda y narra los comandos disponibles',
    },
  ];

  constructor() {
    this.inicializarSintesis();
    this.inicializarReconocimiento();
    this.configurarAtajosTeclado();
    this.configurarModoLectorInteractivo();
  }

  // --------------------------------------------------------------------------
  // FEEDBACK VISUAL INMEDIATO PARA ATAJOS
  // --------------------------------------------------------------------------

  mostrarNotificacionAtajo(texto: string, icono: string): void {
    clearTimeout(this.toastTimeout);
    this.notificacionAtajo.set({ texto, icono });
    this.toastTimeout = setTimeout(() => {
      this.ngZone.run(() => {
        this.notificacionAtajo.set(null);
      });
    }, 3200);
  }

  // --------------------------------------------------------------------------
  // SONIDO DE ACTIVACIÓN DE MICRÓFONO (CHIME SUAVE)
  // --------------------------------------------------------------------------

  private reproducirChime(tipo: 'inicio' | 'fin'): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (tipo === 'inicio') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.18);
      } else {
        osc.frequency.setValueAtTime(783.99, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch {}
  }

  // --------------------------------------------------------------------------
  // INICIALIZACIÓN DE SÍNTESIS DE VOZ (TTS)
  // --------------------------------------------------------------------------

  private inicializarSintesis(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.soportaSintesis.set(true);

      this.cargarVoces();
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = () => this.cargarVoces();
      }
    } else {
      this.soportaSintesis.set(false);
    }
  }

  private cargarVoces(): void {
    if (!this.synthesis) return;
    const voices = this.synthesis.getVoices();
    this.voice =
      voices.find((v) => v.lang.toLowerCase() === 'es-pe') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('es-419')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('es-mx')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('es-es')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('es')) ||
      null;
  }

  // --------------------------------------------------------------------------
  // INICIALIZACIÓN ROBUSTA DE RECONOCIMIENTO DE VOZ (STT)
  // --------------------------------------------------------------------------

  private inicializarReconocimiento(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.soportaReconocimiento.set(true);
      try {
        this.recognition = new SpeechRecognition();
        // Soportar español general para máxima compatibilidad
        this.recognition.lang = 'es-ES';
        this.recognition.continuous = false; // ciclo por frases: mucho más estable
        this.recognition.interimResults = true; // mostrar lo que dice en tiempo real
        this.recognition.maxAlternatives = 3;

        this.recognition.onstart = () => {
          this.ngZone.run(() => {
            this.estaEscuchando.set(true);
            this.errorMicrofono.set(null);
            this.transcripcionEnVivo.set('Escuchando...');
          });
        };

        this.recognition.onresult = (event: any) => {
          // Ignorar lo que escuche si el asistente está narrando por altavoz
          if (this.estaHablando()) return;

          let textoIntermedio = '';
          let textoFinal = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              textoFinal += transcript;
            } else {
              textoIntermedio += transcript;
            }
          }

          this.ngZone.run(() => {
            if (textoIntermedio) {
              this.transcripcionEnVivo.set(`"${textoIntermedio}"`);
            }
            if (textoFinal) {
              const limpio = textoFinal.trim();
              this.comandoDetectado.set(limpio);
              this.transcripcionEnVivo.set(`Detectado: "${limpio}"`);
              this.procesarComandoVoz(limpio);
            }
          });
        };

        this.recognition.onerror = (event: any) => {
          this.ngZone.run(() => {
            console.warn('SpeechRecognition error:', event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
              this.errorMicrofono.set(
                'Permiso de micrófono bloqueado. Haz clic en el ícono de candado 🔒 junto a la URL y permite el micrófono.',
              );
              this.debeSeguirEscuchando = false;
              this.estaEscuchando.set(false);
            } else if (event.error === 'no-speech') {
              // Silencio, normal, continuará escuchando si debeSeguirEscuchando está activo
            } else if (event.error === 'network') {
              this.errorMicrofono.set(
                'Aviso de conexión con el servicio de voz de Google. Verifica tu conexión a internet.',
              );
            } else {
              this.errorMicrofono.set(`Estado del micrófono: ${event.error}`);
            }
          });
        };

        this.recognition.onend = () => {
          this.ngZone.run(() => {
            // Si el usuario quiere mantener la escucha y no está hablando el asistente, reiniciar ciclo
            if (this.debeSeguirEscuchando && !this.estaHablando()) {
              try {
                this.recognition.start();
              } catch {
                setTimeout(() => {
                  if (this.debeSeguirEscuchando && !this.estaHablando()) {
                    try {
                      this.recognition.start();
                    } catch {}
                  }
                }, 300);
              }
            } else if (!this.debeSeguirEscuchando) {
              this.estaEscuchando.set(false);
              this.transcripcionEnVivo.set('');
            }
          });
        };
      } catch (err) {
        console.warn('Error inicializando SpeechRecognition:', err);
        this.soportaReconocimiento.set(false);
      }
    } else {
      this.soportaReconocimiento.set(false);
    }
  }

  // --------------------------------------------------------------------------
  // ATAJOS DE TECLADO PARA ACCESIBILIDAD
  // --------------------------------------------------------------------------

  private configurarAtajosTeclado(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener(
      'keydown',
      (event: KeyboardEvent) => {
        const key = event.key ? event.key.toLowerCase() : '';
        const code = event.code || '';

        // 1. Tecla Escape: Cancelar o silenciar de inmediato
        if (key === 'escape' || code === 'Escape') {
          this.ngZone.run(() => {
            let accionRealizada = false;
            if (this.estaHablando()) {
              this.detenerHablar();
              accionRealizada = true;
            }
            if (this.modalComandosAbierto()) {
              this.cerrarModalComandos();
              accionRealizada = true;
            }
            if (this.panelAbierto()) {
              this.panelAbierto.set(false);
              accionRealizada = true;
            }
            if (accionRealizada) {
              event.preventDefault();
              event.stopPropagation();
              this.mostrarNotificacionAtajo('Acción cancelada / Silenciado', 'bi-volume-mute-fill');
            }
          });
          return;
        }

        // 2. Teclas de Función directas (F2, F4, F8, F9)
        if (code === 'F2' || key === 'f2' || code === 'F4' || key === 'f4') {
          event.preventDefault();
          event.stopPropagation();
          this.ngZone.run(() => {
            this.alternarPanel();
            const abierto = this.panelAbierto();
            const mensaje = abierto
              ? 'Panel de accesibilidad abierto'
              : 'Panel de accesibilidad cerrado';
            this.mostrarNotificacionAtajo(mensaje, abierto ? 'bi-universal-access' : 'bi-x-circle');
            this.hablar(mensaje, true);
          });
          return;
        }

        if (code === 'F8' || key === 'f8') {
          event.preventDefault();
          event.stopPropagation();
          this.ngZone.run(() => {
            this.mostrarNotificacionAtajo('Narrando página actual...', 'bi-megaphone-fill');
            this.narrarPagina();
          });
          return;
        }

        if (code === 'F9' || key === 'f9') {
          event.preventDefault();
          event.stopPropagation();
          this.ngZone.run(() => {
            this.alternarEscucha();
          });
          return;
        }

        // 3. Modificadores (Alt o Ctrl+Shift)
        const hasAlt = event.altKey;
        const hasCtrlShift = event.ctrlKey && event.shiftKey;
        const hasCtrlAlt = event.ctrlKey && event.altKey;
        const hasAltShift = event.altKey && event.shiftKey;

        const isModifierActive = hasAlt || hasCtrlShift || hasCtrlAlt || hasAltShift;
        if (!isModifierActive) return;

        const isKeyA = key === 'a' || code === 'KeyA';
        const isKeyN = key === 'n' || code === 'KeyN';
        const isKeyC = key === 'c' || code === 'KeyC';
        const isKeyV = key === 'v' || code === 'KeyV';
        const isKeyS = key === 's' || code === 'KeyS';
        const isKeyH = key === 'h' || code === 'KeyH';

        if (isKeyA) {
          event.preventDefault();
          event.stopPropagation();
          this.ngZone.run(() => {
            this.alternarPanel();
            const abierto = this.panelAbierto();
            const mensaje = abierto ? 'Panel abierto' : 'Panel cerrado';
            this.mostrarNotificacionAtajo(mensaje, abierto ? 'bi-universal-access' : 'bi-x-circle');
            this.hablar(mensaje, true);
          });
          return;
        }

        if (isKeyN) {
          event.preventDefault();
          event.stopPropagation();
          this.ngZone.run(() => {
            this.mostrarNotificacionAtajo('Narrando página...', 'bi-megaphone-fill');
            this.narrarPagina();
          });
          return;
        }

        if (isKeyC || isKeyV) {
          event.preventDefault();
          event.stopPropagation();
          this.ngZone.run(() => {
            this.alternarEscucha();
          });
          return;
        }

        if (isKeyS) {
          event.preventDefault();
          event.stopPropagation();
          this.ngZone.run(() => {
            this.detenerHablar();
            this.mostrarNotificacionAtajo('Narración silenciada', 'bi-volume-mute-fill');
            this.hablar('Narración silenciada', true);
          });
          return;
        }

        if (isKeyH) {
          event.preventDefault();
          event.stopPropagation();
          this.ngZone.run(() => {
            this.abrirModalComandos();
            this.mostrarNotificacionAtajo('Guía de comandos abierta', 'bi-question-circle-fill');
          });
          return;
        }
      },
      { capture: true },
    );
  }

  // --------------------------------------------------------------------------
  // MODO LECTOR INTERACTIVO (HOVER / FOCO CON TECLADO)
  // --------------------------------------------------------------------------

  private configurarModoLectorInteractivo(): void {
    if (typeof window === 'undefined') return;

    const procesarElemento = (el: HTMLElement | null) => {
      if (!this.modoLectorHover() || !el) return;

      if (el.closest('.accessibility-panel-wrapper') || el.closest('.accessibility-floating-btn')) {
        return;
      }

      const texto = this.obtenerTextoAccesible(el);
      if (texto && texto.length > 1) {
        clearTimeout(this.hoverDebounceTimer);
        this.hoverDebounceTimer = setTimeout(() => {
          this.hablar(texto, false);
        }, 120);
      }
    };

    window.addEventListener('focusin', (e: FocusEvent) => {
      procesarElemento(e.target as HTMLElement);
    });

    window.addEventListener('mouseover', (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        'button, a, input, [role="button"], h1, h2, h3, h4, p, img, label',
      ) as HTMLElement;
      if (target) {
        procesarElemento(target);
      }
    });
  }

  private obtenerTextoAccesible(el: HTMLElement): string {
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const title = el.getAttribute('title');
    if (title) return title;

    if (el.tagName === 'IMG') {
      const alt = (el as HTMLImageElement).alt;
      return alt ? `Imagen: ${alt}` : 'Imagen ilustrativa';
    }

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const placeholder = (el as HTMLInputElement).placeholder;
      const type = (el as HTMLInputElement).type;
      return placeholder ? `Campo de texto: ${placeholder}` : `Campo para escribir tipo ${type}`;
    }

    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
      const btnText = el.innerText?.trim();
      return btnText ? `Botón: ${btnText}` : 'Botón';
    }

    if (el.tagName === 'A') {
      const linkText = el.innerText?.trim();
      return linkText ? `Enlace: ${linkText}` : 'Enlace';
    }

    const text = el.innerText?.trim();
    if (text && text.length < 200) {
      if (/^H[1-6]$/.test(el.tagName)) {
        return `Encabezado: ${text}`;
      }
      return text;
    }

    return '';
  }

  // --------------------------------------------------------------------------
  // SÍNTESIS DE VOZ PÚBLICA (ROBUSTA)
  // --------------------------------------------------------------------------

  hablar(texto: string, prioridad = true, callback?: () => void): void {
    if (!this.synthesis || !texto?.trim()) return;

    if (prioridad) {
      this.detenerHablar();
    }

    try {
      if (this.synthesis.paused) {
        this.synthesis.resume();
      }

      if (!this.voice) {
        this.cargarVoces();
      }

      const utterance = new SpeechSynthesisUtterance(texto.trim());
      utterance.lang = 'es-PE';
      if (this.voice) {
        utterance.voice = this.voice;
      }
      utterance.rate = this.velocidad();
      utterance.pitch = 1.0;
      utterance.volume = this.volumen();

      utterance.onstart = () => {
        this.ngZone.run(() => {
          this.estaHablando.set(true);
          this.ultimoMensaje.set(texto);
          // Pausar temporalmente el reconocimiento mientras el asistente habla para evitar eco
          if (this.recognition && this.estaEscuchando()) {
            try {
              this.recognition.stop();
            } catch {}
          }
        });
      };

      utterance.onend = () => {
        this.ngZone.run(() => {
          this.estaHablando.set(false);
          this.currentUtterance = null;
          // Si el usuario tenía el micrófono encendido, reanudar escucha silenciosa
          if (this.debeSeguirEscuchando && this.recognition) {
            setTimeout(() => {
              if (this.debeSeguirEscuchando && !this.estaHablando()) {
                try {
                  this.recognition.start();
                } catch {}
              }
            }, 250);
          }
          if (callback) callback();
        });
      };

      utterance.onerror = () => {
        this.ngZone.run(() => {
          this.estaHablando.set(false);
          this.currentUtterance = null;
          if (this.debeSeguirEscuchando && this.recognition) {
            try {
              this.recognition.start();
            } catch {}
          }
        });
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    } catch (err) {
      console.warn('Error en síntesis de voz:', err);
    }
  }

  detenerHablar(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.estaHablando.set(false);
      this.currentUtterance = null;
    }
  }

  // --------------------------------------------------------------------------
  // NARRACIÓN INTELIGENTE DE LA PÁGINA ACTUAL
  // --------------------------------------------------------------------------

  narrarPagina(): void {
    if (typeof document === 'undefined') return;

    this.detenerHablar();

    const url = this.router.url;
    let tituloSeccion = 'Página actual';

    if (url === '/' || url === '') {
      tituloSeccion = 'Página de Inicio de AGROINPERU';
    } else if (url.includes('/catalogo')) {
      tituloSeccion = 'Catálogo de productos agrícolas e industriales';
    } else if (url.includes('/carrito')) {
      tituloSeccion = 'Carrito de compras';
    } else if (url.includes('/login')) {
      tituloSeccion = 'Inicio de sesión de cliente';
    } else if (url.includes('/registro')) {
      tituloSeccion = 'Registro de nuevo cliente';
    } else if (url.includes('/cliente/pedidos')) {
      tituloSeccion = 'Tus pedidos realizados';
    } else if (url.includes('/cliente/cuenta')) {
      tituloSeccion = 'Mi cuenta y perfil de cliente';
    }

    const encabezados = Array.from(document.querySelectorAll('main h1, main h2, main h3'))
      .map((el) => (el as HTMLElement).innerText.trim())
      .filter((t) => t.length > 0 && t.length < 120)
      .slice(0, 5);

    const tarjetasProductos = document.querySelectorAll(
      '.product-card, .catalogo-card, [class*="producto"]',
    );
    const cantidadProductos = tarjetasProductos.length;

    let mensaje = `Estás en: ${tituloSeccion}. `;

    if (encabezados.length > 0) {
      mensaje += `Secciones principales: ${encabezados.join('. ')}. `;
    }

    if (cantidadProductos > 0) {
      mensaje += `Se encontraron ${cantidadProductos} elementos o productos en esta sección. `;
    }

    mensaje +=
      'Puedes decir "catálogo", "carrito", "buscar mangueras", o "ayuda" para más comandos.';

    this.hablar(mensaje, true);
  }

  // --------------------------------------------------------------------------
  // CONTROL DE ESCUCHA DE COMANDOS DE VOZ (SIN FEEDBACK LOOP)
  // --------------------------------------------------------------------------

  iniciarEscucha(): void {
    if (!this.recognition) {
      this.errorMicrofono.set(
        'Tu navegador actual no soporta la API de reconocimiento de voz. Usa Google Chrome o Microsoft Edge.',
      );
      this.mostrarNotificacionAtajo(
        'Navegador no soporta micrófono',
        'bi-exclamation-octagon-fill',
      );
      return;
    }

    try {
      this.errorMicrofono.set(null);
      this.debeSeguirEscuchando = true;
      this.reproducirChime('inicio');
      this.mostrarNotificacionAtajo('Micrófono activo: di un comando', 'bi-mic-fill');
      this.transcripcionEnVivo.set('Escuchando tu voz...');
      this.recognition.start();
      this.estaEscuchando.set(true);
    } catch (e: any) {
      // Si ya estaba iniciado, ignorar
      console.warn('Recognition start aviso:', e);
      this.estaEscuchando.set(true);
    }
  }

  detenerEscucha(): void {
    this.debeSeguirEscuchando = false;
    this.estaEscuchando.set(false);
    this.transcripcionEnVivo.set('');
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.reproducirChime('fin');
    this.mostrarNotificacionAtajo('Comandos por voz pausados', 'bi-mic-mute-fill');
  }

  alternarEscucha(): void {
    if (this.estaEscuchando()) {
      this.detenerEscucha();
    } else {
      this.iniciarEscucha();
    }
  }

  alternarModoLector(): void {
    const nuevo = !this.modoLectorHover();
    this.modoLectorHover.set(nuevo);
    if (nuevo) {
      this.hablar('Modo lector interactivo activado.', true);
    } else {
      this.hablar('Modo lector interactivo desactivado.', true);
    }
  }

  alternarPanel(): void {
    this.panelAbierto.update((v) => !v);
  }

  abrirModalComandos(): void {
    this.modalComandosAbierto.set(true);
    this.hablar('Guía de comandos por voz abierta.', true);
  }

  cerrarModalComandos(): void {
    this.modalComandosAbierto.set(false);
  }

  cambiarVelocidad(nueva: number): void {
    this.velocidad.set(nueva);
    this.hablar(`Velocidad ${nueva}`, true);
  }

  // --------------------------------------------------------------------------
  // PROCESAMIENTO INTELIGENTE DE COMANDOS DE VOZ EN ESPAÑOL
  // --------------------------------------------------------------------------

  procesarComandoVoz(comandoBruto: string): void {
    const comando = comandoBruto.toLowerCase().trim();

    // 1. Control de voz y parada
    if (
      comando.includes('silencio') ||
      comando.includes('parar') ||
      comando.includes('detener') ||
      comando.includes('callar') ||
      comando.includes('stop')
    ) {
      this.detenerHablar();
      this.mostrarNotificacionAtajo('Voz detenida', 'bi-volume-mute-fill');
      return;
    }

    // 2. Narración de página
    if (
      comando.includes('narrar') ||
      comando.includes('leer página') ||
      comando.includes('leer pagina') ||
      comando.includes('leer contenido') ||
      comando.includes('lee la página') ||
      comando.includes('resumen')
    ) {
      this.mostrarNotificacionAtajo('Narrando página...', 'bi-megaphone-fill');
      this.narrarPagina();
      return;
    }

    // 3. Ayuda de comandos
    if (
      comando.includes('ayuda') ||
      comando.includes('comandos') ||
      comando.includes('qué puedo decir') ||
      comando.includes('que puedo decir')
    ) {
      this.abrirModalComandos();
      return;
    }

    if (
      comando.includes('cerrar ayuda') ||
      comando.includes('cerrar comandos') ||
      comando.includes('cerrar')
    ) {
      this.cerrarModalComandos();
      this.panelAbierto.set(false);
      this.hablar('Cerrando.', true);
      return;
    }

    // 4. Modo lector interactivo
    if (comando.includes('activar lector') || comando.includes('activar modo lector')) {
      this.modoLectorHover.set(true);
      this.hablar('Modo lector interactivo activado.', true);
      return;
    }

    if (
      comando.includes('desactivar lector') ||
      comando.includes('desactivar modo lector') ||
      comando.includes('quitar lector')
    ) {
      this.modoLectorHover.set(false);
      this.hablar('Modo lector interactivo desactivado.', true);
      return;
    }

    // 5. Navegación
    if (
      comando === 'inicio' ||
      comando.includes('ir a inicio') ||
      comando.includes('ir al inicio') ||
      comando.includes('página principal') ||
      comando.includes('abrir inicio') ||
      comando.includes('home')
    ) {
      this.mostrarNotificacionAtajo('Navegando a Inicio', 'bi-house-door-fill');
      this.hablar('Navegando a inicio.', true);
      this.router.navigate(['/']);
      return;
    }

    if (
      comando.includes('catálogo') ||
      comando.includes('catalogo') ||
      comando.includes('ir a catálogo') ||
      comando.includes('ir al catálogo') ||
      comando.includes('ver catálogo') ||
      comando.includes('ver catalogo') ||
      comando.includes('ver productos') ||
      comando.includes('abrir catálogo') ||
      comando.includes('abrir catalogo') ||
      comando === 'productos' ||
      comando.includes('tienda')
    ) {
      this.mostrarNotificacionAtajo('Navegando al Catálogo', 'bi-grid-3x3-gap-fill');
      this.hablar('Abriendo catálogo de productos.', true);
      this.router.navigate(['/catalogo']);
      return;
    }

    if (
      comando.includes('carrito') ||
      comando.includes('ver carrito') ||
      comando.includes('ir al carrito') ||
      comando.includes('abrir carrito') ||
      comando.includes('compras')
    ) {
      this.mostrarNotificacionAtajo('Abriendo Carrito', 'bi-cart3');
      this.hablar('Abriendo tu carrito de compras.', true);
      this.router.navigate(['/carrito']);
      return;
    }

    if (
      comando.includes('iniciar sesión') ||
      comando.includes('iniciar sesion') ||
      comando.includes('login') ||
      comando.includes('ingresar') ||
      comando.includes('entrar')
    ) {
      this.mostrarNotificacionAtajo('Abriendo Login', 'bi-box-arrow-in-right');
      this.hablar('Abriendo página de inicio de sesión.', true);
      this.router.navigate(['/login']);
      return;
    }

    if (
      comando.includes('registrarse') ||
      comando.includes('registro') ||
      comando.includes('crear cuenta')
    ) {
      this.mostrarNotificacionAtajo('Abriendo Registro', 'bi-person-plus-fill');
      this.hablar('Abriendo formulario de registro.', true);
      this.router.navigate(['/registro']);
      return;
    }

    if (comando.includes('mis pedidos') || comando.includes('pedidos')) {
      this.mostrarNotificacionAtajo('Abriendo Mis Pedidos', 'bi-box-seam');
      this.hablar('Abriendo tus pedidos.', true);
      this.router.navigate(['/cliente/pedidos']);
      return;
    }

    if (
      comando.includes('mi cuenta') ||
      comando.includes('mi perfil') ||
      comando.includes('cuenta') ||
      comando.includes('perfil')
    ) {
      this.mostrarNotificacionAtajo('Abriendo Mi Cuenta', 'bi-person-circle');
      this.hablar('Abriendo tu cuenta.', true);
      this.router.navigate(['/cliente/cuenta']);
      return;
    }

    // 6. Búsqueda por voz
    const regexBuscar =
      /(?:buscar|busca|encontrar|encuentra|consultar|ver|dame|quiero)\s+(?:por\s+)?(.+)/i;
    const matchBuscar = comando.match(regexBuscar);
    if (matchBuscar && matchBuscar[1]) {
      const termino = matchBuscar[1]
        .replace(/^(en\s+el\s+catálogo|en\s+el\s+catalogo|productos?)/i, '')
        .trim();

      if (termino && termino !== 'página' && termino !== 'pagina') {
        this.mostrarNotificacionAtajo(`Buscando: ${termino}`, 'bi-search');
        this.hablar(`Buscando ${termino} en el catálogo.`, true);
        this.router.navigate(['/catalogo'], { queryParams: { q: termino } });
        return;
      }
    }

    // 7. Scroll / Desplazamiento
    if (comando.includes('arriba') || comando.includes('subir') || comando.includes('principio')) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.mostrarNotificacionAtajo('Subiendo arriba', 'bi-arrow-up-circle-fill');
      }
      return;
    }

    if (comando.includes('abajo') || comando.includes('bajar') || comando.includes('final')) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        this.mostrarNotificacionAtajo('Bajando al final', 'bi-arrow-down-circle-fill');
      }
      return;
    }

    // 8. Velocidad de voz
    if (
      comando.includes('más rápido') ||
      comando.includes('mas rapido') ||
      comando.includes('rápido')
    ) {
      const nueva = Math.min(1.5, Number((this.velocidad() + 0.2).toFixed(1)));
      this.cambiarVelocidad(nueva);
      return;
    }

    if (
      comando.includes('más lento') ||
      comando.includes('mas lento') ||
      comando.includes('lento')
    ) {
      const nueva = Math.max(0.7, Number((this.velocidad() - 0.2).toFixed(1)));
      this.cambiarVelocidad(nueva);
      return;
    }

    // 9. Comando no reconocido
    this.mostrarNotificacionAtajo(`No reconocido: "${comando}"`, 'bi-question-diamond-fill');
    this.hablar(`Comando "${comando}" no reconocido. Di ayuda para escuchar los comandos.`, false);
  }
}
