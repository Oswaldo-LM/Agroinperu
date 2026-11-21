import { inject, Injectable, NgZone, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface ComandoAyuda {
  frases: string[];
  descripcion: string;
  categoria: 'Navegación' | 'Búsqueda' | 'Lectura' | 'Control';
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
  readonly ultimoMensaje = signal<string>('');
  readonly errorMicrofono = signal<string | null>(null);

  readonly panelAbierto = signal<boolean>(false);
  readonly modalComandosAbierto = signal<boolean>(false);

  readonly velocidad = signal<number>(1.0);
  readonly volumen = signal<number>(1.0);

  // Referencias internas
  private synthesis: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private recognition: any = null;
  private hoverDebounceTimer: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

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
    // Preferir voz en español de Perú, Latinoamérica o España
    this.voice =
      voices.find((v) => v.lang.toLowerCase() === 'es-pe') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('es-419')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('es-mx')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('es-es')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('es')) ||
      null;
  }

  // --------------------------------------------------------------------------
  // INICIALIZACIÓN DE RECONOCIMIENTO DE VOZ (STT)
  // --------------------------------------------------------------------------

  private inicializarReconocimiento(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.soportaReconocimiento.set(true);
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'es-PE';
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
          this.ngZone.run(() => {
            this.estaEscuchando.set(true);
            this.errorMicrofono.set(null);
            this.ultimoMensaje.set('Escuchando comandos por voz...');
          });
        };

        this.recognition.onresult = (event: any) => {
          const lastIndex = event.results.length - 1;
          const transcript = event.results[lastIndex][0].transcript.trim();
          this.ngZone.run(() => {
            this.comandoDetectado.set(transcript);
            this.procesarComandoVoz(transcript);
          });
        };

        this.recognition.onerror = (event: any) => {
          this.ngZone.run(() => {
            if (event.error === 'not-allowed') {
              this.errorMicrofono.set(
                'Permiso de micrófono denegado. Permite el acceso para usar comandos por voz.',
              );
              this.estaEscuchando.set(false);
            } else if (event.error === 'no-speech') {
              // Silencio normal, no es error crítico
            } else {
              this.errorMicrofono.set(`Aviso de micrófono: ${event.error}`);
            }
          });
        };

        this.recognition.onend = () => {
          this.ngZone.run(() => {
            // Si el usuario no lo apagó intencionalmente, reconectar si sigue activo
            if (this.estaEscuchando()) {
              try {
                this.recognition.start();
              } catch {
                this.estaEscuchando.set(false);
              }
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

    window.addEventListener('keydown', (event: KeyboardEvent) => {
      // Escape: Silenciar inmediatamente cualquier narración
      if (event.key === 'Escape') {
        if (this.estaHablando()) {
          this.detenerHablar();
          event.preventDefault();
        }
        if (this.modalComandosAbierto()) {
          this.cerrarModalComandos();
          event.preventDefault();
        }
        return;
      }

      // Alt + A: Abrir/Cerrar panel de accesibilidad
      if (event.altKey && (event.key === 'a' || event.key === 'A')) {
        event.preventDefault();
        this.alternarPanel();
        const estado = this.panelAbierto()
          ? 'Panel de accesibilidad abierto'
          : 'Panel de accesibilidad cerrado';
        this.hablar(estado, true);
        return;
      }

      // Alt + N: Narrar contenido de la página actual
      if (event.altKey && (event.key === 'n' || event.key === 'N')) {
        event.preventDefault();
        this.narrarPagina();
        return;
      }

      // Alt + C o Alt + V: Alternar comandos por voz
      if (
        event.altKey &&
        (event.key === 'c' || event.key === 'C' || event.key === 'v' || event.key === 'V')
      ) {
        event.preventDefault();
        this.alternarEscucha();
        return;
      }

      // Alt + S: Detener o silenciar narración
      if (event.altKey && (event.key === 's' || event.key === 'S')) {
        event.preventDefault();
        this.detenerHablar();
        this.hablar('Narración silenciada', true);
        return;
      }
    });
  }

  // --------------------------------------------------------------------------
  // MODO LECTOR INTERACTIVO (HOVER / FOCO CON TECLADO)
  // --------------------------------------------------------------------------

  private configurarModoLectorInteractivo(): void {
    if (typeof window === 'undefined') return;

    const procesarElemento = (el: HTMLElement | null) => {
      if (!this.modoLectorHover() || !el) return;

      // Ignorar si estamos dentro del mismo panel de accesibilidad para evitar redundancia
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

    // Lectura por teclado (Focus)
    window.addEventListener('focusin', (e: FocusEvent) => {
      procesarElemento(e.target as HTMLElement);
    });

    // Lectura por mouse (Hover)
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

    // Encabezados o párrafos
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
  // SÍNTESIS DE VOZ PÚBLICA
  // --------------------------------------------------------------------------

  hablar(texto: string, prioridad = true, callback?: () => void): void {
    if (!this.synthesis || !texto?.trim()) return;

    if (prioridad) {
      this.detenerHablar();
    }

    try {
      const utterance = new SpeechSynthesisUtterance(texto.trim());
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
        });
      };

      utterance.onend = () => {
        this.ngZone.run(() => {
          this.estaHablando.set(false);
          this.currentUtterance = null;
          if (callback) callback();
        });
      };

      utterance.onerror = () => {
        this.ngZone.run(() => {
          this.estaHablando.set(false);
          this.currentUtterance = null;
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

    // Obtener información contextual de la página
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

    // Extraer encabezados visibles
    const encabezados = Array.from(document.querySelectorAll('main h1, main h2, main h3'))
      .map((el) => (el as HTMLElement).innerText.trim())
      .filter((t) => t.length > 0 && t.length < 120)
      .slice(0, 5);

    // Contar productos si existen en la vista
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
  // CONTROL DE ESCUCHA DE COMANDOS DE VOZ
  // --------------------------------------------------------------------------

  iniciarEscucha(): void {
    if (!this.recognition) {
      this.errorMicrofono.set(
        'Tu navegador no soporta reconocimiento de voz. Te recomendamos Google Chrome o Microsoft Edge.',
      );
      this.hablar('Tu navegador no soporta comandos por voz.', true);
      return;
    }

    try {
      this.errorMicrofono.set(null);
      this.recognition.start();
      this.estaEscuchando.set(true);
      this.hablar('Micrófono activado. Te escucho.', true);
    } catch (e) {
      console.warn('Recognition start warning:', e);
    }
  }

  detenerEscucha(): void {
    if (this.recognition) {
      this.estaEscuchando.set(false);
      try {
        this.recognition.stop();
      } catch {}
      this.hablar('Comandos por voz pausados.', true);
    }
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
      this.hablar(
        'Modo lector interactivo activado. Pasando el cursor o con la tecla Tab escucharás los elementos.',
        true,
      );
    } else {
      this.hablar('Modo lector interactivo desactivado.', true);
    }
  }

  alternarPanel(): void {
    this.panelAbierto.update((v) => !v);
  }

  abrirModalComandos(): void {
    this.modalComandosAbierto.set(true);
    this.hablar(
      'Guía de comandos por voz abierta. Puedes decir por ejemplo: ir a catálogo, buscar mangueras, o narrar página.',
      true,
    );
  }

  cerrarModalComandos(): void {
    this.modalComandosAbierto.set(false);
  }

  cambiarVelocidad(nueva: number): void {
    this.velocidad.set(nueva);
    this.hablar(`Velocidad configurada en ${nueva} veces.`, true);
  }

  // --------------------------------------------------------------------------
  // PROCESAMIENTO DE COMANDOS DE VOZ EN ESPAÑOL
  // --------------------------------------------------------------------------

  private procesarComandoVoz(comandoBruto: string): void {
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
      return;
    }

    // 2. Narración de página
    if (
      comando.includes('narrar') ||
      comando.includes('leer página') ||
      comando.includes('leer contenido') ||
      comando.includes('lee la página') ||
      comando.includes('resumen')
    ) {
      this.hablar('Narrando la página.', true, () => {
        this.narrarPagina();
      });
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

    if (comando.includes('cerrar ayuda') || comando.includes('cerrar comandos')) {
      this.cerrarModalComandos();
      this.hablar('Cerrando ayuda.', true);
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
      comando.includes('abrir inicio')
    ) {
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
      comando.includes('ver productos') ||
      comando.includes('abrir catálogo') ||
      comando === 'productos'
    ) {
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
      this.hablar('Abriendo página de inicio de sesión.', true);
      this.router.navigate(['/login']);
      return;
    }

    if (
      comando.includes('registrarse') ||
      comando.includes('registro') ||
      comando.includes('crear cuenta')
    ) {
      this.hablar('Abriendo formulario de registro.', true);
      this.router.navigate(['/registro']);
      return;
    }

    if (comando.includes('mis pedidos') || comando.includes('pedidos')) {
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
      this.hablar('Abriendo tu cuenta.', true);
      this.router.navigate(['/cliente/cuenta']);
      return;
    }

    // 6. Búsqueda por voz
    // Ej: "buscar mangueras", "busca tubería de pvc", "encontrar codos"
    const regexBuscar = /(?:buscar|busca|encontrar|encuentra|consultar|ver)\s+(?:por\s+)?(.+)/i;
    const matchBuscar = comando.match(regexBuscar);
    if (matchBuscar && matchBuscar[1]) {
      const termino = matchBuscar[1]
        .replace(/^(en\s+el\s+catálogo|en\s+el\s+catalogo|productos?)/i, '')
        .trim();

      if (termino && termino !== 'página' && termino !== 'pagina') {
        this.hablar(`Buscando ${termino} en el catálogo.`, true);
        this.router.navigate(['/catalogo'], { queryParams: { q: termino } });
        return;
      }
    }

    // 7. Scroll / Desplazamiento
    if (comando.includes('arriba') || comando.includes('subir') || comando.includes('principio')) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.hablar('Subiendo al principio de la página.', true);
      }
      return;
    }

    if (comando.includes('abajo') || comando.includes('bajar') || comando.includes('final')) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        this.hablar('Bajando al final de la página.', true);
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

    if (comando.includes('velocidad normal')) {
      this.cambiarVelocidad(1.0);
      return;
    }

    // 9. Comando no reconocido
    this.hablar(
      `Comando "${comando}" no reconocido. Puedes decir "ayuda" para escuchar los comandos disponibles.`,
      false,
    );
  }
}
