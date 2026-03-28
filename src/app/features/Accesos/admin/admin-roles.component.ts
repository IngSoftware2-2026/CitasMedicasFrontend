import { Component, ChangeDetectorRef, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Rol } from '../../../core/models/Accesos/rol.model';
import { Permiso } from '../../../core/models/Accesos/permiso.model';
import { PERMISSIONS } from '../../../core/constants/permissions';
import {
  RolesAdminService,
  PermisosAdminService,
  PermisosRolAdminService,
  AdminUtils
} from './operaciones/index';
import { AuthService } from '../../../core/services/Accesos/auth/auth.service';
import { RolPermisosService } from '../../../core/services/Accesos/permisos/rol-permisos.service';

interface ModuloPermisos {
  nombre: string;
  icono: string;
  permisos: import('../../../core/models/Accesos/permiso.model').Permiso[];
}

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, TagModule, CardModule, ToolbarModule, TooltipModule, AvatarModule, DividerModule, IconFieldModule, InputIconModule],
  providers: [MessageService, RolesAdminService, PermisosAdminService, PermisosRolAdminService, AdminUtils],
  templateUrl: './admin-roles.component.html',
  styleUrl: './admin-roles.component.css'
})
export class AdminRolesComponent implements OnInit {
  mostrarDialogoRol = false;
  formularioRol: Partial<Rol> = {};
  rolesExpandidos = new Set<number>();
  modulosExpandidos = new Map<number, Set<string>>();

  private readonly nombresBonitos: Record<string, string> = {
    'GESTIONAR_USUARIOS': 'Gestionar Usuarios',
    'GESTIONAR_ROLES': 'Gestionar Roles',
    'VER_DASHBOARD': 'Ver Dashboard',
    'GESTIONAR_PACIENTES': 'Gestionar Pacientes',
    'GESTIONAR_DOCTORES': 'Gestionar Doctores',
    'GESTIONAR_CITAS': 'Gestionar Citas',
    'VER_CITAS': 'Ver Citas',
    'GESTIONAR_SOLICITUDES': 'Gestionar Solicitudes',
    'GESTIONAR_CATALOGOS': 'Gestionar Catálogos',
    'VER_CONSULTAS': 'Ver Consultas',
    'VER_PACIENTES': 'Ver Pacientes',
    'VER_DOCTORES': 'Ver Doctores',
    'VER_SOLICITUDES': 'Ver Solicitudes',
    'VER_ROLES': 'Ver Roles',
    'VER_USUARIOS': 'Ver Usuarios',
    'VER_CATALOGOS': 'Ver Catálogos',
    'GESTIONAR_CONSULTAS': 'Gestionar Consultas',
    'VER_HORARIOS': 'Ver Horarios',
    'GESTIONAR_HORARIOS': 'Gestionar Horarios',
    'VER_CONFIGURACIONES': 'Ver Configuraciones',
    'GESTIONAR_CONFIGURACIONES': 'Gestionar Configuraciones',
    'EDITAR_ROLES': 'Editar Roles',
    'ELIMINAR_ROLES': 'Eliminar Roles',
  };

  private readonly moduloIconos: Record<string, string> = {
    'DASHBOARD': 'pi pi-chart-bar',
    'USUARIOS': 'pi pi-users',
    'ROLES': 'pi pi-id-card',
    'PACIENTES': 'pi pi-heart',
    'DOCTORES': 'pi pi-user-plus',
    'CITAS': 'pi pi-calendar',
    'SOLICITUDES': 'pi pi-file-edit',
    'CATALOGOS': 'pi pi-book',
    'CONSULTAS': 'pi pi-clipboard',
    'HORARIOS': 'pi pi-clock',
    'CONFIGURACIONES': 'pi pi-cog',
  };

  private readonly moduloNombres: Record<string, string> = {
    'DASHBOARD': 'Dashboard',
    'USUARIOS': 'Usuarios',
    'ROLES': 'Roles',
    'PACIENTES': 'Pacientes',
    'DOCTORES': 'Doctores',
    'CITAS': 'Citas',
    'SOLICITUDES': 'Solicitudes',
    'CATALOGOS': 'Catálogos',
    'CONSULTAS': 'Consultas',
    'HORARIOS': 'Horarios',
    'CONFIGURACIONES': 'Configuraciones',
  };

