/**
 * ============================================================
 * UTILS: Utilidades para formateo y datos de usuarios
 * ============================================================
 * Contiene funciones para formatear datos, obtener colores,
 * nombres de roles y otras ayudas visuales.
 */

import { Injectable, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

// Servicios
import { RolService } from '../../../../core/services/Accesos/rol.service';

// Modelos
import { Usuario } from '../../../../core/models/Accesos/usuario.model';
import { Rol } from '../../../../core/models/Accesos/rol.model';

@Injectable()
export class UsuariosUtils {

  // ============================================================
  // DEPENDENCIAS INYECTADAS
  // ============================================================
  
  /** Servicio para obtener la lista de roles */
  private rolService = inject(RolService);

  // ============================================================
  // ESTADO INTERNO
  // ============================================================
  
  /** Subject para limpiar suscripciones */
  private destroy$ = new Subject<void>();
  
  /** BehaviorSubject con la lista de roles */
  private rolesSubject = new Subject<Rol[]>();
  
  /** Lista local de roles */
  listaRoles: Rol[] = [];

  // ============================================================
  // PROPIEDADES PÚBLICAS
  // ============================================================
  
  /** Observable de roles para suscribirse */
  roles$ = this.rolesSubject.asObservable();
  
  /** Getter de roles para compatibilidad */
  get roles(): Rol[] {
    return this.listaRoles;
  }

  // ============================================================
  // MAPAS DE DATOS (para no depender solo de la BD)
  // ============================================================
  
  /** Colores para avatares según rol */
  private readonly COLORES_AVATAR: Record<string, string> = {
    'ADMIN': 'purple',
    'DOCTOR': 'green',
    'RECEP': 'blue',
    'PACIENTE': 'teal',
    'DEV': 'gray'
  };

  /** Clases CSS para badges de roles */
  private readonly CLASES_BADGE: Record<string, string> = {
    'ADMIN': 'badge-admin',
    'DOCTOR': 'badge-doctor',
    'RECEP': 'badge-recep',
    'PACIENTE': 'badge-paciente',
    'DEV': 'badge-dev'
  };

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  
  constructor() {
    this.cargarRoles();
  }

  // ============================================================
  // MÉTODOS PÚBLICOS - ROLES
  // ============================================================
  
  /**
   * Obtiene el nombre del rol por su ID.
   */
  obtenerNombreRol(rolId: number): string {
    const rol = this.roles.find(r => r.rolId === rolId);
    return rol?.nombreRol ?? 'Sin rol';
  }

  /**
   * Obtiene el código del rol por su ID.
   */
  obtenerCodigoRol(rolId: number): string {
    const rol = this.roles.find(r => r.rolId === rolId);
    return rol?.codigoRol ?? '';
  }

  // ============================================================
  // MÉTODOS PÚBLICOS - FORMATEO
  // ============================================================
  
  /**
   * Obtiene las iniciales de un nombre.
   * Ejemplo: "Juan Pérez" -> "JP"
   */
  obtenerIniciales(nombre?: string): string {
    if (!nombre) return '??';
    
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) {
      return partes[0].substring(0, 2).toUpperCase();
    }
    
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  /**
   * Obtiene el color del avatar según el rol.
   */
  obtenerColorAvatar(rolId: number, nombreUsuario?: string): string {
    const codigo = this.obtenerCodigoRol(rolId);
    
    // Si el nombre contiene palabras clave, usar ese color
    if (nombreUsuario) {
      const nombre = nombreUsuario.toLowerCase();
      if (nombre.includes('doctor')) return 'purple-dark';
      if (nombre.includes('admin')) return 'purple';
      if (nombre.includes('recepcion')) return 'blue';
      if (nombre.includes('paciente')) return 'blue-dark';
      if (nombre.includes('dev')) return 'gray';
    }
    
    return this.COLORES_AVATAR[codigo] || 'indigo';
  }

  /**
   * Obtiene la clase CSS del badge según el rol.
   */
  obtenerClaseBadgeRol(rolId: number): string {
    const codigo = this.obtenerCodigoRol(rolId);
    return this.CLASES_BADGE[codigo] || 'badge-default';
  }

  /**
   * Obtiene la severidad (color) del rol para PrimeNG.
   */
  obtenerSeveridadRol(rolId: number): 'danger' | 'info' | 'warn' | 'success' | 'secondary' {
    const codigo = this.obtenerCodigoRol(rolId);
    switch (codigo) {
      case 'ADMIN': return 'danger';
      case 'DOCTOR': return 'info';
      case 'RECEP': return 'warn';
      case 'PACIENTE': return 'success';
      default: return 'secondary';
    }
  }

  // ============================================================
  // MÉTODOS PÚBLICOS - ESTADÍSTICAS
  // ============================================================
  
  /**
   * Cuenta usuarios activos.
   */
  contarActivos(usuarios: Usuario[]): number {
    return usuarios.filter(u => u.activo).length;
  }

  /**
   * Cuenta usuarios inactivos.
   */
  contarInactivos(usuarios: Usuario[]): number {
    return usuarios.filter(u => !u.activo).length;
  }

  /**
   * Cuenta usuarios por rol.
   */
  contarPorRol(usuarios: Usuario[], rolId: number): number {
    return usuarios.filter(u => u.rolId === rolId).length;
  }

  /**
   * Filtra usuarios por término de búsqueda.
   */
  filtrarUsuarios(termino: string, usuarios: Usuario[]): Usuario[] {
    if (!termino.trim()) return usuarios;
    
    const t = termino.toLowerCase();
    return usuarios.filter(u =>
      u.nombreUsuario?.toLowerCase().includes(t) ||
      u.correo?.toLowerCase().includes(t) ||
      this.obtenerNombreRol(u.rolId).toLowerCase().includes(t)
    );
  }

  // ============================================================
  // MÉTODOS PRIVADOS
  // ============================================================
  
  /**
   * Carga la lista de roles desde el API.
   */
  private cargarRoles(): void {
    this.rolService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles: Rol[]) => {
          this.listaRoles = roles;
          this.rolesSubject.next(roles);
        },
        error: (error: any) => {
          console.error('Error al cargar roles:', error);
          this.listaRoles = [];
          this.rolesSubject.next([]);
        }
      });
  }
}
