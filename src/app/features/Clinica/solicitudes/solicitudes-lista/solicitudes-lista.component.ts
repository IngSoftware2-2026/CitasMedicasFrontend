import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SolicitudesService } from '../../../../core/services/Clinica/solicitudes.service';
import { ErrorHandlerService } from '../../../../core/services/Http/error-handler.service';
import { AuthService } from '../../../../core/services/Accesos/auth/auth.service';
import { MockDataService } from '../../../../core/services/Clinica/mock-data.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  SolicitudUnificada,
  SolicitudesFiltroDTO,
  TipoSolicitud,
  CambiarEstadoSolicitudDTO
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
  private auth = inject(AuthService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  public data = inject(MockDataService);

  solicitudes = signal<SolicitudUnificada[]>([]);
  loading = signal(true);
  searchTerm = '';
  private usandoMock = false;

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
    this.usandoMock = false;

    if (!this.auth.estaAutenticado()) {
      this.cargarMockData();
      return;
    }

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
          console.warn('Error al cargar públicas, usando mock:', err);
          this.cargarMockData();
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
          console.warn('Error al cargar usuarios, usando mock:', err);
          this.cargarMockData();
        }
      });
    } else {
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
          console.warn('Error al cargar solicitudes, usando mock:', err);
          this.cargarMockData();
        }
      });
    }
  }

  private cargarMockData(): void {
    this.usandoMock = true;
    const mockData = this.data.solicitudes.map(s => {
      const estado = this.data.estadosSolicitud.find(e => e.estadoSolicitudId === s.estadoId);
      return {
        solicitudId: s.solicitudId,
        tipo: 'USUARIO' as TipoSolicitud,
        nombrePaciente: this.data.getPacienteNombre(s.pacienteId),
        telefono: '00000000',
        medicoId: s.medicoId,
        medico: this.data.getDoctorNombre(s.medicoId),
        fechaHoraInicio: s.fechaHoraInicio instanceof Date ? s.fechaHoraInicio.toISOString() : s.fechaHoraInicio,
        duracionMinutos: s.duracionMinutos,
        motivo: s.motivo,
        estadoId: s.estadoId,
        codigoEstado: estado?.codigoEstado ?? 'PENDIENTE',
        estado: estado?.nombreEstado ?? 'Pendiente',
        fechaCreacion: s.fechaCreacion instanceof Date ? s.fechaCreacion.toISOString() : s.fechaCreacion,
        pacienteId: s.pacienteId
      } as SolicitudUnificada;
    });
    this.solicitudes.set(mockData);
    this.currentPage = 1;
    this.loading.set(false);
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
      (s.telefono ?? '').includes(term)
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
    return this.solicitudes().filter(s => s.codigoEstado === 'APROBADA' || s.codigoEstado === 'CONFIRMADA').length;
  }

  get rechazadasCount(): number {
    return this.solicitudes().filter(s => s.codigoEstado === 'RECHAZADA').length;
  }

  get reprogramadasCount(): number {
    return this.solicitudes().filter(s => s.codigoEstado === 'REPROGRAMADA' || s.codigoEstado === 'PROPUESTA').length;
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
      case 'APROBADA':
      case 'CONFIRMADA': return 'badge-success';
      case 'RECHAZADA': return 'badge-danger';
      case 'REPROGRAMADA':
      case 'PROPUESTA': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  getTipoClass(tipo: string): string {
    return tipo === 'PUBLICA' ? 'badge-tipo-publica' : 'badge-tipo-usuario';
  }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
  }

  get puedeGestionar(): boolean {
    const rolId = this.auth.rolIdActual();
    return rolId === 1 || rolId === 2 || rolId === 3;
  }

  aprobarSolicitud(sol: SolicitudUnificada): void {
    this.confirmationService.confirm({
      message: `¿Aprobar la solicitud de ${sol.nombrePaciente}?`,
      header: 'Confirmar aprobación',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, aprobar',
      rejectLabel: 'No',
      accept: () => this.ejecutarCambioEstado(sol, 'APROBADA')
    });
  }

  rechazarSolicitud(sol: SolicitudUnificada): void {
    this.confirmationService.confirm({
      message: `¿Rechazar la solicitud de ${sol.nombrePaciente}?`,
      header: 'Confirmar rechazo',
      icon: 'pi pi-times-circle',
      acceptLabel: 'Sí, rechazar',
      rejectLabel: 'No',
      accept: () => this.ejecutarCambioEstado(sol, 'RECHAZADA')
    });
  }

  private ejecutarCambioEstado(sol: SolicitudUnificada, nuevoEstado: string): void {
    if (this.usandoMock) {
      const idx = this.solicitudes().findIndex(s => s.solicitudId === sol.solicitudId);
      if (idx >= 0) {
        const updated = [...this.solicitudes()];
        updated[idx] = { ...updated[idx], codigoEstado: nuevoEstado, estado: nuevoEstado === 'APROBADA' ? 'Aprobada' : 'Rechazada' };
        this.solicitudes.set(updated);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Solicitud ${nuevoEstado.toLowerCase()}`
        });
      }
      return;
    }

    const dto: CambiarEstadoSolicitudDTO = {
      solicitudId: sol.solicitudId,
      codigoEstado: nuevoEstado
    };

    const serviceCall = sol.tipo === 'PUBLICA'
      ? this.solicitudesService.cambiarEstadoPublica(dto)
      : this.solicitudesService.cambiarEstadoUsuario(dto);

    serviceCall.subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Solicitud ${nuevoEstado.toLowerCase()}`
          });
          this.cargarSolicitudes();
          return;
        }
        this.errorHandler.showError(400, response.message || 'No se pudo cambiar el estado');
      },
      error: (error) => {
        this.errorHandler.showError(error?.status || 500, 'No se pudo cambiar el estado');
      }
    });
  }
}
