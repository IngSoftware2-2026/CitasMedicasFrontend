import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CitasService } from '../../../core/services/Clinica/citas.service';
import { CitaDetalleResponse } from '../../../core/models/Clinica/Citas/citas-read.model';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-qr-recepcion',
  standalone: true,
  imports: [CommonModule, DatePipe, TagModule, ButtonModule, InputTextModule, FormsModule],
  template: `
    <div class="recepcion-container">
      <div class="recepcion-header">
        <i class="pi pi-qrcode recepcion-icon"></i>
        <div>
          <h2>Recepción - Validación de Citas</h2>
          <p>Escanea o ingresa el código QR para validar la cita del paciente.</p>
        </div>
      </div>

      <!-- Input manual para ingresar ID de cita o pegar JSON del QR -->
      <div class="recepcion-input-section">
        <h3><i class="pi pi-search"></i> Buscar cita</h3>
        <div class="recepcion-input-row">
          <input pInputText [(ngModel)]="inputQr" placeholder="Pega aquí el contenido del QR o ingresa el ID de cita" class="recepcion-input" />
          <p-button label="Validar" icon="pi pi-check" (onClick)="procesarInput()" />
        </div>
      </div>

      <!-- Sección de cámara QR -->
      <div class="recepcion-camera-section">
        <h3><i class="pi pi-camera"></i> Escanear con cámara</h3>
        <div class="camera-wrapper">
          <video #videoElement class="camera-video"></video>
          <p-button [label]="cameraActiva ? 'Detener cámara' : 'Activar cámara'" [icon]="cameraActiva ? 'pi pi-stop' : 'pi pi-video'" (onClick)="toggleCamera()" />
        </div>
      </div>

      <!-- Datos decodificados del QR -->
      <div class="recepcion-qr-data" *ngIf="qrData">
        <h3><i class="pi pi-file"></i> Datos del QR</h3>
        <div class="qr-data-grid">
          <div class="qr-data-item"><strong>Cita #</strong>{{ qrData.citaId }}</div>
          <div class="qr-data-item"><strong>Paciente</strong>{{ qrData.paciente || 'N/A' }}</div>
          <div class="qr-data-item"><strong>Médico</strong>{{ qrData.medico || 'N/A' }}</div>
          <div class="qr-data-item"><strong>Sala</strong>{{ qrData.sala || 'N/A' }}</div>
          <div class="qr-data-item"><strong>Inicio</strong>{{ qrData.inicio }}</div>
          <div class="qr-data-item"><strong>Estado</strong>{{ qrData.estado || 'N/A' }}</div>
        </div>
      </div>

      <!-- Resultado de validación -->
      <div class="recepcion-validacion" *ngIf="validacion">
        <h3><i class="pi pi-shield"></i> Resultado de Validación</h3>
        <div class="validacion-card" [class.valida]="esValida" [class.invalida]="!esValida">
          <div class="validacion-icon">
            <i [class]="esValida ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
          </div>
          <div class="validacion-info">
            <h4>{{ esValida ? '✅ Cita Válida' : '❌ Cita No Válida' }}</h4>
            <p *ngIf="mensajeValidacion">{{ mensajeValidacion }}</p>
            <div class="validacion-detalle" *ngIf="validacion">
              <span><strong>ID:</strong> {{ validacion.citaId }}</span>
              <span><strong>Paciente:</strong> {{ validacion.paciente || (validacion.nombres + ' ' + validacion.apellidos) }}</span>
              <span><strong>Médico:</strong> {{ validacion.medico }}</span>
              <span><strong>Sala:</strong> {{ validacion.sala }}</span>
              <span><strong>Inicio:</strong> {{ validacion.inicio | date:'dd/MM/yyyy HH:mm' }}</span>
              <span><strong>Fin:</strong> {{ validacion.fin | date:'dd/MM/yyyy HH:mm' }}</span>
              <span><strong>Estado:</strong>
                <p-tag [value]="validacion.estado || ''" [severity]="getEstadoSeverity(validacion.codigoEstado)" [rounded]="true" />
              </span>
            </div>
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
    .recepcion-input-section, .recepcion-camera-section, .recepcion-qr-data, .recepcion-validacion {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
    }
    .recepcion-input-section h3, .recepcion-camera-section h3, .recepcion-qr-data h3, .recepcion-validacion h3 {
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
    .camera-video {
      width: 100%;
      max-width: 400px;
      border-radius: 8px;
      border: 2px solid #e2e8f0;
      background: #000;
    }
    .qr-data-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    .qr-data-item {
      padding: 0.5rem 0.75rem;
      background: #f1f5f9;
      border-radius: 6px;
      font-size: 0.9rem;
    }
    .qr-data-item strong {
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
    .validacion-icon i {
      font-size: 2rem;
    }
    .valida .validacion-icon i { color: #22c55e; }
    .invalida .validacion-icon i { color: #ef4444; }
    .validacion-info h4 { margin: 0 0 0.5rem; font-size: 1.1rem; }
    .validacion-info p { margin: 0 0 0.5rem; color: #64748b; }
    .validacion-detalle {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.9rem;
    }
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
export class QrRecepcionComponent {
  inputQr = '';
  qrData: any = null;
  validacion: CitaDetalleResponse | null = null;
  esValida = false;
  mensajeValidacion = '';
  error = '';
  cameraActiva = false;
  private stream: MediaStream | null = null;

  constructor(private citasService: CitasService) {}

  procesarInput() {
    this.error = '';
    this.validacion = null;
    this.qrData = null;

    if (!this.inputQr.trim()) {
      this.error = 'Por favor ingresa el contenido del QR o un ID de cita.';
      return;
    }

    // Intentar parsear como JSON (contenido del QR)
    try {
      const parsed = JSON.parse(this.inputQr.trim());
      this.qrData = parsed;
      this.validarCita(parsed.citaId);
      return;
    } catch {
      // No es JSON, intentar como número (ID de cita)
    }

    const citaId = parseInt(this.inputQr.trim(), 10);
    if (!isNaN(citaId)) {
      this.qrData = { citaId };
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

    this.citasService.obtenerPorId(citaId).subscribe({
      next: (resp) => {
        if (resp.data) {
          this.validacion = resp.data;
          this.evaluarValidacion(resp.data);
        } else {
          this.esValida = false;
          this.mensajeValidacion = 'No se encontró la cita en el sistema.';
        }
      },
      error: (err) => {
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

  async toggleCamera() {
    if (this.cameraActiva) {
      this.detenerCamera();
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.querySelector('.camera-video') as HTMLVideoElement;
      if (video) {
        video.srcObject = this.stream;
        video.play();
      }
      this.cameraActiva = true;
    } catch {
      this.error = 'No se pudo acceder a la cámara. Verifica los permisos del navegador.';
    }
  }

  detenerCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.cameraActiva = false;
  }
}