  constructor(
    public rolesAdminService: RolesAdminService,
    @Inject(PermisosAdminService) public permisosAdminService: PermisosAdminService,
    @Inject(PermisosRolAdminService) public permisosRolAdminService: PermisosRolAdminService,
    public utilidades: AdminUtils,
    private servicioAuth: AuthService,
    private servicioPermisos: RolPermisosService,
    private servicioMensajes: MessageService,
    private servicioConfirmacion: ConfirmationService,
    private detectorCambios: ChangeDetectorRef
  ) {
    this.rolesAdminService.setChangeDetector(detectorCambios);
  }

  ngOnInit(): void {
    this.cargarPermisos();
    this.rolesAdminService.roles$.subscribe(roles => {
      this.cargarAsignaciones(roles);
      this.detectorCambios.detectChanges();
    });
  }

  private cargarPermisos(): void {
    const permisos: Permiso[] = Object.values(PERMISSIONS).map((codigo, i) => ({
      permisoId: i + 1,
      codigoPermiso: codigo,
      nombrePermiso: this.nombresBonitos[codigo] ?? codigo,
    }));
    this.permisosAdminService.listaPermisos = permisos;
    this.permisosRolAdminService.listaPermisos = permisos;
  }

  private cargarAsignaciones(roles: Rol[]): void {
    const asignaciones: { rolId: number; permisoId: number }[] = [];
    for (const rol of roles) {
      const codigoRol = rol.codigoRol?.toUpperCase();
      if (!codigoRol) continue;
      const permisosDelRol = this.obtenerPermisosHardcodeados(codigoRol);
      for (const codigoPermiso of permisosDelRol) {
        const permiso = this.permisosAdminService.listaPermisos.find(p => p.codigoPermiso === codigoPermiso);
        if (permiso) {
          asignaciones.push({ rolId: rol.rolId, permisoId: permiso.permisoId });
        }
      }
    }
    this.permisosRolAdminService.listaRolPermisos = asignaciones;
  }

  private obtenerPermisosHardcodeados(codigoRol: string): string[] {
    const mapa: Record<string, string[]> = {
      'ADMIN': Object.values(PERMISSIONS),
      'RECEP': [
        PERMISSIONS.VER_DASHBOARD, PERMISSIONS.GESTIONAR_PACIENTES,
        PERMISSIONS.GESTIONAR_SOLICITUDES, PERMISSIONS.GESTIONAR_CITAS,
        PERMISSIONS.VER_CITAS, PERMISSIONS.VER_CATALOGOS,
        PERMISSIONS.GESTIONAR_CATALOGOS, PERMISSIONS.VER_HORARIOS,
        PERMISSIONS.GESTIONAR_HORARIOS, PERMISSIONS.VER_CONFIGURACIONES,
      ],
      'DOCTOR': [
        PERMISSIONS.VER_DASHBOARD, PERMISSIONS.VER_PACIENTES,
        PERMISSIONS.VER_CITAS, PERMISSIONS.VER_CONSULTAS,
        PERMISSIONS.GESTIONAR_CONSULTAS, PERMISSIONS.VER_HORARIOS,
        PERMISSIONS.VER_CONFIGURACIONES,
      ],
      'PACIENTE': [
        PERMISSIONS.VER_DASHBOARD, PERMISSIONS.VER_DOCTORES,
        PERMISSIONS.VER_HORARIOS, PERMISSIONS.VER_CITAS,
        PERMISSIONS.GESTIONAR_SOLICITUDES, PERMISSIONS.VER_CONFIGURACIONES,
      ],
    };
    return mapa[codigoRol] ?? [];
  }

  get puedeEditar(): boolean {
    return this.servicioAuth.esAdmin;
  }

  get puedeEliminar(): boolean {
    return this.servicioAuth.esAdmin;
  }

  get listaRoles(): Rol[] { 
    return this.rolesAdminService.listaRoles ? [...this.rolesAdminService.listaRoles] : []; 
  }
  
  get listaPermisos() { 
    return this.permisosAdminService.listaPermisos; 
  }

  obtenerCantidadPermisos(idRol: number): number {
    return this.listaPermisos.filter(p => this.permisosRolAdminService.verificarPermisoAsignado(idRol, p.permisoId)).length;
  }

