import { ChangeDetectorRef, Component, OnInit, OnDestroy, signal, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ConsultaService } from '../../../core/services/Clinica/consulta.service';
import { Consulta } from '../../../core/models/Clinica/Citas/consulta.model';
import { CitasService } from '../../../core/services/Clinica/citas.service';
import { CitaListadoResponse } from '../../../core/models/Clinica/Citas/citas-read.model';

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [FormsModule, DatePipe, ButtonModule, DialogModule, InputTextModule, TagModule, CardModule, ToolbarModule, DividerModule, TextareaModule, TooltipModule],
  templateUrl: './consultas.component.html',
  styleUrl: './consultas.component.css'
})
export class ConsultasComponent implements OnInit, OnDestroy {
  consultaDialog = false;
  consultaForm: Record<string, any> = {};
  consultas = signal<Consulta[]>([]);

  // ── Dictado por voz ──
  private recognition: any = null;
  dictadoCampo: string | null = null;
  dictadoActivo = false;
  textoInterino = '';
  dictadoSoportado = ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  citasDisponibles: CitaListadoResponse[] = [];

  constructor(
    private consultaService: ConsultaService,
    private citasService: CitasService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService) {}

  ngOnInit(): void {
    this.cargarConsultas();
    this.cargarCitas();
  }

  ngOnDestroy(): void {
    this.detenerDictado();
  }

  // ── Métodos de dictado (directos, sin servicio intermedio) ──

  toggleDictado(campo: string): void {
    console.log('[Dictado] toggle campo:', campo, '| activo:', this.dictadoActivo, '| campoActual:', this.dictadoCampo);
    if (this.dictadoActivo && this.dictadoCampo === campo) {
      this.detenerDictado();
    } else {
      this.iniciarDictado(campo);
    }
  }

  esDictandoCampo(campo: string): boolean {
    return this.dictadoActivo && this.dictadoCampo === campo;
  }

  iniciarDictado(campo: string): void {
    // Limpiar sesión anterior si existe
    this.detenerDictado();

    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      this.messageService.add({ severity: 'warn', summary: 'No soportado', detail: 'Tu navegador no soporta dictado por voz. Usa Google Chrome.' });
      return;
    }

    this.dictadoCampo = campo;
    this.dictadoActivo = true;
    this.messageService.add({ severity: 'info', summary: 'Micrófono', detail: 'Solicitando permiso...', life: 2000 });
    this.cdr.detectChanges();

