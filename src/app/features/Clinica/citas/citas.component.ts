import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MockDataService } from '../../../core/services/Clinica/mock-data.service';
import { AuthService } from '../../../core/services/Accesos/auth.service';
import { CitasService } from '../../../core/services/Clinica/citas.service';
import { ErrorHandlerService } from '../../../core/services/Http/error-handler.service';
import { CitasCambiarEstadoRequest } from '../../../core/models/Clinica/Citas/citas-cambiar-estado.model';
import { CitasFiltroRequest } from '../../../core/models/Clinica/Citas/citas-filtro.model';
import { CitasInsertarRequest } from '../../../core/models/Clinica/Citas/citas-insertar.model';
import { CitaDetalleResponse, CitaListadoResponse } from '../../../core/models/Clinica/Citas/citas-read.model';
import { DoctorListado } from '../../../core/models/Clinica/Doctores/doctor-listado.model';
import { PacienteListado } from '../../../core/models/Clinica/Pacientes/paciente-listado.model';
import { Sala } from '../../../core/models/Catalogos/sala.model';
import { ConfirmationService, MessageService } from 'primeng/api';
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
  showAdvancedFilters = false;
  citaDialog = false;
  citaDetailDialog = false;
  citaForm: Record<string, any> = {};
  filtros: {
    pacienteId: number | null;
    medicoId: number | null;
    estadoId: number | null;
    salaId: number | null;
    desde: string | null;
    hasta: string | null;
  } = {
    pacienteId: null,
    medicoId: null,
    estadoId: null,
    salaId: null,
    desde: null,
    hasta: null
  };
  readonly estadosFiltro = [
    { estadoId: 1, nombreEstado: 'Pendiente' },
    { estadoId: 2, nombreEstado: 'Confirmada' },
    { estadoId: 3, nombreEstado: 'Atendida' },
    { estadoId: 4, nombreEstado: 'Cancelada' },
    { estadoId: 5, nombreEstado: 'No asistió' }
  ];
  detailCita: CitaDetalleResponse | null = null;
  citasData: CitaListadoResponse[] = [];
  doctoresData: DoctorListado[] = [];
  pacientesData: PacienteListado[] = [];
  salasData: Sala[] = [];

  get citas() { return this.citasData; }
  get salas() { return this.salasData; }
  get consultas() { return this.data.consultas; }
  get canManageCitas() {
    const rolId = this.auth.rolIdActual();
    return rolId === 1 || rolId === 3;
  }
  get currentUser() {
    const usuarioId = this.auth.usuarioIdActual();
    return usuarioId ? { usuarioId } : null;
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
    private errorHandler: ErrorHandlerService,
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
    this.citasService.obtenerPorFiltro(this.buildFiltroRequest()).subscribe({
      next: (response) => {
        this.citasData = response.data ?? [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.getErrorMessage(error, 'No se pudieron cargar las citas')
        });
      }
    });
  }

  cargarSalas(): void {
    this.citasService.listarSalas().subscribe({
      next: (response) => {
        this.salasData = (response.data ?? []).filter((sala) => sala.activo);
      },
      error: (error) => {
        this.salasData = [];
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.getErrorMessage(error, 'No se pudieron cargar las salas')
        });
      }
    });
  }

  cargarPacientes(): void {
    this.citasService.listarPacientes().subscribe({
      next: (response) => {
        this.pacientesData = response.data ?? [];
      },
      error: (error) => {
        this.pacientesData = [];
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.getErrorMessage(error, 'No se pudieron cargar los pacientes')
        });
      }
    });
  }

  cargarDoctores(): void {
    this.citasService.listarDoctores().subscribe({
      next: (response) => {
        this.doctoresData = response.data ?? [];
      },
      error: (error) => {
        this.doctoresData = [];
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.getErrorMessage(error, 'No se pudieron cargar los doctores')
        });
      }
    });
  }

  countByCodigoEstado(codigoEstado: string): number {
    return this.citas.filter(c => c.codigoEstado === codigoEstado).length;
  }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('');
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  aplicarFiltros(): void {
    this.cargarCitas();
  }

  limpiarFiltros(): void {
    this.filtros = {
      pacienteId: null,
      medicoId: null,
      estadoId: null,
      salaId: null,
      desde: null,
      hasta: null
    };

    this.cargarCitas();
  }

  private toLocalDateTimeValue(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  private buildFiltroRequest(): CitasFiltroRequest {
    return {
      pacienteId: this.normalizeId(this.filtros.pacienteId),
      medicoId: this.normalizeId(this.filtros.medicoId),
      estadoId: this.normalizeId(this.filtros.estadoId),
      salaId: this.normalizeId(this.filtros.salaId),
      desde: this.filtros.desde ? `${this.filtros.desde}T00:00:00` : null,
      hasta: this.filtros.hasta ? `${this.filtros.hasta}T23:59:59` : null
    };
  }

  private normalizeId(value: number | null): number | null {
    const numericValue = Number(value);
    return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
  }

  private getErrorMessage(error: any, fallback: string): string {
    const message = error?.error?.message
      ?? error?.error?.Message
      ?? error?.error?.data?.message
      ?? error?.error?.data?.Message
      ?? error?.error?.data?.messageStatus
      ?? error?.error?.data?.MessageStatus
      ?? error?.error?.mensaje
      ?? error?.message
      ?? fallback;

    const normalized = String(message).toLowerCase();

    if (normalized.includes('doctor') && (normalized.includes('ocup') || normalized.includes('franja') || normalized.includes('horario'))) {
      return 'El doctor ya tiene una cita en ese horario';
    }

    if (normalized.includes('sala') && (normalized.includes('ocup') || normalized.includes('franja') || normalized.includes('horario'))) {
      return 'La sala ya está ocupada en ese horario';
    }

    return message;
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

  openCitaDialog(): void {
    this.citaForm = { duracionMinutos: 30 };
    this.citaDialog = true;
  }

  saveCita(): void {
    const pacienteId = Number(this.citaForm['pacienteId']);
    const medicoId = Number(this.citaForm['medicoId']);
    const salaId = Number(this.citaForm['salaId']);
    const inicioValor = this.citaForm['inicio'];
    const duracion = Number(this.citaForm['duracionMinutos'] || 30);

    if (!Number.isInteger(pacienteId) || pacienteId <= 0) {
      this.errorHandler.showWarning('Debe seleccionar un paciente válido');
      return;
    }

    if (!Number.isInteger(medicoId) || medicoId <= 0) {
      this.errorHandler.showWarning('Debe seleccionar un doctor válido');
      return;
    }

    if (!Number.isInteger(salaId) || salaId <= 0) {
      this.errorHandler.showWarning('Debe seleccionar una sala válida');
      return;
    }

    if (!inicioValor) {
      this.errorHandler.showWarning('Debe seleccionar fecha y hora de inicio');
      return;
    }

    const inicio = new Date(inicioValor);

    if (Number.isNaN(inicio.getTime())) {
      this.errorHandler.showWarning('La fecha y hora de inicio no es válida');
      return;
    }

    if (!Number.isFinite(duracion) || duracion <= 0) {
      this.errorHandler.showWarning('La duración debe ser mayor a 0 minutos');
      return;
    }

    const fin = new Date(inicio.getTime() + duracion * 60000);

    if (this.citaForm['citaId']) {
      this.errorHandler.showWarning('La edición completa de citas no está disponible en esta versión');
      return;
    }

    const request: CitasInsertarRequest = {
      solicitudId: this.citaForm['solicitudId'] ?? null,
      pacienteId,
      medicoId,
      salaId,
      inicio: this.toLocalDateTimeValue(inicio),
      fin: this.toLocalDateTimeValue(fin),
      duracionMinutos: duracion,
      creadaPorUsuarioId: this.currentUser?.usuarioId ?? 1
    };

    this.citasService.insertar(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess('Cita creada correctamente');
          this.citaDialog = false;
          this.cargarCitas();
          return;
        }

        this.errorHandler.showError(400, response.message || 'No se pudo crear la cita');
      },
      error: (error) => {
        this.errorHandler.showError(error?.status || 500, this.getErrorMessage(error, 'No se pudo crear la cita'));
      }
    });
  }

  cambiarEstadoCita(c: any, nuevoEstado: number): void {
    if (nuevoEstado === 4) {
      this.confirmationService.confirm({
        message: `¿Deseas cancelar la cita de ${c.pacienteNombre ?? c.paciente ?? 'este paciente'}?`,
        header: 'Confirmar cancelación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, cancelar',
        rejectLabel: 'No',
        accept: () => this.ejecutarCambioEstado(c, nuevoEstado)
      });
      return;
    }

    this.ejecutarCambioEstado(c, nuevoEstado);
  }

  private ejecutarCambioEstado(c: any, nuevoEstado: number): void {
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
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.getErrorMessage(error, 'No se pudo actualizar el estado')
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
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.getErrorMessage(error, 'No se pudo cargar el detalle de la cita')
        });
      }
    });
  }

  getConsultaDeCita(citaId: number) {
    return this.consultas.find(c => c.citaId === citaId) ?? null;
  }
}
