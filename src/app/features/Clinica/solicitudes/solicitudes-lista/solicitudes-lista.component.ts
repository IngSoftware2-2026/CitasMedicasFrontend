import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SolicitudesService } from '../../../../core/services/Clinica/solicitudes.service';
import { CitasService } from '../../../../core/services/Clinica/citas.service';
import { DoctoresService } from '../../../../core/services/Clinica/doctores.service';
import { PacienteService } from '../../../../core/services/Clinica/paciente.service';
import { ErrorHandlerService } from '../../../../core/services/Http/error-handler.service';
import { AuthService } from '../../../../core/services/Accesos/auth/auth.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  SolicitudUnificada,
  SolicitudesFiltroDTO,
  TipoSolicitud,
  CambiarEstadoSolicitudDTO
} from '../../../../core/models/Clinica/Solicitudes/solicitud-publica.model';
import { CitasInsertarRequest } from '../../../../core/models/Clinica/Citas/citas-insertar.model';
import { CitaListadoResponse } from '../../../../core/models/Clinica/Citas/citas-read.model';
import { Doctor } from '../../../../core/models/Clinica/Doctores/doctor.model';
import { Paciente } from '../../../../core/models/Clinica/Pacientes/paciente.model';
import { Sala } from '../../../../core/models/Catalogos/sala.model';