    // Solicitar permiso de micrófono ANTES de iniciar reconocimiento
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        console.log('[Dictado] Permiso de micrófono concedido');
        // Detener el stream — solo lo usamos para pedir permiso
        stream.getTracks().forEach(t => t.stop());
        this.crearReconocimiento(campo);
      })
      .catch(err => {
        console.error('[Dictado] Permiso de micrófono denegado:', err);
        this.zone.run(() => {
          this.messageService.add({
            severity: 'error',
            summary: 'Micrófono bloqueado',
            detail: 'Permite el acceso al micrófono. Haz clic en el candado de la barra de direcciones → Micrófono → Permitir → Recarga la página.',
            life: 8000
          });
          this.dictadoActivo = false;
          this.dictadoCampo = null;
          this.cdr.detectChanges();
        });
      });
  }

  private crearReconocimiento(campo: string): void {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const rec = new SR();
    rec.lang = 'es';
    rec.continuous = false;      // Sesiones cortas — más estable en Chrome
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    this.recognition = rec;

    rec.onstart = () => {
      console.log('[Dictado] ✅ Escuchando — hable ahora');
    };

    rec.onresult = (event: any) => {
      this.zone.run(() => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            console.log('[Dictado] 📝 Texto:', transcript);
            const actual = (this.consultaForm[campo] || '').trim();
            this.consultaForm[campo] = actual + (actual ? ' ' : '') + transcript.trim();
            this.textoInterino = '';
          } else {
            this.textoInterino = transcript;
          }
        }
        this.cdr.detectChanges();
      });
    };

    rec.onerror = (event: any) => {
      console.warn('[Dictado] Error:', event.error);
      this.zone.run(() => {
        // Estos errores no son fatales — reiniciar silenciosamente
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        const mensajes: Record<string, string> = {
          'audio-capture': 'No se detectó micrófono. Conecta uno y recarga la página.',
          'not-allowed': 'Permiso de micrófono denegado. Haz clic en el candado de la barra de direcciones y permite el micrófono.',
          'network': 'Error de red. El dictado necesita conexión a internet.',
          'service-not-available': 'Servicio no disponible. Usa Google Chrome actualizado.'
        };
        this.messageService.add({
          severity: 'error',
          summary: 'Error de micrófono',
          detail: mensajes[event.error] || `Error: ${event.error}`,
          life: 6000
        });
        this.dictadoActivo = false;
        this.dictadoCampo = null;
        this.cdr.detectChanges();
      });
    };

    rec.onend = () => {
      this.zone.run(() => {
        if (this.dictadoActivo && this.dictadoCampo === campo) {
          // Reiniciar con nueva instancia después de un pequeño delay
          console.log('[Dictado] Reiniciando sesión...');
          setTimeout(() => {
            if (this.dictadoActivo && this.dictadoCampo === campo) {
              this.crearReconocimiento(campo);
            }
          }, 300);
        } else {
          this.dictadoCampo = null;
          this.textoInterino = '';
          this.cdr.detectChanges();
        }
      });
    };

    try {
      rec.start();
      console.log('[Dictado] start() llamado');
    } catch (e) {
      console.error('[Dictado] Error al iniciar:', e);
      // Reintentar con delay
      setTimeout(() => {
        if (this.dictadoActivo) {
          this.crearReconocimiento(campo);
        }
      }, 500);
    }
  }

  detenerDictado(): void {
    this.dictadoActivo = false;
    this.textoInterino = '';
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
      this.recognition = null;
    }
    this.dictadoCampo = null;
  }

  probarMicrofono(): void {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Google Chrome.');
      return;
    }

    this.messageService.add({ severity: 'info', summary: 'Micrófono', detail: 'Solicitando permiso...', life: 2000 });

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(t => t.stop());

        const test = new SR();
        test.lang = 'es';
        test.interimResults = false;
        test.maxAlternatives = 1;

        this.messageService.add({ severity: 'info', summary: 'Prueba de micrófono', detail: 'Diga algo en los próximos 5 segundos...', life: 5000 });

        test.onresult = (e: any) => {
          const texto = e.results[0][0].transcript;
          console.log('[Dictado] ✅ Prueba exitosa:', texto);
          this.zone.run(() => {
            this.messageService.add({ severity: 'success', summary: 'Micrófono funciona', detail: `Reconocido: "${texto}"`, life: 5000 });
            this.cdr.detectChanges();
          });
        };
        test.onerror = (e: any) => {
          console.error('[Dictado] ❌ Prueba falló:', e.error);
          this.zone.run(() => {
            this.messageService.add({ severity: 'error', summary: 'Prueba fallida', detail: `Error: ${e.error}. Verifica que uses Chrome, tengas micrófono conectado e internet.`, life: 8000 });
            this.cdr.detectChanges();
          });
        };
        test.onend = () => console.log('[Dictado] Prueba terminada');
        test.start();
      })
      .catch(err => {
        console.error('[Dictado] Permiso de micrófono denegado:', err);
        this.zone.run(() => {
          this.messageService.add({
            severity: 'error',
            summary: 'Micrófono bloqueado',
            detail: 'Permite el acceso al micrófono en la barra de direcciones del navegador.',
            life: 8000
          });
        });
      });
  }

  cargarConsultas(): void {
    this.consultaService.obtenerConsultas().subscribe({
      next: (data) => {
        this.consultas.set(data);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al listar pacientes - Status:', err.status);
        console.error('Error al listar pacientes - Body:', err.error);
        console.error('Error al listar pacientes - Headers:', err.headers);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pacientes' });
        this.cdr.markForCheck();
      }
    });
  }

  cargarCitas(): void {
    this.citasService.obtenerPorFiltro({}).subscribe({
      next: (res) => {
        this.citasDisponibles = res.data || [];
        console.log('Citas cargadas:', this.citasDisponibles.length);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al listar citas:', err.status, err.error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las citas' });
        this.cdr.markForCheck();
      }
    });
  }

  openConsultaDialog(c?: any): void {
    this.consultaForm = c ? { ...c } : {};
    this.consultaDialog = true;
  }

  
  saveConsulta(): void {
    console.log('saveConsulta llamado, form:', JSON.stringify(this.consultaForm));
    if (!this.consultaForm['citaId']) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Debe seleccionar una cita', life: 5000 });
      return;
    }
    
    if (this.consultaForm['consultaId']) {
      const payload: any = {
        consultaId: Number(this.consultaForm['consultaId']),
        motivo: this.consultaForm['motivo'] || null,
        notas: this.consultaForm['notas'],
        tratamiento: this.consultaForm['tratamiento'] || null
      };
      console.log('Editando consulta:', payload);
      this.consultaService.editar(payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Consulta actualizada' });
          this.consultaDialog = false;
          this.cdr.detectChanges();
          this.cargarConsultas();
        },
        error: (err) => {
          console.error('Error al editar:', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.mensaje || 'No se pudo actualizar la consulta' });
        }
      });
    } else {
      const payload: any = {
        citaId: Number(this.consultaForm['citaId']),
        motivo: this.consultaForm['motivo'] || null,
        notas: this.consultaForm['notas'] || null,
        tratamiento: this.consultaForm['tratamiento'] || null
      };
      console.log('Insertando consulta:', payload);
      this.consultaService.insertar(payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Consulta creada' });
          this.consultaDialog = false;
          this.cdr.detectChanges();
          this.cargarConsultas();
          this.cargarCitas();
        },
        error: (err) => {
          console.error('Error al crear:', err);
          const msg = err?.error?.message || err?.error?.mensaje || 'No se pudo crear la consulta';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
        }
      });
    }
  }
  
  imprimirConsulta(consulta: any): void {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Consulta Médica #${consulta.consultaId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          p { margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>Consulta Médica #${consulta.consultaId}</h1>
        <p><strong>Fecha:</strong> ${new Date(consulta.fecha).toLocaleString()}</p>
        <p><strong>Cita:</strong> #${consulta.citaId}</p>
        <p><strong>Motivo:</strong> ${consulta.motivo || 'N/A'}</p>
        <p><strong>Notas:</strong> ${consulta.notas || 'N/A'}</p>
        <p><strong>Tratamiento:</strong> ${consulta.tratamiento || 'N/A'}</p>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
  
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  
    iframe.contentWindow?.document.write(printContent);
    iframe.contentWindow?.document.close();
  }
  
  
  
}
