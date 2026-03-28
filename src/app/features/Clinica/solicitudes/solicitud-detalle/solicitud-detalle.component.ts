import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { SolicitudesService } from '../../../../core/services/Clinica/solicitudes.service';
import { CitasService } from '../../../../core/services/Clinica/citas.service';
import { PacienteService } from '../../../../core/services/Clinica/paciente.service';
import { AuthService } from '../../../../core/services/Accesos/auth/auth.service';
import { ErrorHandlerService } from '../../../../core/services/Http/error-handler.service';
import {
  SolicitudUnificada,
  TipoSolicitud,
  CitaInsertarDTO,
  PropuestaReprogramacionInsertarDTO
} from '../../../../core/models/Clinica/Solicitudes/solicitud-publica.model';
import { Sala } from '../../../../core/models/Catalogos/sala.model';
import { Paciente } from '../../../../core/models/Clinica/Pacientes/paciente.model';
import { PacienteListado } from '../../../../core/models/Clinica/Pacientes/paciente-listado.model';

@Component({
  selector: 'app-solicitud-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink],
  templateUrl: './solicitud-detalle.component.html',
  styleUrl: './solicitud-detalle.component.css'
})
export class SolicitudDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private solicitudesService = inject(SolicitudesService);
  private citasService = inject(CitasService);
  private pacienteService = inject(PacienteService);
  private auth = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);

  solicitud = signal<SolicitudUnificada | null>(null);
  loading = signal(true);
  actionLoading = signal(false);

  // Aprobar dialog
  showAprobarDialog = signal(false);
  pacienteMode: 'existente' | 'nuevo' = 'existente';
  pacientes = signal<PacienteListado[]>([]);
  pacienteBusqueda = '';
  pacienteSeleccionado: number | null = null;
  salas = signal<Sala[]>([]);
  salaSeleccionada: number | null = null;
  fechaInicio = '';
  duracionMinutos = 30;

  // Nuevo paciente
  nuevoPaciente = {
    nombres: '', apellidos: '', telefono: '', correo: '',
    numeroIdentidad: '', fechaNacimiento: ''
  };

  // Rechazar dialog
  showRechazarDialog = signal(false);

  // Reprogramar
  showReprogramarForm = signal(false);
  nuevaFechaHora = '';

  private solicitudId = 0;
  private tipo: TipoSolicitud = 'PUBLICA';

  ngOnInit(): void {
    this.solicitudId = Number(this.route.snapshot.paramMap.get('id'));
    this.tipo = (this.route.snapshot.queryParamMap.get('tipo') || 'PUBLICA') as TipoSolicitud;
    this.cargarDetalle();
  }

  private cargarDetalle(): void {
    this.loading.set(true);
    const obs$ = this.tipo === 'PUBLICA'
      ? this.solicitudesService.obtenerPublicaPorId(this.solicitudId)
      : this.solicitudesService.obtenerUsuarioPorId(this.solicitudId);

    obs$.subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const data = res.data as any;
          this.solicitud.set({ ...data, tipo: this.tipo });
          this.fechaInicio = data.fechaHoraInicio
            ? this.toDateTimeLocal(data.fechaHoraInicio)
            : '';
          this.duracionMinutos = data.duracionMinutos ?? data.duracionDefaultMinutos ?? 30;
          const accion = this.route.snapshot.queryParamMap.get('accion');
          const estadoNormalizado = this.obtenerCodigoEstadoNormalizado();
          if (accion === 'reprogramar' && estadoNormalizado === 'PENDIENTE') {
            this.showReprogramarForm.set(true);
          }
          if (accion === 'aprobar' && estadoNormalizado === 'PENDIENTE') {
            this.abrirAprobar();
          }
        } else {
          this.errorHandler.showError(404, 'Solicitud no encontrada');
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorHandler.showError(500, 'Error al cargar el detalle');
        this.loading.set(false);
      }
    });
  }

  private toDateTimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  get esPendiente(): boolean {
    return this.obtenerCodigoEstadoNormalizado() === 'PENDIENTE';
  }

  get esPaciente(): boolean {
    return this.auth.esPaciente;
  }

  get calcularFin(): string {
    if (!this.fechaInicio || !this.duracionMinutos) return '';
    const inicio = new Date(this.fechaInicio);
    const fin = new Date(inicio.getTime() + this.duracionMinutos * 60000);
    return fin.toLocaleString('es', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  get pacientesFiltrados(): PacienteListado[] {
    const term = this.pacienteBusqueda.toLowerCase().trim();
    if (!term) return this.pacientes();
    return this.pacientes().filter(p => {
      const nombre = `${p.nombres ?? ''} ${p.apellidos ?? ''} ${p.paciente ?? ''}`.toLowerCase();
      return nombre.includes(term);
    });
  }

  getEstadoClass(codigo: string): string {
    switch (codigo) {
      case 'PENDIENTE': return 'status-pending';
      case 'CONFIRMADA': return 'status-approved';
      case 'APROBADA': return 'status-approved';
      case 'RECHAZADA': return 'status-rejected';
      case 'PROPUESTA': return 'status-rescheduled';
      case 'REPROGRAMADA': return 'status-rescheduled';
      default: return 'status-default';
    }
  }

  private obtenerCodigoEstadoNormalizado(): string {
    const sol = this.solicitud();
    if (!sol) return '';

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
    if (estado.includes('PROP')) return 'PROPUESTA';
    if (estado.includes('RECHAZ')) return 'RECHAZADA';
    if (estado.includes('REPROG')) return 'REPROGRAMADA';
    if (estado.includes('CANCEL')) return 'CANCELADA';

    return estado;
  }

  // ===== APROBAR =====
  abrirAprobar(): void {
    this.showAprobarDialog.set(true);
    this.pacienteMode = this.solicitud()?.tipo === 'USUARIO' ? 'existente' : 'existente';

    this.citasService.listarSalas().subscribe({
      next: (res) => {
        const data = res?.data ?? (res as any)?.datos ?? [];
        this.salas.set(Array.isArray(data) ? data.filter((s: Sala) => s.activo) : []);
      },
      error: () => this.errorHandler.showError(500, 'Error al cargar salas')
    });

    if (this.solicitud()?.tipo === 'PUBLICA') {
      this.citasService.listarPacientes().subscribe({
        next: (res) => {
          const data = res?.data ?? (res as any)?.datos ?? [];
          this.pacientes.set(Array.isArray(data) ? data : []);
        },
        error: () => this.errorHandler.showError(500, 'Error al cargar pacientes')
      });
    }
  }

  confirmarAprobar(): void {
    const sol = this.solicitud();
    if (!sol) return;

    if (!this.salaSeleccionada) {
      this.errorHandler.showWarning('Selecciona una sala');
      return;
    }
    if (!this.fechaInicio) {
      this.errorHandler.showWarning('Ingresa fecha y hora de inicio');
      return;
    }

    this.actionLoading.set(true);

    if (sol.tipo === 'PUBLICA' && this.pacienteMode === 'nuevo') {
      // Crear paciente primero
      if (!this.nuevoPaciente.nombres || !this.nuevoPaciente.apellidos ||
          !this.nuevoPaciente.telefono || !this.nuevoPaciente.numeroIdentidad) {
        this.errorHandler.showWarning('Completa los campos requeridos del paciente');
        this.actionLoading.set(false);
        return;
      }

      const pacienteData: Partial<Paciente> = {
        nombres: this.nuevoPaciente.nombres,
        apellidos: this.nuevoPaciente.apellidos,
        telefono: this.nuevoPaciente.telefono,
        correo: this.nuevoPaciente.correo || undefined,
        numeroIdentidad: this.nuevoPaciente.numeroIdentidad,
        fechaNacimiento: this.nuevoPaciente.fechaNacimiento
          ? new Date(this.nuevoPaciente.fechaNacimiento)
          : undefined,
        activo: true,
        usuarioId: 0
      };

      this.pacienteService.insertar(pacienteData).subscribe({
        next: (pac: any) => {
          const pacienteId = pac?.pacienteId ?? pac?.data?.pacienteId ?? pac?.datos?.pacienteId;
          if (pacienteId) {
            this.crearCita(pacienteId);
          } else {
            this.errorHandler.showError(500, 'No se pudo obtener el ID del paciente creado');
            this.actionLoading.set(false);
          }
        },
        error: (err) => {
          this.errorHandler.showError(500, err?.message ?? 'Error al crear paciente');
          this.actionLoading.set(false);
        }
      });
    } else {
      const pacienteId = sol.tipo === 'USUARIO'
        ? sol.pacienteId
        : this.pacienteSeleccionado;

      if (!pacienteId) {
        this.errorHandler.showWarning('Selecciona un paciente');
        this.actionLoading.set(false);
        return;
      }
      this.crearCita(pacienteId);
    }
  }

  private crearCita(pacienteId: number): void {
    const sol = this.solicitud()!;
    const inicio = new Date(this.fechaInicio);
    const fin = new Date(inicio.getTime() + this.duracionMinutos * 60000);

    const citaData: CitaInsertarDTO = {
      solicitudId: sol.solicitudId,
      pacienteId,
      medicoId: sol.medicoId,
      salaId: this.salaSeleccionada!,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      duracionMinutos: this.duracionMinutos,
      creadaPorUsuarioId: this.auth.usuarioIdActual() ?? 0
    };

    this.solicitudesService.crearCita(citaData).pipe(
      switchMap((res) => {
        const exitoso = res?.success ?? (res as any)?.exitoso;
        if (!exitoso) {
          const msg = res?.message ?? (res as any)?.mensaje ?? 'Error al crear la cita';
          throw new Error(msg);
        }

        return this.confirmarSolicitud$(sol.solicitudId, sol.tipo);
      })
    ).subscribe({
      next: (estadoRes: any) => {
        const exitoso = estadoRes?.success ?? (estadoRes as any)?.exitoso;
        if (!exitoso) {
          const msg = estadoRes?.message ?? (estadoRes as any)?.mensaje ?? 'La cita se creo, pero no se pudo actualizar el estado de la solicitud';
          this.errorHandler.showError(400, msg);
          this.actionLoading.set(false);
          return;
        }

        this.finalizarAprobacionExitosa('Cita creada y solicitud confirmada exitosamente');
      },
      error: (err: any) => {
        if (err?.status === 409) {
          this.recuperarTrasConflictoDeCita(sol, pacienteId, inicio, fin);
          return;
        }

        const msg = err?.message ?? err?.error?.message ?? err?.error?.mensaje ?? 'Error al crear la cita';
        this.errorHandler.showError(500, msg);
        this.actionLoading.set(false);
      }
    });
  }

  private cambiarEstadoSolicitud$(solicitudId: number, tipo: TipoSolicitud, codigos: string[]): Observable<any> {
    const [codigoActual, ...resto] = codigos;
    const dto = { solicitudId, codigoEstado: codigoActual };
    const request$ = tipo === 'PUBLICA'
      ? this.solicitudesService.cambiarEstadoPublica(dto)
      : this.solicitudesService.cambiarEstadoUsuario(dto);

    return request$.pipe(
      catchError((err: any) => {
        if (resto.length > 0 && this.esCodigoEstadoInvalido(err)) {
          return this.cambiarEstadoSolicitud$(solicitudId, tipo, resto);
        }

        return throwError(() => err);
      })
    );
  }

  private confirmarSolicitud$(solicitudId: number, tipo: TipoSolicitud) {
    return this.cambiarEstadoSolicitud$(solicitudId, tipo, ['CONFIRMADA', 'APROBADA']);
  }

  private rechazarSolicitud$(solicitudId: number, tipo: TipoSolicitud) {
    return this.cambiarEstadoSolicitud$(solicitudId, tipo, ['RECHAZADA', 'CANCELADA']);
  }

  private esConflictoConMensajeExitoso(err: any): boolean {
    const msg = String(
      err?.error?.message ??
      err?.error?.mensaje ??
      err?.message ??
      ''
    ).toLowerCase();

    return err?.status === 409 && msg.includes('operaci') && msg.includes('exitosa');
  }

  private esCodigoEstadoInvalido(err: any): boolean {
    const msg = String(
      err?.error?.message ??
      err?.error?.mensaje ??
      err?.message ??
      ''
    ).toLowerCase();

    return err?.status === 409 && msg.includes('codigo de estado') && msg.includes('no existe');
  }

  private finalizarAprobacionExitosa(mensaje: string): void {
    this.errorHandler.showSuccess(mensaje);
    this.showAprobarDialog.set(false);
    this.router.navigate(['/solicitudes']);
    this.actionLoading.set(false);
  }

  private recuperarTrasConflictoDeCita(
    sol: SolicitudUnificada,
    pacienteId: number,
    inicio: Date,
    fin: Date
  ): void {
    this.citasService.obtenerPorFiltro({
      medicoId: sol.medicoId,
      pacienteId,
      desde: inicio.toISOString(),
      hasta: fin.toISOString()
    }).subscribe({
      next: (res: any) => {
        const citas = res?.data ?? [];
        const citaExistente = Array.isArray(citas) && citas.some(c => {
          const inicioCita = c?.inicio ? new Date(c.inicio).getTime() : NaN;
          const finCita = c?.fin ? new Date(c.fin).getTime() : NaN;
          return c?.medicoId === sol.medicoId
            && c?.pacienteId === pacienteId
            && inicioCita === inicio.getTime()
            && finCita === fin.getTime();
        });

        if (!citaExistente) {
          this.errorHandler.showError(409, res?.message ?? 'Ese horario ya no esta disponible para confirmar la cita.');
          this.actionLoading.set(false);
          return;
        }

        this.confirmarSolicitud$(sol.solicitudId, sol.tipo).subscribe({
          next: (estadoRes: any) => {
            const exitoso = estadoRes?.success ?? (estadoRes as any)?.exitoso;
            if (!exitoso) {
              const msg = estadoRes?.message ?? (estadoRes as any)?.mensaje ?? 'La cita existe, pero no se pudo confirmar la solicitud.';
              this.errorHandler.showError(409, msg);
              this.actionLoading.set(false);
              return;
            }

            this.finalizarAprobacionExitosa('La cita ya existia y la solicitud quedo confirmada correctamente.');
          },
          error: (estadoErr: any) => {
            if (this.esConflictoConMensajeExitoso(estadoErr)) {
              this.finalizarAprobacionExitosa('La cita ya existia y la solicitud quedo confirmada correctamente.');
              return;
            }

            const msg = estadoErr?.error?.message ?? estadoErr?.error?.mensaje ?? estadoErr?.message ?? 'La cita existe, pero no se pudo confirmar la solicitud.';
            this.errorHandler.showError(409, msg);
            this.actionLoading.set(false);
          }
        });
      },
      error: () => {
        this.errorHandler.showError(409, 'No se pudo verificar si la cita ya habia sido creada. Intenta recargar el listado.');
        this.actionLoading.set(false);
      }
    });
  }

  // ===== RECHAZAR =====
  abrirRechazar(): void {
    this.showRechazarDialog.set(true);
  }

  confirmarRechazar(): void {
    const sol = this.solicitud();
    if (!sol) return;

    this.actionLoading.set(true);
    const cambiar$ = this.rechazarSolicitud$(sol.solicitudId, sol.tipo);

    cambiar$.subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Solicitud rechazada');
          this.showRechazarDialog.set(false);
          this.router.navigate(['/solicitudes']);
        } else {
          this.errorHandler.showError(400, res.message);
        }
        this.actionLoading.set(false);
      },
      error: (err: any) => {
        if (this.esConflictoConMensajeExitoso(err)) {
          this.errorHandler.showSuccess('Solicitud rechazada correctamente');
          this.showRechazarDialog.set(false);
          this.router.navigate(['/solicitudes']);
          this.actionLoading.set(false);
          return;
        }

        const msg = err?.error?.message ?? err?.error?.mensaje ?? err?.message ?? 'Error al rechazar la solicitud';
        this.errorHandler.showError(err?.status ?? 500, msg);
        this.actionLoading.set(false);
      }
    });
  }

  // ===== REPROGRAMAR =====
  toggleReprogramar(): void {
    this.showReprogramarForm.update(v => !v);
  }

  enviarPropuesta(): void {
    if (!this.nuevaFechaHora) {
      this.errorHandler.showWarning('Selecciona una fecha y hora');
      return;
    }

    const sol = this.solicitud();
    if (!sol) return;

    this.actionLoading.set(true);
    const propuesta: PropuestaReprogramacionInsertarDTO = {
      solicitudCitaId: sol.tipo === 'USUARIO' ? sol.solicitudId : undefined,
      solicitudPublicaId: sol.tipo === 'PUBLICA' ? sol.solicitudId : undefined,
      opcionInicio: new Date(this.nuevaFechaHora).toISOString(),
      usuarioProponeId: this.auth.usuarioIdActual() ?? 0
    };

    this.solicitudesService.crearPropuesta(propuesta).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Propuesta enviada exitosamente');
          this.showReprogramarForm.set(false);
          this.nuevaFechaHora = '';
          this.cargarDetalle();
        } else {
          this.errorHandler.showError(400, res.message);
        }
        this.actionLoading.set(false);
      },
      error: (err) => {
        if (this.esConflictoConMensajeExitoso(err)) {
          this.errorHandler.showSuccess('Propuesta enviada exitosamente');
          this.showReprogramarForm.set(false);
          this.nuevaFechaHora = '';
          this.cargarDetalle();
          this.actionLoading.set(false);
          return;
        }

        const msg = err?.error?.message ?? err?.error?.mensaje ?? err?.message ?? 'Error al enviar propuesta';
        this.errorHandler.showError(err?.status ?? 500, msg);
        this.actionLoading.set(false);
      }
    });
  }

  // ===== PROPUESTAS =====
  aceptarPropuesta(p: any): void {
    this.actionLoading.set(true);
    this.solicitudesService.aceptarPropuesta({
      propuestaId: p.propuestaId,
      usuarioId: this.auth.usuarioIdActual() ?? 0
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Propuesta aceptada');
          this.cargarDetalle();
        }
        this.actionLoading.set(false);
      },
      error: () => {
        this.errorHandler.showError(500, 'Error al aceptar propuesta');
        this.actionLoading.set(false);
      }
    });
  }

  rechazarPropuesta(p: any): void {
    this.actionLoading.set(true);
    this.solicitudesService.rechazarPropuesta(p.propuestaId).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Propuesta rechazada');
          this.cargarDetalle();
        }
        this.actionLoading.set(false);
      },
      error: () => {
        this.errorHandler.showError(500, 'Error al rechazar propuesta');
        this.actionLoading.set(false);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/solicitudes']);
  }
}
