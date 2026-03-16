import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthService } from '../../core/services/auth.service';
import { CitasService } from '../../core/services/citas.service';
import { CitasCambiarEstadoRequest } from '../../core/models/Clinica/Citas/citas-cambiar-estado.model';
import { CitasInsertarRequest } from '../../core/models/Clinica/Citas/citas-insertar.model';
import { CitaDetalleResponse, CitaListadoResponse } from '../../core/models/Clinica/Citas/citas-read.model';
import { DoctorListado } from '../../core/models/Clinica/Doctores/doctor-listado.model';
import { PacienteListado } from '../../core/models/Clinica/Pacientes/paciente-listado.model';
import { Sala } from '../../core/models/Catalogos/sala.model';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [FormsModule, DatePipe, TableModule, ButtonModule, DialogModule, InputTextModule, TagModule, ToolbarModule, TooltipModule, DividerModule, IconFieldModule, InputIconModule],
  templateUrl: './citas.component.html',
  styleUrl: './citas.component.css'
})
export class CitasComponent implements OnInit {
  searchCita = '';
  citaDialog = false;
  citaDetailDialog = false;
  citaForm: Record<string, any> = {};
  detailCita: CitaDetalleResponse | null = null;
  citasData: CitaListadoResponse[] = [];
  doctoresData: DoctorListado[] = [];
  pacientesData: PacienteListado[] = [];
  salasData: Sala[] = [];

  get citas() { return this.citasData; }
  get pacientes() { return this.data.pacientes; }
  get doctores() { return this.data.doctores; }
  get salas() { return this.salasData.length ? this.salasData : this.data.salas; }
  get estadosCita() { return this.data.estadosCita; }
  get consultas() { return this.data.consultas; }
  get canManageCitas() { return this.auth.hasPermission('GESTIONAR_CITAS'); }
  get currentUser() { return this.auth.currentUser(); }

  get pacientesFormOptions() {
    const pacientes = new Map<number, string>();

    for (const cita of this.citasData) {
      pacientes.set(cita.pacienteId, cita.paciente ?? this.data.getPacienteNombre(cita.pacienteId));
    }

    return Array.from(pacientes.entries()).map(([pacienteId, nombre]) => ({ pacienteId, nombre }));
  }

  get doctoresFormOptions() {
    const doctores = new Map<number, string>();

    for (const cita of this.citasData) {
      doctores.set(cita.medicoId, cita.medico ?? this.data.getDoctorNombre(cita.medicoId));
    }

    return Array.from(doctores.entries()).map(([medicoId, nombre]) => ({ medicoId, nombre }));
  }

  get citasView() {
    const term = this.searchCita.toLowerCase();
    return this.citas.map(c => ({
      ...c,
      pacienteNombre: c.paciente ?? this.data.getPacienteNombre(c.pacienteId),
      doctorNombre: c.medico ?? this.data.getDoctorNombre(c.medicoId),
      salaNombre: c.sala ?? this.data.getSalaNombre(c.salaId),
      estadoNombre: c.estado ?? this.data.getEstadoCitaNombre(c.estadoId),
      estadoCodigo: c.codigoEstado ?? this.data.getEstadoCitaCodigo(c.estadoId)
    })).filter(c => !term ||
      c.pacienteNombre.toLowerCase().includes(term) ||
      c.doctorNombre.toLowerCase().includes(term) ||
      c.salaNombre.toLowerCase().includes(term) ||
      c.estadoNombre.toLowerCase().includes(term)
    );
  }

  constructor(
    public data: MockDataService,
    private auth: AuthService,
    private citasService: CitasService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.cargarCitas();
    this.cargarDoctores();
    this.cargarPacientes();
    this.cargarSalas();
  }

