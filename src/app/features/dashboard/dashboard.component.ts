import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { catchError, finalize, forkJoin, of, switchMap, timeout } from 'rxjs';
import { AuthService } from '../../core/services/Accesos/auth/auth.service';
import { CitasService } from '../../core/services/Clinica/citas.service';
import { DoctoresService } from '../../core/services/Clinica/doctores.service';
import { PacienteService } from '../../core/services/Clinica/paciente.service';
import { SolicitudesService } from '../../core/services/Clinica/solicitudes.service';
import { CitaListadoResponse } from '../../core/models/Clinica/Citas/citas-read.model';
import { Doctor } from '../../core/models/Clinica/Doctores/doctor.model';
import { Paciente } from '../../core/models/Clinica/Pacientes/paciente.model';
import { Sala } from '../../core/models/Catalogos/sala.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, CardModule, TagModule, ProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  public auth = inject(AuthService);
  private citasService = inject(CitasService);
  private doctoresService = inject(DoctoresService);
  private pacienteService = inject(PacienteService);
  private solicitudesService = inject(SolicitudesService);
  private cdr = inject(ChangeDetectorRef);

  loadingPaciente = false;
  loadingAdmin = false;
  citasPaciente: CitaListadoResponse[] = [];
  doctoresActivos: Doctor[] = [];

  // Admin data
  allCitas: CitaListadoResponse[] = [];
  allDoctores: Doctor[] = [];
  allPacientes: Paciente[] = [];
  allSalas: Sala[] = [];
  totalSolicitudes = 0;
  solicitudesPendientesCount = 0;

  ngOnInit(): void {
    if (this.auth.esPaciente) {
      this.cargarDashboardPaciente();
    } else {
      this.cargarDashboardAdmin();
    }
  }

  get userName(): string {
    return this.auth.nombreUsuario || 'Paciente';
  }

  get currentDate(): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date().toLocaleDateString('es-ES', options);
  }

  get pacienteIdActual(): number | null {
    return this.auth.pacienteIdActual();
  }

  get resumenPaciente() {
    const total = this.citasPaciente.length;
    const pendientes = this.citasPaciente.filter(c => {
      const estado = (c.codigoEstado ?? '').toUpperCase();
      return estado === 'PENDIENTE' || estado === 'CONFIRMADA' || estado === 'CONF';
    }).length;
    const atendidas = this.citasPaciente.filter(c => {
      const estado = (c.codigoEstado ?? '').toUpperCase();
      return estado === 'FINALIZADA' || estado === 'ATENDIDA' || estado === 'ATEN' || estado === 'EN_CURSO';
    }).length;
    const canceladas = this.citasPaciente.filter(c => {
      const estado = (c.codigoEstado ?? '').toUpperCase();
      return estado === 'CANCELADA' || estado === 'NO_ASISTIO' || estado === 'CANC' || estado === 'NOAS';
    }).length;

    return { total, pendientes, atendidas, canceladas };
  }

  get proximasMisCitas(): CitaListadoResponse[] {
    const now = new Date().getTime();
    return [...this.citasPaciente]
      .filter(c => new Date(c.inicio).getTime() >= now)
      .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
      .slice(0, 3);
  }

  get doctoresDestacados(): Doctor[] {
    return this.doctoresActivos.slice(0, 3);
  }

  // ─── Admin computed properties ───
  get totalPacientes(): number { return this.allPacientes.length; }
  get totalDoctores(): number { return this.allDoctores.length; }
  get totalCitas(): number { return this.allCitas.length; }
  get totalSalas(): number { return this.allSalas.length; }

  get citasAtendidas(): number {
    return this.allCitas.filter(c => this.esEstado(c.codigoEstado, ['ATEN', 'ATENDIDA', 'FINALIZADA'])).length;
  }
  get citasPendientes(): number {
    return this.allCitas.filter(c => this.esEstado(c.codigoEstado, ['PEND', 'PENDIENTE'])).length;
  }
  get citasConfirmadas(): number {
    return this.allCitas.filter(c => this.esEstado(c.codigoEstado, ['CONF', 'CONFIRMADA'])).length;
  }
  get citasCanceladas(): number {
    return this.allCitas.filter(c => this.esEstado(c.codigoEstado, ['CANC', 'CANCELADA'])).length;
  }
  get citasNoAsistidas(): number {
    return this.allCitas.filter(c => this.esEstado(c.codigoEstado, ['NOAS', 'NO_ASISTIO'])).length;
  }

  get doctoresActivosCount(): number {
    return this.allDoctores.filter(d => d.activo).length;
  }

  get citasRecientes(): CitaListadoResponse[] {
    return [...this.allCitas]
      .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())
      .slice(0, 5);
  }

  get citasHoy(): CitaListadoResponse[] {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    return this.allCitas.filter(c => {
      const f = new Date(c.inicio);
      return f >= hoy && f < manana;
    });
  }

  get distribucionEstados(): { label: string; count: number; severity: string }[] {
    return [
      { label: 'Atendidas', count: this.citasAtendidas, severity: 'success' },
      { label: 'Confirmadas', count: this.citasConfirmadas, severity: 'info' },
      { label: 'Pendientes', count: this.citasPendientes, severity: 'warn' },
      { label: 'Canceladas', count: this.citasCanceladas, severity: 'danger' },
      { label: 'No asistió', count: this.citasNoAsistidas, severity: 'danger' }
    ].filter(e => e.count > 0);
  }

  get topDoctores(): { nombre: string; citas: number; especialidad: string }[] {
    const mapa = new Map<number, { nombre: string; citas: number; especialidad: string }>();
    for (const c of this.allCitas) {
      if (!mapa.has(c.medicoId)) {
        const doc = this.allDoctores.find(d => d.medicoId === c.medicoId);
        mapa.set(c.medicoId, {
          nombre: c.medico || `Doctor #${c.medicoId}`,
          citas: 0,
          especialidad: doc?.nombreEspecialidad || ''
        });
      }
      mapa.get(c.medicoId)!.citas++;
    }
    return Array.from(mapa.values()).sort((a, b) => b.citas - a.citas).slice(0, 5);
  }

  estadoSeverity(codigo: string | null | undefined): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    const c = (codigo ?? '').toUpperCase();
    if (['ATEN', 'ATENDIDA', 'FINALIZADA'].includes(c)) return 'success';
    if (['CONF', 'CONFIRMADA'].includes(c)) return 'info';
    if (['PEND', 'PENDIENTE'].includes(c)) return 'warn';
    if (['CANC', 'CANCELADA', 'NOAS', 'NO_ASISTIO'].includes(c)) return 'danger';
    return 'secondary';
  }

  private esEstado(codigo: string | null | undefined, valores: string[]): boolean {
    return valores.includes((codigo ?? '').toUpperCase());
  }

  private extraerDatos(res: any): any[] {
    if (Array.isArray(res)) return res;
    return res?.data ?? res?.datos ?? [];
  }

  private cargarDashboardAdmin(): void {
    this.loadingAdmin = true;
    forkJoin({
      citas: this.citasService.obtenerPorFiltro({}).pipe(timeout(15000), catchError(() => of({ data: [] }))),
      doctores: this.doctoresService.listar().pipe(timeout(15000), catchError(() => of([]))),
      pacientes: this.pacienteService.listar().pipe(timeout(15000), catchError(() => of([]))),
      salas: this.citasService.listarSalas().pipe(timeout(15000), catchError(() => of({ data: [] }))),
      solPublicas: this.solicitudesService.listarPublicas({}).pipe(timeout(15000), catchError(() => of({ data: [] }))),
      solUsuarios: this.solicitudesService.listarUsuarios({}).pipe(timeout(15000), catchError(() => of({ data: [] })))
    }).pipe(
      finalize(() => {
        this.loadingAdmin = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        this.allCitas = this.extraerDatos(res.citas);
        this.allDoctores = Array.isArray(res.doctores) ? res.doctores : [];
        this.allPacientes = Array.isArray(res.pacientes) ? res.pacientes : [];
        this.allSalas = this.extraerDatos(res.salas);

        const pubArr = this.extraerDatos(res.solPublicas);
        const usrArr = this.extraerDatos(res.solUsuarios);
        this.totalSolicitudes = pubArr.length + usrArr.length;
        this.solicitudesPendientesCount = [...pubArr, ...usrArr]
          .filter((s: any) => ['PEND', 'PENDIENTE'].includes((s.codigoEstado ?? '').toUpperCase())).length;

        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      }
    });
  }

  private cargarDashboardPaciente(): void {
    this.loadingPaciente = true;
    this.pacienteService.obtenerPerfilActual().pipe(
      timeout(10000),
      catchError((error) => {
        console.warn('[Dashboard] PerfilActual fallo, usando pacienteId en sesion si existe.', error);
        return of(null);
      }),
      switchMap((perfil) => {
        if (perfil?.pacienteId) {
          this.auth.establecerPacienteId(perfil.pacienteId);
        }

        const pacienteId = this.auth.pacienteIdActual();
        if (!pacienteId) {
          return forkJoin({
            citas: of([] as CitaListadoResponse[]),
            doctores: this.doctoresService.listar(true).pipe(
              timeout(10000),
              catchError(() => of([] as Doctor[]))
            )
          });
        }

        return forkJoin({
          citas: this.citasService.obtenerPorFiltro({ pacienteId }).pipe(
            timeout(10000),
            catchError((error) => {
              console.error('[Dashboard] Error al cargar citas del paciente:', error);
              return of({ data: [] as CitaListadoResponse[] });
            })
          ),
          doctores: this.doctoresService.listar(true).pipe(
            timeout(10000),
            catchError((error) => {
              console.error('[Dashboard] Error al cargar doctores activos:', error);
              return of([] as Doctor[]);
            })
          )
        });
      }),
      finalize(() => {
        this.loadingPaciente = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (resultado) => {
        this.citasPaciente = Array.isArray(resultado.citas)
          ? resultado.citas
          : resultado.citas?.data ?? [];
        this.doctoresActivos = resultado.doctores ?? [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('[Dashboard] Error al cargar inicio del paciente:', error);
        this.citasPaciente = [];
        this.doctoresActivos = [];
        this.cdr.detectChanges();
      }
    });
  }
}
