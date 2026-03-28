import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, catchError, timeout } from 'rxjs';

import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { CitasService } from '../../core/services/Clinica/citas.service';
import { DoctoresService } from '../../core/services/Clinica/doctores.service';
import { PacienteService } from '../../core/services/Clinica/paciente.service';
import { SolicitudesService } from '../../core/services/Clinica/solicitudes.service';
import { UsuarioService } from '../../core/services/Accesos/usuarios/usuario.service';
import { EspecialidadesService } from '../../core/services/Clinica/especialidades.service';

import { CitaListadoResponse } from '../../core/models/Clinica/Citas/citas-read.model';
import { Doctor } from '../../core/models/Clinica/Doctores/doctor.model';
import { Paciente } from '../../core/models/Clinica/Pacientes/paciente.model';
import { Usuario } from '../../core/models/Accesos/usuario.model';
import { Sala } from '../../core/models/Catalogos/sala.model';
import { Especialidad } from '../../core/models/Catalogos/especialidad.model';
import { SolicitudUnificada } from '../../core/models/Clinica/Solicitudes/solicitud-publica.model';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    TabsModule, TableModule, TagModule, SelectModule,
    DatePickerModule, ProgressSpinnerModule
  ],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {
  private citasService = inject(CitasService);
  private doctoresService = inject(DoctoresService);
  private pacienteService = inject(PacienteService);
  private solicitudesService = inject(SolicitudesService);
  private usuarioService = inject(UsuarioService);
  private especialidadesService = inject(EspecialidadesService);

  loading = true;

  // Raw data
  citas: CitaListadoResponse[] = [];
  doctores: Doctor[] = [];
  pacientes: Paciente[] = [];
  usuarios: Usuario[] = [];
  salas: Sala[] = [];
  especialidades: Especialidad[] = [];
  solicitudes: SolicitudUnificada[] = [];

  // Filters
  filtroDesde: Date | null = null;
  filtroHasta: Date | null = null;

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    const hoy = new Date();
    const hace30 = new Date();
    hace30.setDate(hoy.getDate() - 30);

    forkJoin({
      citas: this.citasService.obtenerPorFiltro({}).pipe(timeout(15000), catchError(() => of({ data: [] }))),
      doctores: this.doctoresService.listar(true).pipe(timeout(15000), catchError(() => of([]))),
      pacientes: this.pacienteService.listar().pipe(timeout(15000), catchError(() => of([]))),
      usuarios: this.usuarioService.listar().pipe(timeout(15000), catchError(() => of([]))),
      salas: this.citasService.listarSalas().pipe(timeout(15000), catchError(() => of({ data: [] }))),
      especialidades: this.especialidadesService.listar().pipe(timeout(15000), catchError(() => of([]))),
      solicitudesPublicas: this.solicitudesService.listarPublicas({}).pipe(timeout(15000), catchError(() => of({ data: [] }))),
      solicitudesUsuarios: this.solicitudesService.listarUsuarios({}).pipe(timeout(15000), catchError(() => of({ data: [] })))
    }).subscribe({
      next: (res) => {
        this.citas = this.extraerDatos(res.citas);
        this.doctores = Array.isArray(res.doctores) ? res.doctores : [];
        this.pacientes = Array.isArray(res.pacientes) ? res.pacientes : [];
        this.usuarios = Array.isArray(res.usuarios) ? res.usuarios : [];
        this.salas = this.extraerDatos(res.salas);
        this.especialidades = Array.isArray(res.especialidades) ? res.especialidades : [];

        const publicas = this.extraerDatos(res.solicitudesPublicas).map((s: any) => ({ ...s, tipo: 'PUBLICA' as const }));
        const deUsuario = this.extraerDatos(res.solicitudesUsuarios).map((s: any) => ({ ...s, tipo: 'USUARIO' as const }));
        this.solicitudes = [...publicas, ...deUsuario];

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  // ─── Citas stats ───
  get citasFiltradas(): CitaListadoResponse[] {
    return this.filtrarPorFecha(this.citas, 'inicio');
  }

  get citasAtendidas(): number {
    return this.citasFiltradas.filter(c => this.esEstado(c.codigoEstado, ['ATEN', 'ATENDIDA', 'FINALIZADA'])).length;
  }

  get citasPendientes(): number {
    return this.citasFiltradas.filter(c => this.esEstado(c.codigoEstado, ['PEND', 'PENDIENTE'])).length;
  }

  get citasConfirmadas(): number {
    return this.citasFiltradas.filter(c => this.esEstado(c.codigoEstado, ['CONF', 'CONFIRMADA'])).length;
  }

  get citasCanceladas(): number {
    return this.citasFiltradas.filter(c => this.esEstado(c.codigoEstado, ['CANC', 'CANCELADA'])).length;
  }

  get citasNoAsistidas(): number {
    return this.citasFiltradas.filter(c => this.esEstado(c.codigoEstado, ['NOAS', 'NO_ASISTIO'])).length;
  }

  // ─── Recepción stats ───
  get pacientesAtendidos(): CitaListadoResponse[] {
    return this.citasFiltradas.filter(c => this.esEstado(c.codigoEstado, ['ATEN', 'ATENDIDA', 'FINALIZADA']));
  }

  get saturacionDoctores(): { medico: string; total: number; atendidas: number; pendientes: number; porcentaje: number }[] {
    const mapa = new Map<string, { total: number; atendidas: number; pendientes: number }>();
    for (const c of this.citasFiltradas) {
      const nombre = c.medico || `Doctor #${c.medicoId}`;
      if (!mapa.has(nombre)) mapa.set(nombre, { total: 0, atendidas: 0, pendientes: 0 });
      const entry = mapa.get(nombre)!;
      entry.total++;
      if (this.esEstado(c.codigoEstado, ['ATEN', 'ATENDIDA', 'FINALIZADA'])) entry.atendidas++;
      if (this.esEstado(c.codigoEstado, ['PEND', 'PENDIENTE', 'CONF', 'CONFIRMADA'])) entry.pendientes++;
    }
    return Array.from(mapa.entries())
      .map(([medico, v]) => ({ medico, ...v, porcentaje: v.total > 0 ? Math.round((v.atendidas / v.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }

  // ─── Pacientes stats ───
  get pacientesActivos(): number {
    return this.pacientes.filter(p => p.activo).length;
  }

  get pacientesInactivos(): number {
    return this.pacientes.filter(p => !p.activo).length;
  }

  get pacientesPorMes(): { mes: string; cantidad: number }[] {
    const mapa = new Map<string, number>();
    for (const c of this.citasFiltradas.filter(c => this.esEstado(c.codigoEstado, ['ATEN', 'ATENDIDA', 'FINALIZADA']))) {
      const fecha = new Date(c.inicio);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      mapa.set(key, (mapa.get(key) || 0) + 1);
    }
    return Array.from(mapa.entries())
      .map(([mes, cantidad]) => ({ mes, cantidad }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }

  // ─── Doctores stats ───
  get doctoresConEspecialidad(): { doctor: string; especialidad: string; activo: boolean }[] {
    return this.doctores.map(d => ({
      doctor: d.nombrePublico,
      especialidad: d.nombreEspecialidad || 'Sin especialidad',
      activo: d.activo
    }));
  }

  get totalDoctoresActivos(): number {
    return this.doctores.filter(d => d.activo).length;
  }

  get especialidadesResumen(): { nombre: string; cantidadDoctores: number }[] {
    const mapa = new Map<string, number>();
    for (const d of this.doctores) {
      const esp = d.nombreEspecialidad || 'Sin especialidad';
      mapa.set(esp, (mapa.get(esp) || 0) + 1);
    }
    return Array.from(mapa.entries())
      .map(([nombre, cantidadDoctores]) => ({ nombre, cantidadDoctores }))
      .sort((a, b) => b.cantidadDoctores - a.cantidadDoctores);
  }

  get historialPorDoctor(): { medico: string; totalCitas: number; atendidas: number; canceladas: number }[] {
    const mapa = new Map<string, { totalCitas: number; atendidas: number; canceladas: number }>();
    for (const c of this.citas) {
      const nombre = c.medico || `Doctor #${c.medicoId}`;
      if (!mapa.has(nombre)) mapa.set(nombre, { totalCitas: 0, atendidas: 0, canceladas: 0 });
      const entry = mapa.get(nombre)!;
      entry.totalCitas++;
      if (this.esEstado(c.codigoEstado, ['ATEN', 'ATENDIDA', 'FINALIZADA'])) entry.atendidas++;
      if (this.esEstado(c.codigoEstado, ['CANC', 'CANCELADA', 'NOAS', 'NO_ASISTIO'])) entry.canceladas++;
    }
    return Array.from(mapa.entries())
      .map(([medico, v]) => ({ medico, ...v }))
      .sort((a, b) => b.totalCitas - a.totalCitas);
  }

  // ─── Solicitudes stats ───
  get solicitudesFiltradas(): SolicitudUnificada[] {
    return this.filtrarPorFecha(this.solicitudes as any[], 'fechaCreacion') as any[];
  }

  get solicitudesPublicas(): number {
    return this.solicitudesFiltradas.filter(s => s.tipo === 'PUBLICA').length;
  }

  get solicitudesDeUsuario(): number {
    return this.solicitudesFiltradas.filter(s => s.tipo === 'USUARIO').length;
  }

  get solicitudesPorEstado(): { estado: string; cantidad: number }[] {
    const mapa = new Map<string, number>();
    for (const s of this.solicitudesFiltradas) {
      const estado = s.estado || s.codigoEstado || 'Desconocido';
      mapa.set(estado, (mapa.get(estado) || 0) + 1);
    }
    return Array.from(mapa.entries())
      .map(([estado, cantidad]) => ({ estado, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  // ─── Usuarios stats ───
  get usuariosPorRol(): { rolId: number; cantidad: number }[] {
    const mapa = new Map<number, number>();
    for (const u of this.usuarios) {
      mapa.set(u.rolId, (mapa.get(u.rolId) || 0) + 1);
    }
    return Array.from(mapa.entries())
      .map(([rolId, cantidad]) => ({ rolId, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  get usuariosActivos(): number {
    return this.usuarios.filter(u => u.activo).length;
  }

  get usuariosInactivos(): number {
    return this.usuarios.filter(u => !u.activo).length;
  }

  // ─── Salas stats ───
  get salasActivas(): number {
    return this.salas.filter(s => s.activo).length;
  }

  get salasInactivas(): number {
    return this.salas.filter(s => !s.activo).length;
  }

  get ocupacionSalas(): { sala: string; totalCitas: number; atendidas: number }[] {
    const mapa = new Map<string, { totalCitas: number; atendidas: number }>();
    for (const c of this.citasFiltradas) {
      const nombre = c.sala || `Sala #${c.salaId}`;
      if (!mapa.has(nombre)) mapa.set(nombre, { totalCitas: 0, atendidas: 0 });
      const entry = mapa.get(nombre)!;
      entry.totalCitas++;
      if (this.esEstado(c.codigoEstado, ['ATEN', 'ATENDIDA', 'FINALIZADA'])) entry.atendidas++;
    }
    return Array.from(mapa.entries())
      .map(([sala, v]) => ({ sala, ...v }))
      .sort((a, b) => b.totalCitas - a.totalCitas);
  }

  // ─── Helpers ───
  estadoSeverity(codigo: string | null | undefined): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    const c = (codigo ?? '').toUpperCase();
    if (['ATEN', 'ATENDIDA', 'FINALIZADA'].includes(c)) return 'success';
    if (['CONF', 'CONFIRMADA'].includes(c)) return 'info';
    if (['PEND', 'PENDIENTE'].includes(c)) return 'warn';
    if (['CANC', 'CANCELADA', 'NOAS', 'NO_ASISTIO'].includes(c)) return 'danger';
    return 'secondary';
  }

  nombreRol(rolId: number): string {
    const roles: Record<number, string> = { 1: 'Admin', 2: 'Recepción', 3: 'Doctor', 4: 'Paciente' };
    return roles[rolId] || `Rol ${rolId}`;
  }

  private esEstado(codigo: string | null | undefined, valores: string[]): boolean {
    return valores.includes((codigo ?? '').toUpperCase());
  }

  private extraerDatos(res: any): any[] {
    if (Array.isArray(res)) return res;
    return res?.data ?? res?.datos ?? [];
  }

  private filtrarPorFecha<T extends Record<string, any>>(lista: T[], campo: string): T[] {
    if (!this.filtroDesde && !this.filtroHasta) return lista;
    return lista.filter(item => {
      const fecha = new Date(item[campo]);
      if (this.filtroDesde && fecha < this.filtroDesde) return false;
      if (this.filtroHasta) {
        const hasta = new Date(this.filtroHasta);
        hasta.setHours(23, 59, 59, 999);
        if (fecha > hasta) return false;
      }
      return true;
    });
  }
}
