/**
 * ============================================================
 * Componente de Gestión de Usuarios
 * ============================================================
 * 
 * Descripción:
 * -----------
 * Gestiona el CRUD completo de usuarios del sistema. Permite
 * listar, crear, editar, eliminar usuarios y cambiar su estado.
 * 
 * Características:
 * - Lista usuarios con paginación y filtros
 * - Búsqueda por nombre de usuario y correo
 * - Filtro por rol
 * - Modal para crear/editar usuarios
 * - Modal de detalle de usuario
 * - Cambio de estado (activo/inactivo)
 * - Estadísticas en tiempo real
 * 
 * Estados del Componente:
 * ----------------------
 * - Lista de usuarios cargada
 * - Modal de usuario abierto (crear/editar)
 * - Modal de detalle abierto
 * - Filtros aplicados
 * 
 * Servicios Utilizados:
 * -------------------
 * - UsuarioService: Acceso a datos de usuarios
 * - UsuariosCrud: Operaciones CRUD de usuarios
 * - UsuariosUtils: Utilidades para usuarios
 * - RefreshManager: Registro para actualización de datos
 */
import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal, ChangeDetectionStrategy, inject } from '@angular/core';
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
import { UsuarioService } from '../../../core/services/Accesos/usuarios/usuario.service';
import { RefreshManager } from '../../../core/shared/services/data-refresh.service';
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
  /** Término de búsqueda para filtrar usuarios */
  busqueda = signal('');
  
  /** ID del rol seleccionado para filtrar */
  filtroRolId = signal<number | null>(null);
  
  /** Bandera para mostrar modal de usuario */
  mostrarModalUsuario = signal(false);
  
  /** Formulario de datos del usuario */
  formularioUsuario = signal<Partial<Usuario>>({});
  
  /** Bandera para indicar si es edición o creación */
  esEdicion = signal(false);
  
  /** Bandera para mostrar modal de detalle */
  mostrarModalDetalle = signal(false);
  
  /** Usuario seleccionado para ver detalle */
  usuarioDetalle = signal<Usuario | null>(null);
  
  /** Bandera de carga para detalle */
  cargandoDetalle = signal(false);
  
  /** Lista completa de usuarios */
  listaUsuarios = signal<Usuario[]>([]);
  
  /** Lista filtrada de usuarios */
  listaFiltrada = signal<Usuario[]>([]);
  
  /** Lista de roles disponibles */
  listaRoles = signal<any[]>([]);
  
  /** Total de usuarios en el sistema */
  totalUsuarios = signal(0);
  
  /** Cantidad de usuarios activos */
  usuariosActivos = signal(0);
  
  /** Cantidad de usuarios inactivos */
  usuariosInactivos = signal(0);
  
  /** Cantidad de administradores */
  cantidadAdministradores = signal(0);

  /** Opciones para el filtro de roles */
  opcionesFiltroRol = [
    { label: 'Todos', value: null },
    { label: 'Administrador', value: 1 },
    { label: 'Doctor', value: 2 },
    { label: 'Recepcionista', value: 3 },
    { label: 'Paciente', value: 4 },
    { label: 'Desarrollador', value: 5 }
  ];

  /** Subject para gestionar la destrucción de suscripciones */
  private destroy$ = new Subject<void>();
  
  /** Gestor de actualización de datos */
  private refreshManager = inject(RefreshManager);

  constructor(
    public crud: UsuariosCrud,
    public utils: UsuariosUtils,
    private usuarioService: UsuarioService,
    private detectorCambios: ChangeDetectorRef
  ) {
    this.crud.setCdr(this.detectorCambios);
  }

  /** Inicializa el componente cargando datos y registrando para actualizaciones */
  ngOnInit(): void {
    this.cargarDatos();
    this.refreshManager.register('usuarios', () => this.cargarDatos());
  }

  /** Limpia recursos al destruir el componente */
  ngOnDestroy(): void {
    this.refreshManager.unregister('usuarios');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Carga usuarios y roles desde el servidor */
  private cargarDatos(): void {
    this.usuarioService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuarios: Usuario[]) => {
          this.listaUsuarios.set(usuarios);
          this.aplicarFiltros();
          this.detectorCambios.markForCheck();
        },
        error: (error: any) => {
          console.error('Error al cargar usuarios:', error);
          this.detectorCambios.markForCheck();
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

  /** Aplica filtros de búsqueda y rol a la lista de usuarios */
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

  /** Calcula estadísticas de usuarios */
  private calcularEstadisticas(): void {
    const usuarios = this.listaUsuarios();
    this.totalUsuarios.set(usuarios.length);
    this.usuariosActivos.set(usuarios.filter((u: Usuario) => u.activo).length);
    this.usuariosInactivos.set(usuarios.filter((u: Usuario) => !u.activo).length);
    this.cantidadAdministradores.set(usuarios.filter((u: Usuario) => u.rolId === 1).length);
  }

  /** Maneja el cambio en el término de búsqueda */
  onSearchChange(valor: string): void {
    this.busqueda.set(valor);
    this.aplicarFiltros();
  }

  /** Maneja el cambio en el filtro de rol */
  onRoleFilterChange(valor: number | null): void {
    this.filtroRolId.set(valor);
    this.aplicarFiltros();
  }

  /** Abre el modal para crear o editar un usuario */
  abrirModalUsuario(usuario?: Usuario): void {
    this.esEdicion.set(!!usuario);
    if (usuario) {
      this.formularioUsuario.set({ ...usuario, clave: '' });
    } else {
      this.formularioUsuario.set({ activo: true });
    }
    this.mostrarModalUsuario.set(true);
  }

  /** Cierra el modal de usuario */
  cerrarModalUsuario(): void {
    this.mostrarModalUsuario.set(false);
  }

  /** Guarda el usuario (crear o actualizar) */
  guardarUsuario(): void {
    this.crud.guardar(this.formularioUsuario(), this.esEdicion());
    this.mostrarModalUsuario.set(false);
  }

  /** Alterna el estado activo/inactivo de un usuario */
  togglearEstado(usuario: Usuario): void {
    this.crud.toggleEstado(usuario);
  }

  /** Carga y muestra el detalle de un usuario */
  async verDetalle(usuario: Usuario): Promise<void> {
    this.cargandoDetalle.set(true);
    this.mostrarModalDetalle.set(true);
    this.usuarioDetalle.set(null);

    const detalle = await this.crud.obtenerDetalle(usuario.usuarioId!);
    this.usuarioDetalle.set(detalle);
    this.cargandoDetalle.set(false);
    this.detectorCambios.markForCheck();
  }

  /** Cierra el modal de detalle */
  cerrarDetalle(): void {
    this.mostrarModalDetalle.set(false);
    this.usuarioDetalle.set(null);
  }
}