@Component({
  selector: 'app-solicitudes-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink],
  templateUrl: './solicitudes-lista.component.html',
  styleUrl: './solicitudes-lista.component.css'
})
export class SolicitudesListaComponent implements OnInit {
  private solicitudesService = inject(SolicitudesService);
  private citasService = inject(CitasService);
  private doctoresService = inject(DoctoresService);
  private pacienteService = inject(PacienteService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  solicitudes = signal<SolicitudUnificada[]>([]);
  loading = signal(true);
  searchTerm = '';

  filtroTipo: '' | 'PUBLICA' | 'USUARIO' = '';
  filtroEstado: '' | '1' | '2' | '3' | '4' = '';
  filtroDesde = '';
  filtroHasta = '';

  currentPage = 1;
  pageSize = 10;

  perfilPaciente: Paciente | null = null;
  requiereCompletarPerfil = false;
  doctoresPaciente: Doctor[] = [];
  salasPaciente: Sala[] = [];
  misCitasPaciente: CitaListadoResponse[] = [];
  creandoCita = false;
  nuevaCita = {
    medicoId: null as number | null,
    fechaHoraInicio: '',
    motivo: ''
  };

  ngOnInit(): void {
    if (this.esPaciente) {
      this.inicializarFlujoPaciente();
      return;
    }

    this.cargarSolicitudes();
  }

  get esPaciente(): boolean {
    return this.auth.esPaciente;
  }

  get pacienteIdActual(): number | null {
    const pacienteIdAuth = this.auth.pacienteIdActual();
    if (pacienteIdAuth) return pacienteIdAuth;

    if (this.perfilPaciente?.pacienteId) {
      return this.perfilPaciente.pacienteId;
    }
    return null;
  }

  get misCitasOrdenadas(): CitaListadoResponse[] {
    const term = this.searchTerm.toLowerCase().trim();
    const base = [...this.misCitasPaciente].sort(
      (a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime()
    );

    if (!term) return base;
    return base.filter(c =>
      (c.medico ?? '').toLowerCase().includes(term) ||
      (c.estado ?? '').toLowerCase().includes(term) ||
      (c.sala ?? '').toLowerCase().includes(term)
    );
  }

  get totalMisCitas(): number {
    return this.misCitasPaciente.length;
  }

  get misCitasPendientes(): number {
    return this.misCitasPaciente.filter(c => {
      const code = (c.codigoEstado ?? '').toUpperCase();
      return code === 'PENDIENTE' || code === 'CONFIRMADA' || code === 'CONF';
    }).length;
  }

  get misCitasAtendidas(): number {
    return this.misCitasPaciente.filter(c => {
      const code = (c.codigoEstado ?? '').toUpperCase();
      return code === 'FINALIZADA' || code === 'ATENDIDA' || code === 'ATEN' || code === 'EN_CURSO';
    }).length;
  }

  get misCitasCanceladas(): number {
    return this.misCitasPaciente.filter(c => {
      const code = (c.codigoEstado ?? '').toUpperCase();
      return code === 'CANCELADA' || code === 'NO_ASISTIO' || code === 'CANC' || code === 'NOAS';
    }).length;
  }

  private inicializarFlujoPaciente(): void {
    this.loading.set(true);
    this.requiereCompletarPerfil = false;

    this.pacienteService.obtenerPerfilActual().pipe(
      switchMap((perfil) => {
        this.perfilPaciente = perfil;

        if (perfil?.pacienteId) {
          this.auth.establecerPacienteId(perfil.pacienteId);
          this.requiereCompletarPerfil = false;
        } else {
          this.requiereCompletarPerfil = true;
        }

        const pacienteId = this.pacienteIdActual;
        if (!pacienteId) {
          return forkJoin({
            doctores: this.doctoresService.listar(true),
            salasResponse: this.citasService.listarSalas(),
            citasResponse: of({ data: [] as CitaListadoResponse[] })
          });
        }

        return forkJoin({
          doctores: this.doctoresService.listar(true),
          salasResponse: this.citasService.listarSalas(),
          citasResponse: this.citasService.obtenerPorFiltro({ pacienteId })
        });
      })
    ).subscribe({
      next: ({ doctores, salasResponse, citasResponse }) => {
        this.doctoresPaciente = (doctores ?? []).filter(d => d.activo);
        this.salasPaciente = (salasResponse?.data ?? []).filter(s => s.activo);
        this.misCitasPaciente = citasResponse?.data ?? [];
        this.loading.set(false);
      },
      error: (error) => {
        if (error?.status === 404) {
          this.requiereCompletarPerfil = true;
          this.perfilPaciente = null;

          forkJoin({
            doctores: this.doctoresService.listar(true),
            salasResponse: this.citasService.listarSalas()
          }).subscribe({
            next: ({ doctores, salasResponse }) => {
              this.doctoresPaciente = (doctores ?? []).filter(d => d.activo);
              this.salasPaciente = (salasResponse?.data ?? []).filter(s => s.activo);
              this.misCitasPaciente = [];
              this.loading.set(false);
            },
            error: () => {
              this.loading.set(false);
              this.errorHandler.showError(500, 'No se pudo cargar informacion base para agendar');
            }
          });
          return;
        }

        this.loading.set(false);
        this.errorHandler.showError(error?.status || 500, 'No se pudo cargar el contexto del paciente');
      }
    });
  }

  crearCitaPaciente(): void {
    const pacienteId = this.pacienteIdActual;
    if (!pacienteId) {
      this.errorHandler.showWarning('No se pudo identificar tu perfil de paciente');
      return;
    }

    if (!this.nuevaCita.medicoId || this.nuevaCita.medicoId <= 0) {
      this.errorHandler.showWarning('Debes seleccionar un doctor');
      return;
    }

    if (!this.nuevaCita.fechaHoraInicio) {
      this.errorHandler.showWarning('Debes seleccionar fecha y hora');
      return;
    }

    if (!this.nuevaCita.motivo.trim()) {
      this.errorHandler.showWarning('Debes indicar el motivo de la consulta');
      return;
    }

    const doctorLocal = this.doctoresPaciente.find(d => d.medicoId === this.nuevaCita.medicoId);
    if (!doctorLocal) {
      this.errorHandler.showWarning('El doctor seleccionado no existe en el catalogo actual');
      return;
    }

    this.doctoresService.obtenerPorId(this.nuevaCita.medicoId).subscribe({
      next: (doctorValidado) => {
        if (!doctorValidado?.medicoId) {
          this.errorHandler.showWarning('El doctor seleccionado no esta disponible');
          return;
        }

        const salaId = doctorValidado.salaPredeterminadaId ?? this.salasPaciente[0]?.salaId ?? null;
        if (!salaId) {
          this.errorHandler.showWarning('No hay una sala disponible para agendar con este doctor');
          return;
        }

        const inicio = new Date(this.nuevaCita.fechaHoraInicio);
        if (Number.isNaN(inicio.getTime())) {
          this.errorHandler.showWarning('La fecha seleccionada no es valida');
          return;
        }

        const duracionMinutos = doctorValidado.duracionDefaultMinutos || 30;
        const fin = new Date(inicio.getTime() + duracionMinutos * 60000);

        const request: CitasInsertarRequest = {
          pacienteId,
          medicoId: doctorValidado.medicoId,
          salaId,
          inicio: this.toLocalDateTimeValue(inicio),
          fin: this.toLocalDateTimeValue(fin),
          duracionMinutos,
          creadaPorUsuarioId: this.auth.usuarioIdActual()
        };

        this.creandoCita = true;
        this.citasService.insertar(request).subscribe({
          next: (response) => {
            this.creandoCita = false;

            if (!response.success) {
              this.errorHandler.showError(400, response.message || 'No se pudo registrar la cita');
              return;
            }

            this.messageService.add({
              severity: 'success',
              summary: 'Cita registrada',
              detail: 'Tu cita fue creada correctamente y se reflejara en Mis Citas.'
            });

            this.nuevaCita = {
              medicoId: null,
              fechaHoraInicio: '',
              motivo: ''
            };

            this.cargarMisCitasPaciente();
          },
          error: (error) => {
            this.creandoCita = false;
            this.errorHandler.showError(error?.status || 500, this.getErrorMessage(error, 'No se pudo crear la cita'));
          }
        });
      },
      error: () => this.errorHandler.showWarning('No se pudo validar el doctor seleccionado')
    });
  }

  irAMisCitas(): void {
    this.router.navigate(['/citas']);
  }

  irACompletarPerfil(): void {
    this.router.navigate(['/configuraciones']);
  }

  private cargarMisCitasPaciente(): void {
    const pacienteId = this.pacienteIdActual;
    if (!pacienteId) return;

    this.citasService.obtenerPorFiltro({ pacienteId }).subscribe({
      next: (response) => {
        this.misCitasPaciente = response?.data ?? [];
      },
      error: (error) => {
        this.errorHandler.showError(error?.status || 500, 'No se pudo actualizar Mis Citas');
      }
    });
  }

  private toLocalDateTimeValue(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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

    return String(message);
  }

  cargarSolicitudes(): void {
    this.loading.set(true);

    if (!this.auth.estaAutenticado()) {
      this.solicitudes.set([]);
      this.loading.set(false);
      return;
    }

    const filtro: SolicitudesFiltroDTO = {};
    if (this.filtroEstado) filtro.estadoId = Number(this.filtroEstado);
    if (this.filtroDesde) filtro.desde = this.filtroDesde;
    if (this.filtroHasta) filtro.hasta = this.filtroHasta;

    const tipoFiltro = this.filtroTipo as TipoSolicitud | '';

    if (tipoFiltro === 'PUBLICA') {
      this.solicitudesService.listarPublicas(filtro).subscribe({
        next: (res) => {
          const data = res?.data ?? [];
          this.solicitudes.set(
            (Array.isArray(data) ? data : []).map(s => ({ ...s, tipo: 'PUBLICA' as TipoSolicitud }))
          );
          this.currentPage = 1;
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.solicitudes.set([]);
          this.errorHandler.showError(error?.status || 500, 'No se pudieron cargar solicitudes publicas');
        }
      });
    } else if (tipoFiltro === 'USUARIO') {
      this.solicitudesService.listarUsuarios(filtro).subscribe({
        next: (res) => {
          const data = res?.data ?? [];
          this.solicitudes.set(
            (Array.isArray(data) ? data : []).map(s => ({ ...s, tipo: 'USUARIO' as TipoSolicitud }))
          );
          this.currentPage = 1;
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.solicitudes.set([]);
          this.errorHandler.showError(error?.status || 500, 'No se pudieron cargar solicitudes de usuario');
        }
      });
    } else {
      forkJoin({
        publicas: this.solicitudesService.listarPublicas(filtro),
        usuarios: this.solicitudesService.listarUsuarios(filtro)
      }).subscribe({
        next: ({ publicas, usuarios }) => {
          const pubData = (publicas?.data && Array.isArray(publicas.data) ? publicas.data : [])
            .map(s => ({ ...s, tipo: 'PUBLICA' as TipoSolicitud }));
          const usrData = (usuarios?.data && Array.isArray(usuarios.data) ? usuarios.data : [])
            .map(s => ({ ...s, tipo: 'USUARIO' as TipoSolicitud }));

          const combined: SolicitudUnificada[] = [...pubData, ...usrData]
            .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());

          this.solicitudes.set(combined);
          this.currentPage = 1;
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.solicitudes.set([]);
          this.errorHandler.showError(error?.status || 500, 'No se pudieron cargar solicitudes');
        }
      });
    }
  }

  filtrar(): void {
    this.cargarSolicitudes();
  }

  limpiarFiltros(): void {
    this.filtroTipo = '';
    this.filtroEstado = '';
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.searchTerm = '';
    this.cargarSolicitudes();
  }

  get solicitudesFiltradas(): SolicitudUnificada[] {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.solicitudes();
    return this.solicitudes().filter(s =>
      s.nombrePaciente.toLowerCase().includes(term) ||
      s.medico.toLowerCase().includes(term) ||
      (s.motivo ?? '').toLowerCase().includes(term) ||
      s.estado.toLowerCase().includes(term) ||
      (s.telefono ?? '').includes(term)
    );
  }

  get solicitudesPaginadas(): SolicitudUnificada[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.solicitudesFiltradas.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.solicitudesFiltradas.length / this.pageSize);
  }

