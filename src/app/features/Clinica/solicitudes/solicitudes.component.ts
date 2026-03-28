import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/Accesos/auth/auth.service';
import { SolicitudesService } from '../../../core/services/Clinica/solicitudes.service';
import { ErrorHandlerService } from '../../../core/services/Http/error-handler.service';
import {
  DoctorPublicoDTO,
  SolicitudPublicaInsertarDTO,
  SolicitudUnificada,
  CambiarEstadoSolicitudDTO
} from '../../../core/models/Clinica/Solicitudes/solicitud-publica.model';
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
export class SolicitudesComponent implements OnInit {
  private auth = inject(AuthService);
  private messageService = inject(MessageService);
  private solicitudesService = inject(SolicitudesService);
  private errorHandler = inject(ErrorHandlerService);
  
  searchSolicitud = '';
  solicitudDialog = false;
  solicitudForm: any = { medicoId: null, motivo: '' };
  
  doctoresPublicos: DoctorPublicoDTO[] = [];
  solicitudes: SolicitudUnificada[] = [];

  ngOnInit(): void {
    if (this.esPaciente) {
      this.cargarDoctoresPublicos();
    }
    this.cargarSolicitudes();
  }

  get esPaciente(): boolean {
    return this.auth.esPaciente;
  }

  cargarSolicitudes(): void {
    this.solicitudesService.listarPublicas({}).subscribe({
      next: (response) => {
        const publicas: SolicitudUnificada[] = (response.data ?? []).map((s: any) => ({ ...s, tipo: 'PUBLICA' as const }));
        this.solicitudes = publicas;
        this.solicitudesService.listarUsuarios({}).subscribe({
          next: (res) => {
            const usuarios: SolicitudUnificada[] = (res.data ?? []).map((s: any) => ({ ...s, tipo: 'USUARIO' as const }));
            this.solicitudes = [...publicas, ...usuarios];
          },
          error: () => { /* mantener solo las públicas */ }
        });
      },
      error: (error: any) => {
        this.solicitudes = [];
        this.errorHandler.showError(error?.status || 500, 'No se pudieron cargar las solicitudes');
      }
    });
  }

  cargarDoctoresPublicos(): void {
    this.solicitudesService.listarDoctoresPublicos().subscribe({
      next: (response) => {
        this.doctoresPublicos = response.data ?? [];
      },
      error: (error: any) => {
        this.doctoresPublicos = [];
        this.errorHandler.showError(error?.status || 500, 'No se pudieron cargar los doctores');
      }
    });
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
    
    const request: SolicitudPublicaInsertarDTO = {
      nombrePaciente: this.auth.nombreUsuario || 'Paciente',
      telefono: this.auth.telefonoUsuario || '00000000',
      email: this.auth.correoUsuario || undefined,
      medicoId: Number(this.solicitudForm.medicoId),
      fechaHoraInicio: new Date().toISOString(),
      motivo: this.solicitudForm.motivo || undefined
    };

    this.solicitudesService.insertarPublica(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Solicitud enviada' });
          this.solicitudDialog = false;
          return;
        }
        this.errorHandler.showError(400, response.message || 'No se pudo enviar la solicitud');
      },
      error: (error: any) => {
        this.errorHandler.showError(error?.status || 500, 'No se pudo enviar la solicitud');
      }
    });
  }

  countByEstado(estadoId: number): number {
    return this.solicitudes.filter((s: SolicitudUnificada) => s.estadoId === estadoId).length;
  }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('');
  }

  getEstadoSeverity(codigoEstado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (codigoEstado) {
      case 'PEND': return 'warn';
      case 'REVIS': return 'info';
      case 'CONF': return 'success';
      case 'RECH': return 'danger';
      case 'CANC': return 'danger';
      default: return 'secondary';
    }
  }

  get solicitudesView() {
    const term = this.searchSolicitud.toLowerCase();
    return this.solicitudes.map((s: SolicitudUnificada) => ({
      ...s,
      pacienteNombre: s.nombrePaciente,
      doctorNombre: s.medico,
      estadoNombre: s.estado,
      estadoCodigo: s.codigoEstado
    })).filter(s => !term ||
      s.pacienteNombre.toLowerCase().includes(term) ||
      s.doctorNombre.toLowerCase().includes(term) ||
      (s.motivo ?? '').toLowerCase().includes(term) ||
      s.estadoNombre.toLowerCase().includes(term)
    );
  }

  cambiarEstadoSolicitud(s: any, nuevoEstado: number): void {
    const codigoMap: Record<number, string> = { 1: 'PEND', 2: 'REVIS', 3: 'CONF', 4: 'RECH', 5: 'CANC' };
    const codigoEstado = codigoMap[nuevoEstado] ?? 'PEND';
    const dto: CambiarEstadoSolicitudDTO = { solicitudId: s.solicitudId, codigoEstado };

    const cambiar$ = s.tipo === 'PUBLICA'
      ? this.solicitudesService.cambiarEstadoPublica(dto)
      : this.solicitudesService.cambiarEstadoUsuario(dto);

    cambiar$.subscribe({
      next: (response: any) => {
        if (response.success) {
          this.messageService.add({ severity: 'success', summary: 'Estado', detail: 'Solicitud actualizada' });
          this.cargarSolicitudes();
        } else {
          this.errorHandler.showError(400, response.message || 'No se pudo cambiar el estado');
        }
      },
      error: (error: any) => {
        this.errorHandler.showError(error?.status || 500, 'No se pudo cambiar el estado');
      }
    });
  }
}
