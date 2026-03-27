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
  citasPaciente: CitaListadoResponse[] = [];
  doctoresActivos: Doctor[] = [];

  ngOnInit(): void {
    if (this.auth.esPaciente) {
      this.cargarDashboardPaciente();
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

  // Mantenidos para compatibilidad de plantilla en otros roles.
  get totalPacientes(): number { return 0; }
  get totalDoctores(): number { return 0; }
  get totalCitas(): number { return 0; }
  get solicitudesPendientes(): number { return 0; }
  get distributionStats(): Array<{ label: string; count: number }> { return []; }
  get recentCitas(): CitaListadoResponse[] { return []; }

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
