import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap, timeout } from 'rxjs';
import { SolicitudesService } from '../../../../core/services/Clinica/solicitudes.service';
import { DoctoresService } from '../../../../core/services/Clinica/doctores.service';
import { PacienteService } from '../../../../core/services/Clinica/paciente.service';
import { ErrorHandlerService } from '../../../../core/services/Http/error-handler.service';
import { AuthService } from '../../../../core/services/Accesos/auth/auth.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  SolicitudUnificada,
  SolicitudCitaListadoDTO,
  SolicitudUsuarioInsertarDTO,
  SolicitudesFiltroDTO,
  TipoSolicitud,
  CambiarEstadoSolicitudDTO
} from '../../../../core/models/Clinica/Solicitudes/solicitud-publica.model';
import { Doctor } from '../../../../core/models/Clinica/Doctores/doctor.model';
import { Paciente } from '../../../../core/models/Clinica/Pacientes/paciente.model';

@Component({
  selector: 'app-solicitudes-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink],
  templateUrl: './solicitudes-lista.component.html',
  styleUrl: './solicitudes-lista.component.css'
})
export class SolicitudesListaComponent implements OnInit {
  private solicitudesService = inject(SolicitudesService);
  private doctoresService = inject(DoctoresService);
  private pacienteService = inject(PacienteService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
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
  misSolicitudesPaciente: SolicitudCitaListadoDTO[] = [];
  creandoSolicitud = false;
  nuevaSolicitud = {
    medicoId: null as number | null,
    fechaHoraInicio: '',
    motivo: ''
  };

  ngOnInit(): void {
    if (this.esPaciente) {
      this.inicializarFlujoPaciente();
      return;
    }

    if (this.esDoctor) {
      this.filtroTipo = 'USUARIO';
    }

    this.cargarSolicitudes();
  }

  get esPaciente(): boolean {
    return this.auth.esPaciente;
  }

  get esDoctor(): boolean {
    return this.auth.esDoctor;
  }

  get pacienteIdActual(): number | null {
    const pacienteIdAuth = this.auth.pacienteIdActual();
    if (pacienteIdAuth) return pacienteIdAuth;

    if (this.perfilPaciente?.pacienteId) {
      return this.perfilPaciente.pacienteId;
    }
    return null;
  }

  get misSolicitudesOrdenadas(): SolicitudCitaListadoDTO[] {
    const term = this.searchTerm.toLowerCase().trim();
    const base = [...this.misSolicitudesPaciente].sort(
      (a, b) => new Date(b.fechaHoraInicio).getTime() - new Date(a.fechaHoraInicio).getTime()
    );

    if (!term) return base;
    return base.filter(s =>
      (s.medico ?? '').toLowerCase().includes(term) ||
      (s.estado ?? '').toLowerCase().includes(term) ||
      (s.motivo ?? '').toLowerCase().includes(term)
    );
  }

  get totalMisSolicitudes(): number {
    return this.misSolicitudesPaciente.length;
  }

  get misSolicitudesPendientes(): number {
    return this.misSolicitudesPaciente.filter(s => (s.codigoEstado ?? '').toUpperCase() === 'PENDIENTE').length;
  }

  get misSolicitudesAprobadas(): number {
    return this.misSolicitudesPaciente.filter(s => {
      const code = (s.codigoEstado ?? '').toUpperCase();
      return code === 'APROBADA' || code === 'CONFIRMADA' || code === 'CONF';
    }).length;
  }

  get misSolicitudesReprogramadas(): number {
    return this.misSolicitudesPaciente.filter(s => {
      const code = (s.codigoEstado ?? '').toUpperCase();
      return code === 'REPROGRAMADA' || code === 'PROPUESTA';
    }).length;
  }

  get misSolicitudesRechazadas(): number {
    return this.misSolicitudesPaciente.filter(s => {
      const code = (s.codigoEstado ?? '').toUpperCase();
      return code === 'RECHAZADA' || code === 'CANCELADA';
    }).length;
  }

  private inicializarFlujoPaciente(): void {
    this.loading.set(true);
    this.requiereCompletarPerfil = false;

    this.pacienteService.obtenerPerfilActual().pipe(
      timeout(10000),
      catchError((error) => {
        const pacienteId = this.auth.pacienteIdActual();
        if (pacienteId) {
          console.warn('[SolicitudesPaciente] PerfilActual fallo, usando fallback por pacienteId.', error);
          return this.pacienteService.obtenerPorId(pacienteId).pipe(
            catchError((fallbackError) => {
              console.error('[SolicitudesPaciente] Fallback ObtenerPorId tambien fallo.', fallbackError);
              return of(null);
            })
          );
        }

        return of(null);
      }),
      switchMap((perfil) => {
        this.perfilPaciente = perfil;

        if (perfil?.pacienteId) {
          this.auth.establecerPacienteId(perfil.pacienteId);
          this.requiereCompletarPerfil = false;
        } else {
          this.requiereCompletarPerfil = !this.auth.pacienteIdActual();
        }

        const pacienteId = this.pacienteIdActual;
        if (!pacienteId) {
          return forkJoin({
            doctores: this.cargarDoctoresDisponiblesPaciente(),
            solicitudesResponse: of({ data: [] as SolicitudCitaListadoDTO[] })
          });
        }

        return forkJoin({
          doctores: this.cargarDoctoresDisponiblesPaciente(),
          solicitudesResponse: this.solicitudesService.listarUsuarios({ pacienteId }).pipe(
            catchError(() => of({ data: [] as SolicitudCitaListadoDTO[] }))
          )
        });
      })
    ).subscribe({
      next: ({ doctores, solicitudesResponse }) => {
        this.doctoresPaciente = (doctores ?? []).filter(d => d.activo);
        this.misSolicitudesPaciente = solicitudesResponse?.data ?? [];
        if (this.doctoresPaciente.length === 0) {
          this.errorHandler.showInfo('No hay doctores operativos disponibles para agendar en este momento.');
        }
        this.aplicarPrefillReagendamiento();
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorHandler.showError(error?.status || 500, 'No se pudo cargar el contexto del paciente');
      }
    });
  }

  private cargarDoctoresDisponiblesPaciente() {
    return this.doctoresService.listarOperativos().pipe(
      switchMap((operativos) => {
        if ((operativos ?? []).length > 0) {
          return of(operativos);
        }

        return this.doctoresService.listar(true).pipe(
          switchMap((activos) => {
            const candidatos = (activos ?? []).filter(d => d.activo);
            if (candidatos.length > 0) {
              this.messageService.add({
                severity: 'warn',
                summary: 'Catalogo limitado',
                detail: 'No se encontraron doctores operativos completos. Se mostraran doctores activos disponibles.'
              });
            }
            return of(candidatos);
          }),
          catchError(() => of([]))
        );
      }),
      catchError(() => of([]))
    );
  }

  crearSolicitudPaciente(): void {
    const pacienteId = this.pacienteIdActual;
    if (!pacienteId) {
      this.errorHandler.showWarning('No se pudo identificar tu perfil de paciente');
      return;
    }

    if (!this.nuevaSolicitud.medicoId || this.nuevaSolicitud.medicoId <= 0) {
      this.errorHandler.showWarning('Debes seleccionar un doctor');
      return;
    }

    if (!this.nuevaSolicitud.fechaHoraInicio) {
      this.errorHandler.showWarning('Debes seleccionar fecha y hora');
      return;
    }

    if (!this.nuevaSolicitud.motivo.trim()) {
      this.errorHandler.showWarning('Debes indicar el motivo de la consulta');
      return;
    }

    const doctorLocal = this.doctoresPaciente.find(d => d.medicoId === this.nuevaSolicitud.medicoId);
    if (!doctorLocal) {
      this.errorHandler.showWarning('El doctor seleccionado no existe en el catalogo actual');
      return;
    }

    this.doctoresService.obtenerPorId(this.nuevaSolicitud.medicoId).subscribe({
      next: (doctorValidado) => {
        if (!doctorValidado?.medicoId) {
          this.errorHandler.showWarning('El doctor seleccionado no esta disponible');
          return;
        }

        const inicio = new Date(this.nuevaSolicitud.fechaHoraInicio);
        if (Number.isNaN(inicio.getTime())) {
          this.errorHandler.showWarning('La fecha seleccionada no es valida');
          return;
        }

        const request: SolicitudUsuarioInsertarDTO = {
          pacienteId,
          medicoId: doctorValidado.medicoId,
          fechaHoraInicio: this.toLocalDateTimeValue(inicio),
          duracionMinutos: doctorValidado.duracionDefaultMinutos || 30,
          motivo: this.nuevaSolicitud.motivo.trim()
        };

        this.creandoSolicitud = true;
        this.solicitudesService.insertarUsuario(request).subscribe({
          next: (response) => {
            this.creandoSolicitud = false;

            if (!response.success) {
              this.errorHandler.showError(400, response.message || 'No se pudo registrar la solicitud');
              return;
            }

            this.messageService.add({
              severity: 'success',
              summary: 'Solicitud registrada',
              detail: 'Tu solicitud fue enviada correctamente y quedo pendiente de confirmacion.'
            });

            this.nuevaSolicitud = {
              medicoId: null,
              fechaHoraInicio: '',
              motivo: ''
            };

            this.cargarMisSolicitudesPaciente();
          },
          error: (error) => {
            this.creandoSolicitud = false;
            this.errorHandler.showError(error?.status || 500, this.getErrorMessage(error, 'No se pudo crear la solicitud'));
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

  private cargarMisSolicitudesPaciente(): void {
    const pacienteId = this.pacienteIdActual;
    if (!pacienteId) return;

    this.solicitudesService.listarUsuarios({ pacienteId }).subscribe({
      next: (response) => {
        this.misSolicitudesPaciente = response?.data ?? [];
      },
      error: (error) => {
        this.errorHandler.showError(error?.status || 500, 'No se pudo actualizar Mis Solicitudes');
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

  private aplicarPrefillReagendamiento(): void {
    const medicoId = Number(this.route.snapshot.queryParamMap.get('medicoId'));
    const fechaHoraInicio = this.route.snapshot.queryParamMap.get('fechaHoraInicio');

    if (Number.isInteger(medicoId) && medicoId > 0) {
      this.nuevaSolicitud.medicoId = medicoId;
    }

    if (fechaHoraInicio) {
      this.nuevaSolicitud.fechaHoraInicio = fechaHoraInicio;
    }
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

    const tipoFiltro = this.esDoctor
      ? 'USUARIO'
      : (this.filtroTipo as TipoSolicitud | '');

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
          console.log('[SolicitudesDoctor] estados cargados', (Array.isArray(data) ? data : []).map((s: any) => ({
            solicitudId: s.solicitudId,
            estadoId: s.estadoId,
            codigoEstado: s.codigoEstado,
            estado: s.estado
          })));
          this.solicitudes.set(
            (Array.isArray(data) ? data : []).map(s => ({ ...s, tipo: 'USUARIO' as TipoSolicitud }))
          );
          this.currentPage = 1;
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.solicitudes.set([]);
          this.errorHandler.showError(
            error?.status || 500,
            this.getErrorMessage(error, 'No se pudieron cargar solicitudes de usuario')
          );
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
          this.errorHandler.showError(
            error?.status || 500,
            this.getErrorMessage(error, 'No se pudieron cargar solicitudes')
          );
        }
      });
    }
  }

  filtrar(): void {
    this.cargarSolicitudes();
  }

  limpiarFiltros(): void {
    this.filtroTipo = this.esDoctor ? 'USUARIO' : '';
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
    return this.solicitudes().filter(s => this.esSolicitudPendiente(s)).length;
  }

  get aprobadasCount(): number {
    return this.solicitudes().filter(s => {
      const codigo = this.obtenerCodigoEstadoNormalizado(s);
      return codigo === 'APROBADA' || codigo === 'CONFIRMADA';
    }).length;
  }

  get rechazadasCount(): number {
    return this.solicitudes().filter(s => {
      const codigo = this.obtenerCodigoEstadoNormalizado(s);
      return codigo === 'RECHAZADA' || codigo === 'CANCELADA';
    }).length;
  }

  get reprogramadasCount(): number {
    return this.solicitudes().filter(s => {
      const codigo = this.obtenerCodigoEstadoNormalizado(s);
      return codigo === 'REPROGRAMADA' || codigo === 'PROPUESTA';
    }).length;
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

  irAReprogramar(sol: SolicitudUnificada): void {
    this.router.navigate(['/solicitudes', sol.solicitudId], {
      queryParams: {
        tipo: sol.tipo,
        accion: 'reprogramar'
      }
    });
  }

  irAConfirmar(sol: SolicitudUnificada): void {
    this.router.navigate(['/solicitudes', sol.solicitudId], {
      queryParams: {
        tipo: sol.tipo,
        accion: 'aprobar'
      }
    });
  }

  getEstadoClass(codigo: string): string {
    switch ((codigo || '').toUpperCase()) {
      case 'PENDIENTE': return 'badge-warning';
      case 'CONFIRMADA':
      case 'APROBADA':
      case 'CONF': return 'badge-success';
      case 'RECHAZADA':
      case 'CANCELADA': return 'badge-danger';
      case 'PROPUESTA':
      case 'REPROGRAMADA':
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
    return this.auth.esAdmin || this.auth.esRecepcion || this.auth.esDoctor;
  }

  obtenerCodigoEstadoNormalizado(sol: SolicitudUnificada): string {
    const estadoId = Number(sol.estadoId ?? 0);
    if (estadoId === 1) return 'PENDIENTE';
    if (estadoId === 2) return 'PROPUESTA';
    if (estadoId === 3) return 'CONFIRMADA';
    if (estadoId === 4) return 'RECHAZADA';
    if (estadoId === 5) return 'CANCELADA';

    const codigo = String(sol.codigoEstado ?? '').trim().toUpperCase();
    if (codigo) return codigo;

    const estado = String(sol.estado ?? '').trim().toUpperCase();
    if (estado.includes('PEND')) return 'PENDIENTE';
    if (estado.includes('CONF')) return 'CONFIRMADA';
    if (estado.includes('APROB')) return 'APROBADA';
    if (estado.includes('PROPUE')) return 'PROPUESTA';
    if (estado.includes('REPROG')) return 'REPROGRAMADA';
    if (estado.includes('RECHAZ')) return 'RECHAZADA';
    if (estado.includes('CANCEL')) return 'CANCELADA';

    return estado;
  }

  esSolicitudPendiente(sol: SolicitudUnificada): boolean {
    return this.obtenerCodigoEstadoNormalizado(sol) === 'PENDIENTE';
  }

  puedeGestionarSolicitudPendiente(sol: SolicitudUnificada): boolean {
    if (this.esPaciente) return false;
    return this.esSolicitudPendiente(sol);
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
