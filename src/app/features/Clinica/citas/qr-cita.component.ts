import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-qr-cita',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="qr-actions" *ngIf="qrDataUrl">
      <button class="qr-btn qr-btn--pdf" (click)="descargarPDF()">
        <i class="pi pi-file-pdf"></i> Descargar PDF
      </button>
      <button class="qr-btn qr-btn--qr" (click)="descargarQR()">
        <i class="pi pi-qrcode"></i> Solo QR
      </button>
    </div>
    <div class="qr-loading" *ngIf="!qrDataUrl">
      <i class="pi pi-spin pi-spinner"></i> Generando...
    </div>
  `,
  styles: [`
    .qr-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .qr-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.85rem;
      border: none;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    .qr-btn:hover { transform: translateY(-1px); }
    .qr-btn:active { transform: translateY(0); }
    .qr-btn--pdf {
      background: #dc2626;
      color: #fff;
    }
    .qr-btn--pdf:hover { background: #b91c1c; }
    .qr-btn--qr {
      background: #6366f1;
      color: #fff;
    }
    .qr-btn--qr:hover { background: #4f46e5; }
    .qr-loading {
      color: #94a3b8;
      font-size: 0.85rem;
      text-align: center;
      padding: 0.75rem;
    }
  `]
})
export class QrCitaComponent implements OnChanges {
  @Input() cita: any;
  qrDataUrl: string | null = null;

  async ngOnChanges(_changes: SimpleChanges) {
    if (this.cita) {
      const qrPayload = JSON.stringify({ citaId: this.cita.citaId });
      this.qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 300, margin: 2 });
    }
  }

  descargarQR() {
    if (!this.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = this.qrDataUrl;
    a.download = `cita-${this.cita?.citaId || 'qr'}.png`;
    a.click();
  }

  async descargarPDF() {
    if (!this.cita || !this.qrDataUrl) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const c = this.cita;

    // ── Header con gradiente simulado ──
    doc.setFillColor(99, 102, 241); // indigo-500
    doc.rect(0, 0, pageW, 52, 'F');
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(0, 40, pageW, 12, 'F');

    // Logo / título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Comprobante de Cita Médica', pageW / 2, 22, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cita #${c.citaId}`, pageW / 2, 32, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleString('es-HN')}`, pageW / 2, 48, { align: 'center' });

    // ── QR centrado ──
    const qrSize = 50;
    const qrX = (pageW - qrSize) / 2;
    doc.addImage(this.qrDataUrl, 'PNG', qrX, 58, qrSize, qrSize);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('Presente este código QR en recepción para validar su cita', pageW / 2, 113, { align: 'center' });

    // ── Línea separadora ──
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, 118, pageW - 20, 118);

    // ── Información de la cita ──
    let y = 128;
    const leftCol = 25;
    const rightCol = 80;

    const addField = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(label, leftCol, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(value || '—', rightCol, y);
      y += 9;
    };

    const formatFecha = (iso: string) => {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatHora = (iso: string) => {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' }) + ' hrs';
    };

    // Sección: Datos del paciente
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(20, y - 6, pageW - 40, 12, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text('Datos de la Cita', leftCol, y + 2);
    y += 14;

    addField('Paciente:', c.paciente || '—');
    addField('Médico:', c.medico || '—');
    addField('Sala:', c.sala || '—');
    addField('Fecha:', formatFecha(c.inicio));
    addField('Hora Inicio:', formatHora(c.inicio));
    addField('Hora Fin:', formatHora(c.fin));
    addField('Duración:', `${c.duracionMinutos || 0} minutos`);
    addField('Estado:', c.estado || c.codigoEstado || '—');

    // ── Instrucciones ──
    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, y, pageW - 20, y);
    y += 10;

    doc.setFillColor(254, 249, 195); // yellow-100
    doc.roundedRect(20, y - 4, pageW - 40, 32, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(133, 77, 14); // yellow-800
    doc.text('Instrucciones importantes:', leftCol, y + 3);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(113, 63, 18);
    const instrucciones = [
      '• Presente este documento impreso o digital en recepción.',
      '• Llegue al menos 15 minutos antes de su cita.',
      '• En caso de no poder asistir, cancele con anticipación.'
    ];
    instrucciones.forEach(line => {
      doc.text(line, leftCol + 2, y);
      y += 6;
    });

    // ── Footer ──
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, footerY - 5, pageW - 20, footerY - 5);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Este documento es un comprobante digital. El código QR contiene el identificador único de la cita.', pageW / 2, footerY, { align: 'center' });
    doc.text('Sistema de Citas Médicas', pageW / 2, footerY + 4, { align: 'center' });

    // ── Descargar ──
    doc.save(`cita-${c.citaId}-comprobante.pdf`);
  }
}