  cargarCitas(): void {
    this.citasService.obtenerPorFiltro({}).subscribe({
      next: (response) => {
        this.citasData = response.data ?? [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las citas'
        });
      }
    });
  }

  cargarSalas(): void {
    this.citasService.listarSalas().subscribe({
      next: (response) => {
        this.salasData = (response.data ?? []).filter((sala) => sala.activo);
      },
      error: () => {
        this.salasData = [];
      }
    });
  }

  cargarPacientes(): void {
    this.citasService.listarPacientes().subscribe({
      next: (response) => {
        this.pacientesData = response.data ?? [];
      },
      error: () => {
        this.pacientesData = [];
      }
    });
  }

  cargarDoctores(): void {
    this.citasService.listarDoctores().subscribe({
      next: (response) => {
        this.doctoresData = response.data ?? [];
      },
      error: () => {
        this.doctoresData = [];
      }
    });
  }

  countByEstado(estadoId: number): number {
    return this.citas.filter(c => c.estadoId === estadoId).length;
  }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('');
  }

  private toLocalDateTimeValue(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  private getCodigoEstadoCambio(nuevoEstado: number): string {
    switch (nuevoEstado) {
      case 2:
        return 'ATEN';
      case 3:
        return 'ATEN';
      case 4:
        return 'CANC';
      case 5:
        return 'NOAS';
      default:
        return '';
    }
  }

  openCitaDialog(c?: any): void {
    if (c) {
      this.citaForm = { ...c, inicio: this.data.toDateTimeString(c.inicio) };
    } else {
      this.citaForm = { duracionMinutos: 30, estadoId: 1 };
    }
    this.citaDialog = true;
  }

  saveCita(): void {
    if (!this.citaForm['pacienteId'] || !this.citaForm['medicoId'] || !this.citaForm['salaId']) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Paciente, doctor y sala son obligatorios' });
      return;
    }
    const inicio = new Date(this.citaForm['inicio']);
    const duracion = this.citaForm['duracionMinutos'] || 30;
    const fin = new Date(inicio.getTime() + duracion * 60000);

    if (this.citaForm['citaId']) {
      const idx = this.citas.findIndex(c => c.citaId === this.citaForm['citaId']);
      if (idx >= 0) {
        this.citas[idx] = {
          ...this.citas[idx],
          ...this.citaForm,
          inicio: this.toLocalDateTimeValue(inicio),
          fin: this.toLocalDateTimeValue(fin),
          duracionMinutos: duracion
        };
        this.messageService.add({ severity: 'success', summary: 'Actualizada', detail: 'Cita actualizada' });
      }
    } else {
      const request: CitasInsertarRequest = {
        solicitudId: this.citaForm['solicitudId'] ?? null,
        pacienteId: this.citaForm['pacienteId'],
        medicoId: this.citaForm['medicoId'],
        salaId: this.citaForm['salaId'],
        inicio: this.toLocalDateTimeValue(inicio),
        fin: this.toLocalDateTimeValue(fin),
        duracionMinutos: duracion,
        creadaPorUsuarioId: this.currentUser?.usuarioId ?? 1
      };

      this.citasService.insertar(request).subscribe({
        next: (response) => {
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Creada',
              detail: response.message || 'Cita creada'
            });
            this.citaDialog = false;
            this.cargarCitas();
            return;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.message || 'No se pudo crear la cita'
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la cita'
          });
        }
      });
      return;
    }
    this.citaDialog = false;
  }

  cambiarEstadoCita(c: any, nuevoEstado: number): void {
    const citaId = c.citaId ?? c;
    const codigoEstado = this.getCodigoEstadoCambio(nuevoEstado);

    if (!citaId || !codigoEstado) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo determinar el estado a enviar'
      });
      return;
    }

    const request: CitasCambiarEstadoRequest = {
      citaId,
      codigoEstado
    };

    this.citasService.cambiarEstado(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Estado',
            detail: response.message || `Cita ${this.data.getEstadoCitaNombre(nuevoEstado).toLowerCase()}`
          });
          this.cargarCitas();
          return;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: response.message || 'No se pudo actualizar el estado'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado'
        });
      }
    });
  }

  openCitaDetail(c: any): void {
    this.citasService.obtenerPorId(c.citaId).subscribe({
      next: (response) => {
        this.detailCita = response.data ?? null;
        this.citaDetailDialog = true;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el detalle de la cita'
        });
      }
    });
  }

  getConsultaDeCita(citaId: number) {
    return this.consultas.find(c => c.citaId === citaId) ?? null;
  }
}