  get pendientesCount(): number {
    return this.solicitudes().filter(s => s.codigoEstado === 'PENDIENTE').length;
  }

  get aprobadasCount(): number {
    return this.solicitudes().filter(s => s.codigoEstado === 'APROBADA' || s.codigoEstado === 'CONFIRMADA').length;
  }

  get rechazadasCount(): number {
    return this.solicitudes().filter(s => s.codigoEstado === 'RECHAZADA').length;
  }

  get reprogramadasCount(): number {
    return this.solicitudes().filter(s => s.codigoEstado === 'REPROGRAMADA' || s.codigoEstado === 'PROPUESTA').length;
  }

  cambiarPagina(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  verDetalle(sol: SolicitudUnificada): void {
    this.router.navigate(['/solicitudes', sol.solicitudId], {
      queryParams: { tipo: sol.tipo }
    });
  }

  getEstadoClass(codigo: string): string {
    switch ((codigo || '').toUpperCase()) {
      case 'PENDIENTE': return 'badge-warning';
      case 'APROBADA':
      case 'CONFIRMADA':
      case 'CONF': return 'badge-success';
      case 'RECHAZADA':
      case 'CANCELADA': return 'badge-danger';
      case 'REPROGRAMADA':
      case 'PROPUESTA':
      case 'EN_CURSO': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  getTipoClass(tipo: string): string {
    return tipo === 'PUBLICA' ? 'badge-tipo-publica' : 'badge-tipo-usuario';
  }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
  }

  get puedeGestionar(): boolean {
    const rolId = this.auth.rolIdActual();
    return rolId === 1 || rolId === 2 || rolId === 3;
  }

  aprobarSolicitud(sol: SolicitudUnificada): void {
    this.confirmationService.confirm({
      message: `¿Aprobar la solicitud de ${sol.nombrePaciente}?`,
      header: 'Confirmar aprobacion',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Si, aprobar',
      rejectLabel: 'No',
      accept: () => this.ejecutarCambioEstado(sol, 'APROBADA')
    });
  }

  rechazarSolicitud(sol: SolicitudUnificada): void {
    this.confirmationService.confirm({
      message: `¿Rechazar la solicitud de ${sol.nombrePaciente}?`,
      header: 'Confirmar rechazo',
      icon: 'pi pi-times-circle',
      acceptLabel: 'Si, rechazar',
      rejectLabel: 'No',
      accept: () => this.ejecutarCambioEstado(sol, 'RECHAZADA')
    });
  }

  private ejecutarCambioEstado(sol: SolicitudUnificada, nuevoEstado: string): void {
    const dto: CambiarEstadoSolicitudDTO = {
      solicitudId: sol.solicitudId,
      codigoEstado: nuevoEstado
    };

    const serviceCall = sol.tipo === 'PUBLICA'
      ? this.solicitudesService.cambiarEstadoPublica(dto)
      : this.solicitudesService.cambiarEstadoUsuario(dto);

    serviceCall.subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Exito',
            detail: `Solicitud ${nuevoEstado.toLowerCase()}`
          });
          this.cargarSolicitudes();
          return;
        }
        this.errorHandler.showError(400, response.message || 'No se pudo cambiar el estado');
      },
      error: (error) => {
        this.errorHandler.showError(error?.status || 500, 'No se pudo cambiar el estado');
      }
    });
  }
}
