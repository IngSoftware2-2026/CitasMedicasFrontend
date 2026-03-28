import { Component, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CitasService } from '../../../core/services/Clinica/citas.service';
import { CitaDetalleResponse } from '../../../core/models/Clinica/Citas/citas-read.model';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

@Component({
  selector: 'app-qr-recepcion',
  standalone: true,
  imports: [CommonModule, DatePipe, TagModule, ButtonModule, InputTextModule, FormsModule, ZXingScannerModule],
  template: `
    <div class="recepcion-container">
      <div class="recepcion-header">
        <i class="pi pi-qrcode recepcion-icon"></i>
        <div>
          <h2>Recepción - Validación de Citas</h2>
          <p>Escanea o ingresa el código QR para validar la cita del paciente.</p>
        </div>
      </div>

      <!-- Input manual -->
      <div class="recepcion-input-section">
        <h3><i class="pi pi-search"></i> Buscar cita</h3>
        <div class="recepcion-input-row">
          <input pInputText [(ngModel)]="inputQr" placeholder="Ingresa el número de cita" class="recepcion-input" (keydown.enter)="procesarInput()" />
          <p-button label="Validar" icon="pi pi-check" (onClick)="procesarInput()" />
        </div>
      </div>

      <!-- Scanner QR con cámara real -->
      <div class="recepcion-camera-section">
        <h3><i class="pi pi-camera"></i> Escanear con cámara</h3>
        <div class="camera-wrapper">
          <zxing-scanner
            *ngIf="scannerActivo"
            [enable]="scannerActivo"
            (scanSuccess)="onScanSuccess($event)"
            (camerasFound)="onCamerasFound($event)"
            (permissionResponse)="onPermission($event)"
            class="scanner-video"
          ></zxing-scanner>
          <p class="scanner-hint" *ngIf="scannerActivo">Apunta la cámara al código QR de la cita</p>
          <p-button
            [label]="scannerActivo ? 'Detener cámara' : 'Activar cámara'"
            [icon]="scannerActivo ? 'pi pi-stop' : 'pi pi-video'"
            (onClick)="toggleScanner()"
          />
        </div>
      </div>

      <!-- Loading -->
      <div class="recepcion-loading" *ngIf="cargando">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Consultando datos de la cita...</span>
      </div>

      <!-- Resultado de validación con datos reales -->
      <div class="recepcion-validacion" *ngIf="validacion && !cargando">
        <h3><i class="pi pi-shield"></i> Resultado de Validación</h3>
        <div class="validacion-card" [class.valida]="esValida" [class.invalida]="!esValida">
          <div class="validacion-icon">
            <i [class]="esValida ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
          </div>
          <div class="validacion-info">
            <h4>{{ esValida ? '✅ Cita Válida' : '❌ Cita No Válida' }}</h4>
            <p *ngIf="mensajeValidacion">{{ mensajeValidacion }}</p>
          </div>
        </div>

        <!-- Datos reales de la cita -->
        <div class="cita-data-grid">
          <div class="cita-data-item"><strong>Cita #</strong>{{ validacion.citaId }}</div>
          <div class="cita-data-item"><strong>Paciente</strong>{{ validacion.paciente || (validacion.nombres + ' ' + validacion.apellidos) }}</div>
          <div class="cita-data-item"><strong>Médico</strong>{{ validacion.medico || '—' }}</div>
          <div class="cita-data-item"><strong>Sala</strong>{{ validacion.sala || '—' }}</div>
          <div class="cita-data-item"><strong>Inicio</strong>{{ validacion.inicio | date:'dd/MM/yyyy HH:mm' }}</div>
          <div class="cita-data-item"><strong>Fin</strong>{{ validacion.fin | date:'dd/MM/yyyy HH:mm' }}</div>
          <div class="cita-data-item"><strong>Duración</strong>{{ validacion.duracionMinutos }} minutos</div>
          <div class="cita-data-item">
            <strong>Estado</strong>
            <p-tag [value]="validacion.estado || ''" [severity]="getEstadoSeverity(validacion.codigoEstado)" [rounded]="true" />
          </div>
        </div>
      </div>

      <!-- Error -->
      <div class="recepcion-error" *ngIf="error">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ error }}</span>
      </div>
    </div>
  `,
  styles: [`
    .recepcion-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .recepcion-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #fff;
      padding: 1.5rem;
      border-radius: 12px;
    }
    .recepcion-header h2 { margin: 0; font-size: 1.4rem; }
    .recepcion-header p { margin: 0.25rem 0 0; opacity: 0.85; font-size: 0.9rem; }
    .recepcion-icon { font-size: 2.5rem; }
    .recepcion-input-section, .recepcion-camera-section, .recepcion-validacion {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
    }
    .recepcion-input-section h3, .recepcion-camera-section h3, .recepcion-validacion h3 {
      margin: 0 0 1rem;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .recepcion-input-row {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    .recepcion-input {
      flex: 1;
      font-size: 0.95rem;
    }
    .camera-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    .scanner-video {
      width: 100%;
      max-width: 400px;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #6366f1;
    }
    .scanner-hint {
      color: #64748b;
      font-size: 0.85rem;
      margin: 0;
    }
    .recepcion-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1.25rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      color: #6366f1;
      font-size: 0.95rem;
    }
    .recepcion-loading i { font-size: 1.3rem; }
    .cita-data-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .cita-data-item {
      padding: 0.6rem 0.85rem;
      background: #f1f5f9;
      border-radius: 6px;
      font-size: 0.9rem;
    }
    .cita-data-item strong {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 0.15rem;
    }
    .validacion-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      border-radius: 10px;
    }
    .validacion-card.valida {
      background: #f0fdf4;
      border: 1px solid #86efac;
    }
    .validacion-card.invalida {
      background: #fef2f2;
      border: 1px solid #fca5a5;
    }
    .validacion-icon i { font-size: 2rem; }
    .valida .validacion-icon i { color: #22c55e; }
    .invalida .validacion-icon i { color: #ef4444; }
    .validacion-info h4 { margin: 0 0 0.25rem; font-size: 1.1rem; }
    .validacion-info p { margin: 0; color: #64748b; }
    .recepcion-error {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 8px;
      color: #dc2626;
    }
    .recepcion-error i { font-size: 1.3rem; }
  `]
})
export class QrRecepcionComponent implements OnDestroy {
  inputQr = '';
  validacion: CitaDetalleResponse | null = null;
  esValida = false;
  mensajeValidacion = '';
  error = '';
  cargando = false;
  scannerActivo = false;
  camarasDisponibles: MediaDeviceInfo[] = [];

