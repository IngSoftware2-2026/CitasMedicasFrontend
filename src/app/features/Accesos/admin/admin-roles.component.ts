import { Component, ChangeDetectorRef, Inject } from '@angular/core';
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
import {
  RolesAdminService,
  PermisosAdminService,
  PermisosRolAdminService,
  AdminUtils
} from './operaciones/index';
import { AuthService } from '../../../core/services/Accesos/auth/auth.service';
import { RolPermisosService } from '../../../core/services/Accesos/permisos/rol-permisos.service';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, TagModule, CardModule, ToolbarModule, TooltipModule, AvatarModule, DividerModule, IconFieldModule, InputIconModule],
  providers: [MessageService, RolesAdminService, PermisosAdminService, PermisosRolAdminService, AdminUtils],
  templateUrl: './admin-roles.component.html',
  styleUrl: './admin-roles.component.css'
})
export class AdminRolesComponent {
  mostrarDialogoRol = false;
  formularioRol: Partial<Rol> = {};
  rolesExpandidos = new Set<number>();

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
