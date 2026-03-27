import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/Clinica/mock-data.service';
import { AuthService } from '../../../core/services/Accesos/auth/auth.service';
import { SolicitudesService } from '../../../core/services/Clinica/solicitudes.service';
import { ErrorHandlerService } from '../../../core/services/Http/error-handler.service';
import { DoctorPublicoDTO, SolicitudPublicaInsertarDTO } from '../../../core/models/Clinica/Solicitudes/solicitud-publica.model';
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
  solicitudesMock: any[] = [];

  constructor(public data: MockDataService) {
    this.solicitudesMock = this.data.solicitudes;
  }

  ngOnInit(): void {
    if (this.esPaciente) {
      this.cargarDoctoresPublicos();
    }
  }

  get esPaciente(): boolean {
    return this.auth.esPaciente;
  }

  cargarDoctoresPublicos(): void {
    this.solicitudesService.listarDoctoresPublicos().subscribe({
      next: (response) => {
        this.doctoresPublicos = response.data ?? [];
      },
      error: (error) => {
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
      error: (error) => {
        this.errorHandler.showError(error?.status || 500, 'No se pudo enviar la solicitud');
      }
    });
  }

  countByEstado(estadoId: number): number {
    return this.solicitudesMock.filter(s => s.estadoId === estadoId).length;
  }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('');
  }

  get solicitudesView() {
    const term = this.searchSolicitud.toLowerCase();
    return this.solicitudesMock.map(s => {
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
    const sol = this.solicitudesMock.find((x: any) => x.solicitudId === s.solicitudId);
    if (sol) {
      sol.estadoId = nuevoEstado;
      const nombre = this.data.estadosSolicitud.find(e => e.estadoSolicitudId === nuevoEstado)?.nombreEstado ?? '';
      this.messageService.add({ severity: 'success', summary: 'Estado', detail: `Solicitud ${nombre.toLowerCase()}` });
    }
  }
}
