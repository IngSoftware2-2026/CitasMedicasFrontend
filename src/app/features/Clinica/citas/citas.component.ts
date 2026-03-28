import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/Accesos/auth/auth.service';
import { CitasService } from '../../../core/services/Clinica/citas.service';
import { PacienteService } from '../../../core/services/Clinica/paciente.service';
import { ErrorHandlerService } from '../../../core/services/Http/error-handler.service';
import { CitasCambiarEstadoRequest } from '../../../core/models/Clinica/Citas/citas-cambiar-estado.model';
import { CitasFiltroRequest } from '../../../core/models/Clinica/Citas/citas-filtro.model';
import { CitasInsertarRequest } from '../../../core/models/Clinica/Citas/citas-insertar.model';
import { CitaDetalleResponse, CitaListadoResponse } from '../../../core/models/Clinica/Citas/citas-read.model';
import { DoctorListado } from '../../../core/models/Clinica/Doctores/doctor-listado.model';
import { PacienteListado } from '../../../core/models/Clinica/Pacientes/paciente-listado.model';
import { Paciente } from '../../../core/models/Clinica/Pacientes/paciente.model';
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
  imports: [FormsModule, DatePipe, RouterLink, TableModule, ButtonModule, DialogModule, InputTextModule, TagModule, ToolbarModule, TooltipModule, DividerModule, IconFieldModule, InputIconModule],
  templateUrl: './citas.component.html',
  styleUrl: './citas.component.css'
})
export class CitasComponent implements OnInit {
  searchCita = '';
  showAdvancedFilters = false;
  citaDialog = false;
  citaDetailDialog = false;
  cancelandoCitaId: number | null = null;
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
  perfilPaciente: Paciente | null = null;

  get citas() { return this.citasData; }
  get salas() { return this.salasData; }
  get canManageCitas() {
    const rolId = this.auth.rolIdActual();
    return rolId === 1 || rolId === 3;
  }
  get esPaciente(): boolean {
    return this.auth.esPaciente;
  }
  get currentUser() {
    const usuarioId = this.auth.usuarioIdActual();
    return usuarioId ? { usuarioId } : null;
  }
  get pacienteIdActual(): number | null {
    const pacienteIdAuth = this.auth.pacienteIdActual();
    if (pacienteIdAuth) return pacienteIdAuth;

    const usuarioId = this.auth.usuarioIdActual();
    if (!usuarioId) return null;

    if (this.perfilPaciente?.pacienteId) {
      return this.perfilPaciente.pacienteId;
    }
    return null;
  }

  get citasView() {
    const term = this.searchCita.toLowerCase();
    const baseCitas = this.esPaciente && this.pacienteIdActual
      ? this.citas.filter(c => c.pacienteId === this.pacienteIdActual)
      : this.citas;

    return baseCitas.map(c => ({
      ...c,
      pacienteNombre: c.paciente ?? `Paciente #${c.pacienteId}`,
      doctorNombre: c.medico ?? `Medico #${c.medicoId}`,
      salaNombre: c.sala ?? `Sala #${c.salaId}`,
      estadoNombre: c.estado ?? c.codigoEstado ?? `Estado #${c.estadoId}`,
      estadoCodigo: c.codigoEstado ?? ''
    })).filter(c => !term ||
      c.pacienteNombre.toLowerCase().includes(term) ||
      c.doctorNombre.toLowerCase().includes(term) ||
      c.salaNombre.toLowerCase().includes(term) ||
      c.estadoNombre.toLowerCase().includes(term)
    );
  }

  constructor(
    private auth: AuthService,
    private citasService: CitasService,
    private pacienteService: PacienteService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.esPaciente) {
      this.pacienteService.obtenerPerfilActual().subscribe({
        next: (perfil) => {
          this.perfilPaciente = perfil;
          if (perfil?.pacienteId) {
            this.auth.establecerPacienteId(perfil.pacienteId);
            this.filtros.pacienteId = perfil.pacienteId;
          } else if (this.pacienteIdActual) {
            this.filtros.pacienteId = this.pacienteIdActual;
          }
          this.cargarCitas();
        },
        error: () => {
          if (this.pacienteIdActual) {
            this.filtros.pacienteId = this.pacienteIdActual;
          }
          this.cargarCitas();
        }
      });
    } else {
      this.cargarCitas();
    }