  constructor(private citasService: CitasService) {}

  ngOnDestroy() {
    this.scannerActivo = false;
  }

  toggleScanner() {
    this.scannerActivo = !this.scannerActivo;
  }

  onCamerasFound(devices: MediaDeviceInfo[]) {
    this.camarasDisponibles = devices;
  }

  onPermission(granted: boolean) {
    if (!granted) {
      this.error = 'No se otorgó permiso para usar la cámara. Verifica los permisos del navegador.';
      this.scannerActivo = false;
    }
  }

  onScanSuccess(resultText: string) {
    if (!resultText || this.cargando) return;
    // Pausar el scanner para evitar lecturas repetidas
    this.scannerActivo = false;
    this.inputQr = resultText;
    this.procesarInput();
  }

  procesarInput() {
    this.error = '';
    this.validacion = null;

    if (!this.inputQr.trim()) {
      this.error = 'Por favor ingresa el contenido del QR o un ID de cita.';
      return;
    }

    // Intentar parsear como JSON (contenido del QR)
    try {
      const parsed = JSON.parse(this.inputQr.trim());
      if (parsed.citaId) {
        this.validarCita(parsed.citaId);
        return;
      }
    } catch {
      // No es JSON, intentar como número (ID de cita)
    }

    const citaId = parseInt(this.inputQr.trim(), 10);
    if (!isNaN(citaId)) {
      this.validarCita(citaId);
      return;
    }

    this.error = 'Formato inválido. Ingresa un JSON de QR o un ID de cita numérico.';
  }

  validarCita(citaId: number) {
    if (!citaId) {
      this.error = 'El QR no contiene un ID de cita válido.';
      return;
    }

    this.cargando = true;
    this.citasService.obtenerPorId(citaId).subscribe({
      next: (resp) => {
        this.cargando = false;
        if (resp.data) {
          this.validacion = resp.data;
          this.evaluarValidacion(resp.data);
        } else {
          this.esValida = false;
          this.mensajeValidacion = 'No se encontró la cita en el sistema.';
          this.validacion = null;
        }
      },
      error: (err) => {
        this.cargando = false;
        this.esValida = false;
        this.error = `Error al validar la cita: ${err?.error?.message || err?.message || 'Error desconocido'}`;
      }
    });
  }

  evaluarValidacion(cita: CitaDetalleResponse) {
    const codigo = cita.codigoEstado?.toUpperCase();

    if (codigo === 'CANC') {
      this.esValida = false;
      this.mensajeValidacion = 'La cita fue CANCELADA. No puede ser atendida.';
      return;
    }

    if (codigo === 'NOAT') {
      this.esValida = false;
      this.mensajeValidacion = 'El paciente NO ASISTIÓ a esta cita.';
      return;
    }

    if (codigo === 'ATEN') {
      this.esValida = false;
      this.mensajeValidacion = 'La cita ya fue ATENDIDA previamente.';
      return;
    }

    if (codigo === 'CONF' || codigo === 'PEND') {
      this.esValida = true;
      this.mensajeValidacion = codigo === 'CONF'
        ? 'La cita está CONFIRMADA y lista para ser atendida.'
        : 'La cita está PENDIENTE de confirmación. Verifique con el paciente.';
      return;
    }

    this.esValida = true;
    this.mensajeValidacion = `Estado actual: ${cita.estado || codigo}`;
  }

  getEstadoSeverity(codigo?: string | null): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (codigo?.toUpperCase()) {
      case 'CONF': return 'success';
      case 'PEND': return 'warn';
      case 'ATEN': return 'info';
      case 'CANC': return 'danger';
      case 'NOAT': return 'secondary';
      default: return undefined;
    }
  }
}
