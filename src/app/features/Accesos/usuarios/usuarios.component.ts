/**
 * ============================================================
 * COMPONENTE: Gestión de Usuarios
 * ============================================================
 * Muestra una tabla con todos los usuarios del sistema.
 * Permite buscar, filtrar, crear, editar, ver detalles y cambiar estado.
 */

import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG - Tabla y búsqueda
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

// PrimeNG - Botones y diálogos
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { PasswordModule } from 'primeng/password';
import { AvatarModule } from 'primeng/avatar';

// Modelos
import { Usuario } from '../../../core/models/Accesos/usuario.model';

// Servicios
import { MessageService } from 'primeng/api';
import { UsuarioService } from '../../../core/services/Accesos/usuario.service';

// Operaciones (lógica separada)
import { UsuariosCrud, UsuariosUtils } from './operaciones';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    SelectModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    DialogModule,
    DividerModule,
    TooltipModule,
    PasswordModule,
    AvatarModule
  ],
  providers: [MessageService, UsuariosCrud, UsuariosUtils],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuariosComponent implements OnInit, OnDestroy {

  // ============================================================
  // VARIABLES DE BÚSQUEDA Y FILTROS
  // ============================================================
  
  /** Texto de búsqueda */
  busqueda = signal('');
  
  /** ID del rol seleccionado para filtrar */
  filtroRolId = signal<number | null>(null);

  // ============================================================
  // VARIABLES DEL FORMULARIO
  // ============================================================
  
  /** Controla la visibilidad del modal de usuario */
  usuarioDialog = signal(false);
  
  /** Datos del formulario de usuario */
  usuarioForm = signal<Partial<Usuario>>({});
  
  /** Indica si estamos editando (true) o creando (false) */
  esEdicion = signal(false);

  // ============================================================
  // VARIABLES DE DETALLE
  // ============================================================
  
  /** Controla la visibilidad del modal de detalle */
  detalleDialog = signal(false);
  
  /** Usuario seleccionado para ver detalles */
  usuarioDetalle = signal<Usuario | null>(null);
  
  /** Indica si está cargando los detalles */
  detalleLoading = signal(false);

  // ============================================================
  // VARIABLES DE DATOS
  // ============================================================
  
  /** Lista completa de usuarios */
  listaUsuarios = signal<Usuario[]>([]);
  
  /** Lista filtrada según búsqueda */
  listaFiltrada = signal<Usuario[]>([]);
  
  /** Lista de roles */
  listaRoles = signal<any[]>([]);

  // ============================================================
  // ESTADÍSTICAS
  // ============================================================
  
  totalUsuarios = signal(0);
  usuariosActivos = signal(0);
  usuariosInactivos = signal(0);
  administradoresCount = signal(0);

  // ============================================================
  // OPCIONES DE FILTRO
  // ============================================================
  
  opcionesFiltroRol = [
    { label: 'Todos', value: null },
    { label: 'Administrador', value: 1 },
    { label: 'Doctor', value: 2 },
    { label: 'Recepcionista', value: 3 },
    { label: 'Paciente', value: 4 },
    { label: 'Desarrollador', value: 5 }
  ];

  // ============================================================
  // SUSCRIPCIONES
  // ============================================================
  
  private destroy$ = new Subject<void>();

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  
  constructor(
    /** Servicio de operaciones CRUD (inyectado por Angular) */
    public crud: UsuariosCrud,
    
    /** Servicio de utilidades (inyectado por Angular) */
    public utils: UsuariosUtils,
    
    /** Servicio de usuarios para API */
    private usuarioService: UsuarioService,
    
    /** Detector de cambios */
    private cdr: ChangeDetectorRef
  ) {
    this.crud.setCdr(this.cdr);
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  
  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // MÉTODOS DE CARGA DE DATOS
  // ============================================================
  
  /**
   * Carga usuarios y roles desde el API.
   */
  private cargarDatos(): void {
    // Cargar usuarios
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

    // Cargar roles
    this.utils.roles$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles: any[]) => {
          this.listaRoles.set(roles);
        }
      });
  }

  // ============================================================
  // MÉTODOS DE FILTRADO
  // ============================================================
  
  /**
   * Aplica los filtros de búsqueda y rol.
   */
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

  /**
   * Calcula las estadísticas de usuarios.
   */
  private calcularEstadisticas(): void {
    const usuarios = this.listaUsuarios();
    this.totalUsuarios.set(usuarios.length);
    this.usuariosActivos.set(usuarios.filter((u: Usuario) => u.activo).length);
    this.usuariosInactivos.set(usuarios.filter((u: Usuario) => !u.activo).length);
    this.administradoresCount.set(usuarios.filter((u: Usuario) => u.rolId === 1).length);
  }

  /**
   * Manejador del evento de búsqueda.
   */
  onSearchChange(valor: string): void {
    this.busqueda.set(valor);
    this.aplicarFiltros();
  }

  /**
   * Manejador del evento de filtro por rol.
   */
  onRoleFilterChange(valor: number | null): void {
    this.filtroRolId.set(valor);
    this.aplicarFiltros();
  }

  // ============================================================
  // ACCIONES: Modal de Usuario (Crear/Editar)
  // ============================================================
  
  /**
   * Abre el modal para crear o editar un usuario.
   * @param usuario - Usuario a editar (null = crear nuevo)
   */
  abrirModalUsuario(usuario?: Usuario): void {
    this.esEdicion.set(!!usuario);
    
    if (usuario) {
      this.usuarioForm.set({ ...usuario, clave: '' });
    } else {
      this.usuarioForm.set({ activo: true });
    }
    
    this.usuarioDialog.set(true);
  }

  /**
   * Cierra el modal de usuario sin guardar.
   */
  cerrarModalUsuario(): void {
    this.usuarioDialog.set(false);
  }

  /**
   * Guarda el usuario (crea o actualiza).
   */
  guardarUsuario(): void {
    this.crud.guardar(this.usuarioForm(), this.esEdicion());
    this.usuarioDialog.set(false);
  }

  // ============================================================
  // ACCIONES: Toggle Estado
  // ============================================================
  
  /**
   * Activa o desactiva un usuario.
   */
  togglearEstado(usuario: Usuario): void {
    this.crud.toggleEstado(usuario);
  }

  // ============================================================
  // ACCIONES: Ver Detalle
  // ============================================================
  
  /**
   * Abre el modal de detalles del usuario.
   */
  async verDetalle(usuario: Usuario): Promise<void> {
    this.detalleLoading.set(true);
    this.detalleDialog.set(true);
    this.usuarioDetalle.set(null);

    const detalle = await this.crud.obtenerDetalle(usuario.usuarioId!);
    
    this.usuarioDetalle.set(detalle);
    this.detalleLoading.set(false);
    this.cdr.markForCheck();
  }

  /**
   * Cierra el modal de detalles.
   */
  cerrarDetalle(): void {
    this.detalleDialog.set(false);
    this.usuarioDetalle.set(null);
  }
}
