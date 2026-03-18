/**
 * ============================================================
 * COMPONENTE: Gestión de Usuarios
 * ============================================================
 * Muestra una tabla con todos los usuarios del sistema.
 * Permite buscar, filtrar, crear, editar, ver detalles y cambiar estado.
 */

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit, OnDestroy {

  // ============================================================
  // VARIABLES DE BÚSQUEDA Y FILTROS
  // ============================================================
  
  /** Texto de búsqueda */
  busqueda: string = '';
  
  /** ID del rol seleccionado para filtrar */
  filtroRolId: number | null = null;

  // ============================================================
  // VARIABLES DEL FORMULARIO
  // ============================================================
  
  /** Controla la visibilidad del modal de usuario */
  usuarioDialog: boolean = false;
  
  /** Datos del formulario de usuario */
  usuarioForm: Partial<Usuario> = {};
  
  /** Indica si estamos editando (true) o creando (false) */
  esEdicion: boolean = false;

  // ============================================================
  // VARIABLES DE DETALLE
  // ============================================================
  
  /** Controla la visibilidad del modal de detalle */
  detalleDialog: boolean = false;
  
  /** Usuario seleccionado para ver detalles */
  usuarioDetalle: Usuario | null = null;
  
  /** Indica si está cargando los detalles */
  detalleLoading: boolean = false;

  // ============================================================
  // VARIABLES DE DATOS
  // ============================================================
  
  /** Lista completa de usuarios */
  listaUsuarios: Usuario[] = [];
  
  /** Lista filtrada según búsqueda */
  listaFiltrada: Usuario[] = [];
  
  /** Lista de roles */
  listaRoles: any[] = [];

  // ============================================================
  // ESTADÍSTICAS
  // ============================================================
  
  totalUsuarios: number = 0;
  usuariosActivos: number = 0;
  usuariosInactivos: number = 0;
  administradoresCount: number = 0;

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
        next: (usuarios) => {
          this.listaUsuarios = usuarios;
          this.aplicarFiltros();
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
        }
      });

    // Cargar roles
    this.utils.roles$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.listaRoles = roles;
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
    let resultado = [...this.listaUsuarios];

    if (this.busqueda.trim()) {
      const termino = this.busqueda.toLowerCase();
      resultado = resultado.filter(usuario => 
        usuario.nombreUsuario?.toLowerCase().includes(termino) ||
        usuario.correo?.toLowerCase().includes(termino)
      );
    }

    if (this.filtroRolId !== null) {
      resultado = resultado.filter(usuario => usuario.rolId === this.filtroRolId);
    }

    this.listaFiltrada = resultado;
    this.calcularEstadisticas();
    this.cdr.detectChanges();
  }

  /**
   * Calcula las estadísticas de usuarios.
   */
  private calcularEstadisticas(): void {
    this.totalUsuarios = this.listaUsuarios.length;
    this.usuariosActivos = this.listaUsuarios.filter(u => u.activo).length;
    this.usuariosInactivos = this.listaUsuarios.filter(u => !u.activo).length;
    this.administradoresCount = this.listaUsuarios.filter(u => u.rolId === 1).length;
  }

  /**
   * Manejador del evento de búsqueda.
   */
  onSearchChange(valor: string): void {
    this.busqueda = valor;
    this.aplicarFiltros();
  }

  /**
   * Manejador del evento de filtro por rol.
   */
  onRoleFilterChange(valor: number | null): void {
    this.filtroRolId = valor;
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
    this.esEdicion = !!usuario;
    
    if (usuario) {
      this.usuarioForm = { ...usuario, clave: '' };
    } else {
      this.usuarioForm = { activo: true };
    }
    
    this.usuarioDialog = true;
  }

  /**
   * Cierra el modal de usuario sin guardar.
   */
  cerrarModalUsuario(): void {
    this.usuarioDialog = false;
  }

  /**
   * Guarda el usuario (crea o actualiza).
   */
  guardarUsuario(): void {
    this.crud.guardar(this.usuarioForm, this.esEdicion);
    this.usuarioDialog = false;
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
    this.detalleLoading = true;
    this.detalleDialog = true;
    this.usuarioDetalle = null;

    const detalle = await this.crud.obtenerDetalle(usuario.usuarioId!);
    
    this.usuarioDetalle = detalle;
    this.detalleLoading = false;
  }

  /**
   * Cierra el modal de detalles.
   */
  cerrarDetalle(): void {
    this.detalleDialog = false;
    this.usuarioDetalle = null;
  }
}