  obtenerModulosPermisos(): ModuloPermisos[] {
    const grupos = new Map<string, import('../../../core/models/Accesos/permiso.model').Permiso[]>();
    for (const permiso of this.listaPermisos) {
      const partes = permiso.codigoPermiso.split('_');
      const clave = partes.length > 1 ? partes.slice(1).join('_') : partes[0];
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave)!.push(permiso);
    }
    return Array.from(grupos.entries()).map(([clave, permisos]) => ({
      nombre: this.moduloNombres[clave] ?? clave,
      icono: this.moduloIconos[clave] ?? 'pi pi-circle',
      permisos,
    }));
  }

  obtenerCantidadPermisosModulo(idRol: number, permisos: import('../../../core/models/Accesos/permiso.model').Permiso[]): number {
    return permisos.filter(p => this.permisosRolAdminService.verificarPermisoAsignado(idRol, p.permisoId)).length;
  }

  alternarModulo(idRol: number, nombreModulo: string): void {
    if (!this.modulosExpandidos.has(idRol)) {
      this.modulosExpandidos.set(idRol, new Set());
    }
    const set = this.modulosExpandidos.get(idRol)!;
    if (set.has(nombreModulo)) {
      set.delete(nombreModulo);
    } else {
      set.add(nombreModulo);
    }
    this.detectorCambios.detectChanges();
  }

  esModuloExpandido(idRol: number, nombreModulo: string): boolean {
    return this.modulosExpandidos.get(idRol)?.has(nombreModulo) ?? false;
  }

  obtenerClaseAvatar(codigo: string | undefined): string {
    if (!codigo) return 'role-avatar--default';
    const codigoMayusculas = codigo.toUpperCase();
    if (codigoMayusculas.includes('ADMIN')) return 'role-avatar--admin';
    if (codigoMayusculas.includes('DOCTOR') || codigoMayusculas.includes('MEDICO')) return 'role-avatar--doctor';
    if (codigoMayusculas.includes('RECEP') || codigoMayusculas.includes('RECEPCION')) return 'role-avatar--recep';
    if (codigoMayusculas.includes('PACIENTE')) return 'role-avatar--paciente';
    if (codigoMayusculas.includes('DEV')) return 'role-avatar--developer';
    return 'role-avatar--default';
  }

  obtenerIconoRol(codigo: string | undefined): string {
    if (!codigo) return 'pi pi-user';
    const codigoMayusculas = codigo.toUpperCase();
    if (codigoMayusculas.includes('ADMIN')) return 'pi pi-shield';
    if (codigoMayusculas.includes('DOCTOR') || codigoMayusculas.includes('MEDICO')) return 'pi pi-user-plus';
    if (codigoMayusculas.includes('RECEP') || codigoMayusculas.includes('RECEPCION')) return 'pi pi-briefcase';
    if (codigoMayusculas.includes('PACIENTE')) return 'pi pi-heart';
    if (codigoMayusculas.includes('DEV')) return 'pi pi-code';
    return 'pi pi-user';
  }

  verificarPermisoAsignado(idRol: number, idPermiso: number): boolean { 
    return this.permisosRolAdminService.verificarPermisoAsignado(idRol, idPermiso); 
  }

  alternarPermisoRol(idRol: number, idPermiso: number): void {
    this.permisosRolAdminService.alternarPermisoAsignado(idRol, idPermiso);
    this.detectorCambios.detectChanges();
  }

  alternarExpandirRol(idRol: number): void {
    if (this.rolesExpandidos.has(idRol)) {
      this.rolesExpandidos.delete(idRol);
    } else {
      this.rolesExpandidos.add(idRol);
    }
    this.detectorCambios.detectChanges();
  }

  abrirDialogoRol(rol?: Rol): void {
    this.formularioRol = rol ? { ...rol } : {};
    this.mostrarDialogoRol = true;
    this.detectorCambios.detectChanges();
  }

  guardarRol(): void {
    this.rolesAdminService.guardarRol(this.formularioRol, !!this.formularioRol.rolId);
    this.mostrarDialogoRol = false;
    setTimeout(() => this.detectorCambios.detectChanges(), 500);
  }

  eliminarRol(rol: Rol): void {
    this.servicioConfirmacion.confirm({
      message: `¿Eliminar el rol ${rol.nombreRol}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.rolesAdminService.eliminarRol(rol, () => {}),
    });
  }
}
