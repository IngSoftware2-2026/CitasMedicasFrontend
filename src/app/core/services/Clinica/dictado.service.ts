import { Injectable, NgZone, inject } from '@angular/core';
import { Subject } from 'rxjs';

export interface DictadoEvento {
  texto: string;
  esFinal: boolean;
}

@Injectable({ providedIn: 'root' })
export class DictadoService {
  private zone = inject(NgZone);
  private recognition: any = null;
  private _activo = false;
  private _campoActivo: string | null = null;
  private sessionId = 0; // Evita race conditions entre sesiones

  /** Emite cada fragmento de texto reconocido */
  readonly texto$ = new Subject<DictadoEvento>();

  /** Emite errores del reconocimiento */
  readonly error$ = new Subject<string>();

  /** Emite cuando el dictado se detiene */
  readonly detenido$ = new Subject<void>();

  /** Emite cuando el dictado inicia exitosamente */
  readonly iniciado$ = new Subject<string>();

  get soportado(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  get activo(): boolean { return this._activo; }
  get campoActivo(): string | null { return this._campoActivo; }

  iniciar(campo: string, idioma = 'es'): void {
    if (!this.soportado) {
      this.error$.next('Tu navegador no soporta reconocimiento de voz. Usa Google Chrome.');
      return;
    }

    // Si ya está activo, detener la sesión anterior
    if (this._activo) {
      this.detenerInterno();
    }

    const sid = ++this.sessionId;
    console.log('[Dictado] Iniciando sesión', sid, 'campo:', campo, 'idioma:', idioma);

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = idioma;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this._campoActivo = campo;

    this.recognition.onstart = () => {
      console.log('[Dictado] Reconocimiento iniciado — hable ahora');
      this.zone.run(() => {
        this._activo = true;
        this.iniciado$.next(campo);
      });
    };

    this.recognition.onresult = (event: any) => {
      if (sid !== this.sessionId) return; // Ignorar eventos de sesiones anteriores
      this.zone.run(() => {
        let textoInterino = '';
        let textoFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            textoFinal += transcript;
          } else {
            textoInterino += transcript;
          }
        }

        console.log('[Dictado] resultado — final:', textoFinal || '(vacío)', '| interino:', textoInterino || '(vacío)');

        if (textoFinal) {
          this.texto$.next({ texto: textoFinal, esFinal: true });
        } else if (textoInterino) {
          this.texto$.next({ texto: textoInterino, esFinal: false });
        }
      });
    };

    this.recognition.onerror = (event: any) => {
      if (sid !== this.sessionId) return;
      console.warn('[Dictado] Error:', event.error);
      this.zone.run(() => {
        // 'no-speech' no es fatal — seguir escuchando
        if (event.error === 'no-speech') {
          console.log('[Dictado] No se detectó voz, seguirá escuchando...');
          return;
        }
        const mensajes: Record<string, string> = {
          'audio-capture': 'No se encontró micrófono. Verifica tu dispositivo.',
          'not-allowed': 'Permiso de micrófono denegado. Habilítalo en la barra de dirección del navegador.',
          'network': 'Error de red. El reconocimiento de voz necesita conexión a internet.',
          'aborted': 'Dictado cancelado.',
          'service-not-available': 'Servicio de reconocimiento no disponible. Intenta con Google Chrome.'
        };
        this.error$.next(mensajes[event.error] || `Error de reconocimiento: ${event.error}`);
        this._activo = false;
        this._campoActivo = null;
      });
    };

    this.recognition.onend = () => {
      if (sid !== this.sessionId) {
        console.log('[Dictado] onend de sesión anterior, ignorando');
        return;
      }
      this.zone.run(() => {
        if (this._activo) {
          // continuous mode a veces se detiene solo, reiniciar
          console.log('[Dictado] Reiniciando reconocimiento...');
          try {
            this.recognition.start();
          } catch (e) {
            console.error('[Dictado] No se pudo reiniciar:', e);
            this._activo = false;
            this._campoActivo = null;
            this.detenido$.next();
          }
        } else {
          console.log('[Dictado] Sesión finalizada');
          this._campoActivo = null;
          this.detenido$.next();
        }
      });
    };

    try {
      this.recognition.start();
      // _activo se setea en onstart para confirmar que realmente arrancó
    } catch (e) {
      console.error('[Dictado] Error al iniciar:', e);
      this.error$.next('No se pudo iniciar el reconocimiento de voz. Asegúrate de usar Google Chrome.');
      this._campoActivo = null;
    }
  }

  detener(): void {
    console.log('[Dictado] Deteniendo...');
    this.detenerInterno();
  }

  private detenerInterno(): void {
    this._activo = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch { /* ignore */ }
      this.recognition = null;
    }
    this._campoActivo = null;
  }
}
