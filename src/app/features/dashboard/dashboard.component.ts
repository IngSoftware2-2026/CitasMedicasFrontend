import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MeterGroupModule } from 'primeng/metergroup';
import { AvatarModule } from 'primeng/avatar';
import { MockDataService } from '../../core/services/Clinica/mock-data.service';
import { DashboardStats, DashboardUtils } from './operaciones';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, CardModule, TableModule, TagModule, MeterGroupModule, AvatarModule],
  providers: [MockDataService, DashboardStats, DashboardUtils],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  constructor(
    public data: MockDataService,
    public stats: DashboardStats,
    public utils: DashboardUtils
  ) {}

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
}
