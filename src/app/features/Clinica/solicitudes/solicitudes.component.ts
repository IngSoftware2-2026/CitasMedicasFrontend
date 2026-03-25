import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/Clinica/mock-data.service';
import { AuthService } from '../../../core/services/Accesos/auth.service';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [DatePipe, FormsModule, TableModule, ButtonModule, TagModule, ToolbarModule, TooltipModule, InputTextModule, IconFieldModule, InputIconModule, DialogModule],
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.css'
})
export class SolicitudesComponent {
  private auth = inject(AuthService);
  private messageService = inject(MessageService);
  
  searchSolicitud = '';
  solicitudDialog = false;
  solicitudForm: any = { medicoId: null, motivo: '' };

  constructor(public data: MockDataService) {}

  get esPaciente(): boolean {
    return this.auth.esPaciente;
  }

  openSolicitudDialog(): void {
    this.solicitudForm = { medicoId: null, motivo: '' };
    this.solicitudDialog = true;
  }

  saveSolicitud(): void {
    if (!this.solicitudForm.medicoId) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Seleccione un doctor' });
      return;
    }
    const nuevaSolicitud = {
      solicitudId: Date.now(),
      pacienteId: 1,
      medicoId: this.solicitudForm.medicoId,
      fechaHoraInicio: new Date().toISOString(),
      duracionMinutos: 30,
      motivo: this.solicitudForm.motivo,
      estadoId: 1,
      fechaCreacion: new Date().toISOString()
    };
    this.data.solicitudes.push(nuevaSolicitud as any);
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Solicitud enviada' });
    this.solicitudDialog = false;
  }

  countByEstado(estadoId: number): number {
    return this.data.solicitudes.filter(s => s.estadoId === estadoId).length;
  }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('');
  }

  get solicitudesView() {
    const term = this.searchSolicitud.toLowerCase();
    return this.data.solicitudes.map(s => {
      const estado = this.data.estadosSolicitud.find(e => e.estadoSolicitudId === s.estadoId);
      return {
        ...s,
        pacienteNombre: this.data.getPacienteNombre(s.pacienteId),
        doctorNombre: this.data.getDoctorNombre(s.medicoId),
        estadoNombre: estado?.nombreEstado ?? '',
        estadoCodigo: estado?.codigoEstado ?? ''
      };
    }).filter(s => !term ||
      s.pacienteNombre.toLowerCase().includes(term) ||
      s.doctorNombre.toLowerCase().includes(term) ||
      (s.motivo ?? '').toLowerCase().includes(term) ||
      s.estadoNombre.toLowerCase().includes(term)
    );
  }

  cambiarEstadoSolicitud(s: any, nuevoEstado: number): void {
    const sol = this.data.solicitudes.find(x => x.solicitudId === s.solicitudId);
    if (sol) {
      sol.estadoId = nuevoEstado;
      const nombre = this.data.estadosSolicitud.find(e => e.estadoSolicitudId === nuevoEstado)?.nombreEstado ?? '';
      this.messageService.add({ severity: 'success', summary: 'Estado', detail: `Solicitud ${nombre.toLowerCase()}` });
    }
  }
}