    this.cargarDoctores();
    if (!this.esPaciente) this.cargarPacientes();
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
    const codigoNormalizado = codigoEstado.toUpperCase();
    const mapping: Record<string, string[]> = {
      'CONF': ['CONFIRMADA', 'CONF'],
      'ATEN': ['FINALIZADA', 'EN_CURSO', 'ATEN', 'ATENDIDA'],
      'CANC': ['CANCELADA', 'CANC'],
      'NOAS': ['NO_ASISTIO', 'NOAS', 'NO ASISTIO']
    };
    const codigosAceptados = mapping[codigoNormalizado] ?? [codigoNormalizado];
    return this.citas.filter(c => {
      const estado = (c.codigoEstado || '').toUpperCase();
      return codigosAceptados.includes(estado);
    }).length;
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
      pacienteId: this.esPaciente ? this.pacienteIdActual : null,
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
    this.citaForm = { 
      pacienteId: null,
      medicoId: null,
      salaId: null,
      inicio: null,
      duracionMinutos: 30 
    };
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

  puedeCancelarCitaPaciente(c: any): boolean {
    const codigo = this.obtenerCodigoEstadoPaciente(c);
    return this.esCitaGestionablePaciente(codigo);
  }

  puedeModificarCitaPaciente(c: any): boolean {
    const codigo = this.obtenerCodigoEstadoPaciente(c);
    return this.esCitaGestionablePaciente(codigo);
  }

  modificarCitaPaciente(c: any): void {
    const medicoId = c?.medicoId ?? null;
    const fechaHoraInicio = c?.inicio ? this.toLocalDateTimeInputValue(new Date(c.inicio)) : null;

    this.messageService.add({
      severity: 'info',
      summary: 'Modificar cita',
      detail: 'Te llevamos a Solicitar Cita con los datos actuales para reagendar. La edicion directa de una cita existente aun no esta soportada por el backend actual.'
    });

    this.router.navigate(['/solicitudes'], {
      queryParams: {
        medicoId,
        fechaHoraInicio
      }
    });
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

    if (this.esPaciente && nuevoEstado === 4) {
      this.cancelandoCitaId = citaId;
    }

    this.citasService.cambiarEstado(request).subscribe({
      next: (response) => {
        this.cancelandoCitaId = null;
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Estado',
            detail: response.message || 'Estado de cita actualizado'
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
        this.cancelandoCitaId = null;
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

  getEstadoSeverity(codigo: string | null | undefined): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch ((codigo ?? '').toUpperCase()) {
      case 'CONFIRMADA':
      case 'CONF':
      case 'PENDIENTE':
        return 'info';
      case 'EN_CURSO':
        return 'warn';
      case 'FINALIZADA':
      case 'ATEN':
      case 'ATENDIDA':
        return 'success';
      case 'CANCELADA':
      case 'CANC':
      case 'RECHAZADA':
        return 'danger';
      case 'NO_ASISTIO':
      case 'NOAS':
        return 'secondary';
      default:
        return undefined;
    }
  }

  private obtenerCodigoEstadoPaciente(c: any): string {
    const codigo = String(c?.estadoCodigo ?? c?.codigoEstado ?? '').toUpperCase();
    if (codigo) return codigo;

    const estado = String(c?.estadoNombre ?? c?.estado ?? '').toUpperCase();
    if (estado.includes('PENDIENTE')) return 'PENDIENTE';
    if (estado.includes('CONFIRMADA')) return 'CONFIRMADA';
    if (estado.includes('ATENDIDA') || estado.includes('FINALIZADA')) return 'ATEN';
    if (estado.includes('CANCELADA')) return 'CANC';
    if (estado.includes('NO ASIST')) return 'NOAS';

    return '';
  }

  private esCitaGestionablePaciente(codigo: string): boolean {
    const normalizado = String(codigo || '').toUpperCase();
    return !['ATEN', 'ATENDIDA', 'FINALIZADA', 'EN_CURSO', 'CANC', 'CANCELADA', 'NOAS', 'NO_ASISTIO'].includes(normalizado);
  }

  private toLocalDateTimeInputValue(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
