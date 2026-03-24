import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { PasswordModule } from 'primeng/password';
import { AvatarModule } from 'primeng/avatar';
import { Usuario } from '../../../core/models/Accesos/usuario.model';
import { MessageService } from 'primeng/api';
import { UsuarioService } from '../../../core/services/Accesos/usuario.service';
import { UsuariosCrud, UsuariosUtils } from './operaciones';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, InputTextModule, SelectModule,
    IconFieldModule, InputIconModule, ButtonModule, DialogModule, DividerModule,
    TooltipModule, PasswordModule, AvatarModule
  ],
  providers: [MessageService, UsuariosCrud, UsuariosUtils],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuariosComponent implements OnInit, OnDestroy {
  busqueda = signal('');
  filtroRolId = signal<number | null>(null);
  usuarioDialog = signal(false);
  usuarioForm = signal<Partial<Usuario>>({});
  esEdicion = signal(false);
  detalleDialog = signal(false);
  usuarioDetalle = signal<Usuario | null>(null);
  detalleLoading = signal(false);
  listaUsuarios = signal<Usuario[]>([]);
  listaFiltrada = signal<Usuario[]>([]);
  listaRoles = signal<any[]>([]);
  totalUsuarios = signal(0);
  usuariosActivos = signal(0);
  usuariosInactivos = signal(0);
  administradoresCount = signal(0);

  opcionesFiltroRol = [
    { label: 'Todos', value: null },
    { label: 'Administrador', value: 1 },
    { label: 'Doctor', value: 2 },
    { label: 'Recepcionista', value: 3 },
    { label: 'Paciente', value: 4 },
    { label: 'Desarrollador', value: 5 }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    public crud: UsuariosCrud,
    public utils: UsuariosUtils,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {
    this.crud.setCdr(this.cdr);
  }
  
  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarDatos(): void {
    this.usuarioService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuarios: Usuario[]) => {
          this.listaUsuarios.set(usuarios);
          this.aplicarFiltros();
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Error al cargar usuarios:', error);
          this.cdr.markForCheck();
        }
      });

    this.utils.roles$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles: any[]) => {
          this.listaRoles.set(roles);
        }
      });
  }

  private aplicarFiltros(): void {
    const usuarios = this.listaUsuarios();
    let resultado = [...usuarios];

    if (this.busqueda().trim()) {
      const termino = this.busqueda().toLowerCase();
      resultado = resultado.filter(usuario => 
        usuario.nombreUsuario?.toLowerCase().includes(termino) ||
        usuario.correo?.toLowerCase().includes(termino)
      );
    }

    if (this.filtroRolId() !== null) {
      resultado = resultado.filter(usuario => usuario.rolId === this.filtroRolId());
    }

    this.listaFiltrada.set(resultado);
    this.calcularEstadisticas();
  }

  private calcularEstadisticas(): void {
    const usuarios = this.listaUsuarios();
    this.totalUsuarios.set(usuarios.length);
    this.usuariosActivos.set(usuarios.filter((u: Usuario) => u.activo).length);
    this.usuariosInactivos.set(usuarios.filter((u: Usuario) => !u.activo).length);
    this.administradoresCount.set(usuarios.filter((u: Usuario) => u.rolId === 1).length);
  }

  onSearchChange(valor: string): void {
    this.busqueda.set(valor);
    this.aplicarFiltros();
  }

  onRoleFilterChange(valor: number | null): void {
    this.filtroRolId.set(valor);
    this.aplicarFiltros();
  }

  abrirModalUsuario(usuario?: Usuario): void {
    this.esEdicion.set(!!usuario);
    if (usuario) {
      this.usuarioForm.set({ ...usuario, clave: '' });
    } else {
      this.usuarioForm.set({ activo: true });
    }
    this.usuarioDialog.set(true);
  }

  cerrarModalUsuario(): void {
    this.usuarioDialog.set(false);
  }

  guardarUsuario(): void {
    this.crud.guardar(this.usuarioForm(), this.esEdicion());
    this.usuarioDialog.set(false);
  }

  togglearEstado(usuario: Usuario): void {
    this.crud.toggleEstado(usuario);
  }

  async verDetalle(usuario: Usuario): Promise<void> {
    this.detalleLoading.set(true);
    this.detalleDialog.set(true);
    this.usuarioDetalle.set(null);

    const detalle = await this.crud.obtenerDetalle(usuario.usuarioId!);
    this.usuarioDetalle.set(detalle);
    this.detalleLoading.set(false);
    this.cdr.markForCheck();
  }

  cerrarDetalle(): void {
    this.detalleDialog.set(false);
    this.usuarioDetalle.set(null);
  }
}
