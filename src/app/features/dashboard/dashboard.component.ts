import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MockDataService } from '../../core/services/mock-data.service';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MeterGroupModule } from 'primeng/metergroup';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, CardModule, TableModule, TagModule, MeterGroupModule, AvatarModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  constructor(public data: MockDataService, private router: Router) {}

  get totalPacientes(): number { return this.data.pacientes.filter(p => p.activo).length; }
  get totalDoctores(): number { return this.data.doctores.filter(d => d.activo).length; }
  get citasConfirmadas(): number { return this.data.citas.filter(c => c.estadoId === 1).length; }
  get solicitudesPendientes(): number { return this.data.solicitudes.filter(s => s.estadoId === 1).length; }
  get totalSalasActivas(): number { return this.data.salas.filter(s => s.activo).length; }
  get totalEspecialidades(): number { return this.data.especialidades.filter(e => e.activo).length; }
  get totalCitas(): number { return this.data.citas.length; }

  get recentCitas() {
    return this.data.citas
      .map(c => ({
        ...c,
        pacienteNombre: this.data.getPacienteNombre(c.pacienteId),
        doctorNombre: this.data.getDoctorNombre(c.medicoId),
        estadoNombre: this.data.getEstadoCitaNombre(c.estadoId),
        estadoCodigo: this.data.getEstadoCitaCodigo(c.estadoId),
        pacienteInitials: this.getInitials(this.data.getPacienteNombre(c.pacienteId))
      }))
      .sort((a, b) => b.inicio.getTime() - a.inicio.getTime())
      .slice(0, 6);
  }

  get meterData() {
    const total = this.data.citas.length || 1;
    const conf = this.data.citas.filter(c => c.estadoId === 1).length;
    const fin = this.data.citas.filter(c => c.estadoId === 3).length;
    const canc = this.data.citas.filter(c => c.estadoId === 4 || c.estadoId === 5).length;
    return [
      { label: 'Confirmadas', value: Math.round(conf / total * 100), color: '#6366f1' },
      { label: 'Finalizadas', value: Math.round(fin / total * 100), color: '#22c55e' },
      { label: 'Canceladas', value: Math.round(canc / total * 100), color: '#ef4444' }
    ];
  }

  get distributionStats() {
    const total = this.data.citas.length || 1;
    const conf = this.data.citas.filter(c => c.estadoId === 1).length;
    const enCurso = this.data.citas.filter(c => c.estadoId === 2).length;
    const fin = this.data.citas.filter(c => c.estadoId === 3).length;
    const canc = this.data.citas.filter(c => c.estadoId === 4 || c.estadoId === 5).length;
    return [
      { label: 'Confirmadas', count: conf, pct: Math.round(conf / total * 100), color: '#6366f1', icon: 'pi pi-check-circle' },
      { label: 'En curso', count: enCurso, pct: Math.round(enCurso / total * 100), color: '#f59e0b', icon: 'pi pi-spin pi-spinner' },
      { label: 'Finalizadas', count: fin, pct: Math.round(fin / total * 100), color: '#22c55e', icon: 'pi pi-verified' },
      { label: 'Canceladas', count: canc, pct: Math.round(canc / total * 100), color: '#ef4444', icon: 'pi pi-times-circle' }
    ];
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  navigateTo(route: string): void {
    this.router.navigate(['/' + route]);
  }
}
