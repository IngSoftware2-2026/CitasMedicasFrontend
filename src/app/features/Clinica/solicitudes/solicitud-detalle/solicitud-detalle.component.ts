import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
    return this.solicitud()?.codigoEstado === 'PENDIENTE';
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
      case 'APROBADA': return 'status-approved';
      case 'RECHAZADA': return 'status-rejected';
      case 'REPROGRAMADA': return 'status-rescheduled';
      default: return 'status-default';
    }
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

    this.solicitudesService.crearCita(citaData).subscribe({
      next: (res) => {
        const exitoso = res?.success ?? (res as any)?.exitoso;
        if (exitoso) {
          this.errorHandler.showSuccess('Cita creada exitosamente');
          // Cambiar estado a APROBADA
          const dto = { solicitudId: sol.solicitudId, codigoEstado: 'APROBADA' };
          const cambiar$ = sol.tipo === 'PUBLICA'
            ? this.solicitudesService.cambiarEstadoPublica(dto)
            : this.solicitudesService.cambiarEstadoUsuario(dto);
          cambiar$.subscribe();
          this.showAprobarDialog.set(false);
          this.router.navigate(['/solicitudes']);
        } else {
          const msg = res?.message ?? (res as any)?.mensaje ?? 'Error al crear la cita';
          this.errorHandler.showError(400, msg);
        }
        this.actionLoading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error?.mensaje ?? 'Error al crear la cita';
        this.errorHandler.showError(500, msg);
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
    const dto = { solicitudId: sol.solicitudId, codigoEstado: 'RECHAZADA' };
    const cambiar$ = sol.tipo === 'PUBLICA'
      ? this.solicitudesService.cambiarEstadoPublica(dto)
      : this.solicitudesService.cambiarEstadoUsuario(dto);

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
      error: () => {
        this.errorHandler.showError(500, 'Error al rechazar la solicitud');
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
      error: () => {
        this.errorHandler.showError(500, 'Error al enviar propuesta');
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
