import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MeterGroupModule } from 'primeng/metergroup';
import { AvatarModule } from 'primeng/avatar';
import { MockDataService } from '../../core/services/Clinica/mock-data.service';
import { AuthService } from '../../core/services/Accesos/auth.service';
import { DashboardStats, DashboardUtils } from './operaciones';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, CardModule, TableModule, TagModule, MeterGroupModule, AvatarModule],
  providers: [MockDataService, DashboardStats, DashboardUtils],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  
  constructor(
    public data: MockDataService,
    public stats: DashboardStats,
    public utils: DashboardUtils
  ) {}

  get userName(): string {
    return localStorage.getItem('nombreUsuario') || 'admin3';
  }

  get userInitials(): string {
    return this.userName.charAt(0).toUpperCase();
  }

  get userEmail(): string {
    return localStorage.getItem('correo') || 'admin@medicitas.hn';
  }

  get userRole(): string {
    return localStorage.getItem('rolNombre') || 'Administrador';
  }

  get totalPacientes() { return this.stats.totalPacientes; }
  get totalDoctores() { return this.stats.totalDoctores; }
  get citasConfirmadas() { return this.stats.citasConfirmadas; }
  get solicitudesPendientes() { return this.stats.solicitudesPendientes; }
  get totalSalasActivas() { return this.stats.totalSalasActivas; }
  get totalEspecialidades() { return this.stats.totalEspecialidades; }
  get totalCitas() { return this.stats.totalCitas; }

  get recentCitas() { return this.stats.recentCitas; }
  get meterData() { return this.stats.meterData; }
  get distributionStats() { return this.stats.distributionStats; }

  getInitials(name: string) { return this.utils.getInitials(name); }
  navigateTo(route: string) { return this.utils.navigateTo(route); }

  goToConfig(): void {
    this.router.navigate(['/configuraciones']);
  }

  logout(): void {
    this.auth.cerrarSesion();
  }
}
