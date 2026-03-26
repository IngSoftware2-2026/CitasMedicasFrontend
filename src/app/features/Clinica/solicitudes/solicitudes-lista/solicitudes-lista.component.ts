import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SolicitudesService } from '../../../../core/services/Clinica/solicitudes.service';
import { ErrorHandlerService } from '../../../../core/services/Http/error-handler.service';
import {
  SolicitudUnificada,
  SolicitudesFiltroDTO,
  TipoSolicitud
} from '../../../../core/models/Clinica/Solicitudes/solicitud-publica.model';

@Component({
  selector: 'app-solicitudes-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './solicitudes-lista.component.html',
  styleUrl: './solicitudes-lista.component.css'
})
export class SolicitudesListaComponent implements OnInit {
  private solicitudesService = inject(SolicitudesService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);

  solicitudes = signal<SolicitudUnificada[]>([]);
  loading = signal(true);
  searchTerm = '';

  // Filtros
  filtroTipo: '' | 'PUBLICA' | 'USUARIO' = '';
  filtroEstado: '' | '1' | '2' | '3' | '4' = '';
  filtroDesde = '';
  filtroHasta = '';

  // Paginación
  currentPage = 1;
  pageSize = 10;

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.loading.set(true);
    const filtro: SolicitudesFiltroDTO = {};
    if (this.filtroEstado) filtro.estadoId = Number(this.filtroEstado);
    if (this.filtroDesde) filtro.desde = this.filtroDesde;
    if (this.filtroHasta) filtro.hasta = this.filtroHasta;

    const tipoFiltro = this.filtroTipo as TipoSolicitud | '';

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
        error: (err) => {
          this.errorHandler.showError(500, err?.error?.message ?? 'Error al cargar solicitudes públicas');
          this.loading.set(false);
        }
      });
    } else if (tipoFiltro === 'USUARIO') {
      this.solicitudesService.listarUsuarios(filtro).subscribe({
        next: (res) => {
          const data = res?.data ?? [];
          this.solicitudes.set(
            (Array.isArray(data) ? data : []).map(s => ({ ...s, tipo: 'USUARIO' as TipoSolicitud }))
          );
          this.currentPage = 1;
          this.loading.set(false);
        },
        error: (err) => {
          this.errorHandler.showError(500, err?.error?.message ?? 'Error al cargar solicitudes de usuario');
          this.loading.set(false);
        }
      });
    } else {
      // Cargar ambos en paralelo
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
        error: (err) => {
          this.errorHandler.showError(500, err?.error?.message ?? 'Error al cargar solicitudes');
          this.loading.set(false);
        }
      });
    }
  }

  filtrar(): void {
    this.cargarSolicitudes();
  }

  limpiarFiltros(): void {
    this.filtroTipo = '';
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
      s.telefono.includes(term)
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
    return this.solicitudes().filter(s => s.codigoEstado === 'PENDIENTE').length;
  }

  get aprobadasCount(): number {
    return this.solicitudes().filter(s => s.codigoEstado === 'APROBADA').length;
  }

  get rechazadasCount(): number {
    return this.solicitudes().filter(s => s.codigoEstado === 'RECHAZADA').length;
  }

  get reprogramadasCount(): number {
    return this.solicitudes().filter(s => s.codigoEstado === 'REPROGRAMADA').length;
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

  getEstadoClass(codigo: string): string {
    switch (codigo) {
      case 'PENDIENTE': return 'badge-warning';
      case 'APROBADA': return 'badge-success';
      case 'RECHAZADA': return 'badge-danger';
      case 'REPROGRAMADA': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  getTipoClass(tipo: string): string {
    return tipo === 'PUBLICA' ? 'badge-tipo-publica' : 'badge-tipo-usuario';
  }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
  }
}
