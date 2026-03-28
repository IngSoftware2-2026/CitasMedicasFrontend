import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { catchError, finalize, forkJoin, of, switchMap, timeout } from 'rxjs';
import { AuthService } from '../../core/services/Accesos/auth/auth.service';
import { CitasService } from '../../core/services/Clinica/citas.service';
import { DoctoresService } from '../../core/services/Clinica/doctores.service';
import { PacienteService } from '../../core/services/Clinica/paciente.service';
import { CitaListadoResponse } from '../../core/models/Clinica/Citas/citas-read.model';
import { Doctor } from '../../core/models/Clinica/Doctores/doctor.model';
import { Paciente } from '../../core/models/Clinica/Pacientes/paciente.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, CardModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  public auth = inject(AuthService);
  private citasService = inject(CitasService);
  private doctoresService = inject(DoctoresService);
  private pacienteService = inject(PacienteService);
  private cdr = inject(ChangeDetectorRef);

  loadingPaciente = false;
  loadingGeneral = false;
  citasPaciente: CitaListadoResponse[] = [];
  citasGenerales: CitaListadoResponse[] = [];
  doctoresActivos: Doctor[] = [];
  pacientesActivos: Paciente[] = [];

  ngOnInit(): void {
    if (this.auth.esPaciente) {
      this.cargarDashboardPaciente();
      return;
    }

    this.cargarDashboardGeneral();
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

  // Mantenidos para compatibilidad de plantilla en otros roles.
  get totalPacientes(): number { return this.pacientesActivos.length; }
  get totalDoctores(): number { return this.doctoresActivos.filter(d => d.activo).length; }
  get totalCitas(): number { return this.citasGenerales.length; }
  get solicitudesPendientes(): number {
    return this.citasGenerales.filter(c => {
      const estado = String(c.codigoEstado ?? '').toUpperCase();
      return estado === 'CONFIRMADA' || estado === 'CONF';
    }).length;
  }
  get distributionStats(): Array<{ label: string; count: number }> {
    return [
      { label: 'Confirmadas', count: this.citasGenerales.filter(c => ['CONFIRMADA', 'CONF'].includes(String(c.codigoEstado ?? '').toUpperCase())).length },
      { label: 'Atendidas', count: this.citasGenerales.filter(c => ['FINALIZADA', 'ATENDIDA', 'ATEN', 'EN_CURSO'].includes(String(c.codigoEstado ?? '').toUpperCase())).length },
      { label: 'Canceladas', count: this.citasGenerales.filter(c => ['CANCELADA', 'CANC', 'NO_ASISTIO', 'NOAS'].includes(String(c.codigoEstado ?? '').toUpperCase())).length }
    ];
  }
  get recentCitas(): CitaListadoResponse[] {
    return [...this.citasGenerales]
      .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
      .slice(0, 5);
  }
  get esRecepcion(): boolean {
    return this.auth.esRecepcion;
  }
  get tituloDashboardGeneral(): string {
    return this.esRecepcion ? 'Dashboard de Recepcion' : 'Dashboard Operativo';
  }
  get subtituloDashboardGeneral(): string {
    return this.esRecepcion
      ? 'Resumen en tiempo real de citas confirmadas, pacientes y disponibilidad medica.'
      : 'Resumen operativo con datos reales del sistema.';
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

  private cargarDashboardGeneral(): void {
    this.loadingGeneral = true;

    forkJoin({
      citas: this.citasService.obtenerPorFiltro(this.auth.esRecepcion ? { estadoId: 2 } : {}).pipe(
        timeout(10000),
        catchError((error) => {
          console.error('[Dashboard] Error al cargar citas generales:', error);
          return of({ data: [] as CitaListadoResponse[] });
        })
      ),
      doctores: this.doctoresService.listar(true).pipe(
        timeout(10000),
        catchError((error) => {
          console.error('[Dashboard] Error al cargar doctores generales:', error);
          return of([] as Doctor[]);
        })
      ),
      pacientes: this.pacienteService.listar().pipe(
        timeout(10000),
        catchError((error) => {
          console.error('[Dashboard] Error al cargar pacientes generales:', error);
          return of([] as Paciente[]);
        })
      )
    }).pipe(
      finalize(() => {
        this.loadingGeneral = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (resultado) => {
        this.citasGenerales = resultado.citas?.data ?? [];
        this.doctoresActivos = resultado.doctores ?? [];
        this.pacientesActivos = (resultado.pacientes ?? []).filter(p => p.activo);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('[Dashboard] Error al cargar dashboard general:', error);
        this.citasGenerales = [];
        this.doctoresActivos = [];
        this.pacientesActivos = [];
        this.cdr.detectChanges();
      }
    });
  }
}
