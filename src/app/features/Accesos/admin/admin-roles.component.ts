import { Component, ChangeDetectorRef } from '@angular/core';
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
  AdminRolOperations,
  AdminPermisoOperations,
  AdminPermisoRolOperations,
  AdminUtils
} from './operaciones/index';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, TagModule, CardModule, ToolbarModule, TooltipModule, AvatarModule, DividerModule, IconFieldModule, InputIconModule],
  providers: [MessageService, AdminRolOperations, AdminPermisoOperations, AdminPermisoRolOperations, AdminUtils],
  styleUrls: ['./admin-roles.component.css'],
  template: `
    <div class="roles-container">
      <div class="roles-header">
        <div class="roles-header-title">
          <div class="roles-header-icon">
            <i class="pi pi-id-card"></i>
          </div>
          <div>
            <h2>Gestión de Roles</h2>
            <p>Administrar roles del sistema</p>
          </div>
        </div>
        <p-button label="Nuevo Rol" icon="pi pi-plus" styleClass="p-button-rounded p-button-white" (onClick)="openRolDialog()" />
      </div>

      <div class="roles-grid">
        @for (r of roles; track r.rolId) {
        <div class="role-card">
          <div class="role-card-header">
            <div class="role-info">
              <div class="role-avatar" [class]="getAvatarClass(r.codigoRol)">
                <i [class]="getRoleIcon(r.codigoRol)"></i>
              </div>
              <div class="role-details">
                <h3>{{ r.nombreRol || 'Sin nombre' }}</h3>
                <span class="role-code">{{ r.codigoRol || 'SIN CÓDIGO' }}</span>
              </div>
            </div>
            <div class="role-actions">
              <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" size="small" pTooltip="Editar rol" tooltipPosition="top" (onClick)="openRolDialog(r)" />
              <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" size="small" pTooltip="Eliminar rol" tooltipPosition="top" (onClick)="deleteRol(r)" />
            </div>
          </div>
          <div class="role-card-footer">
            <span class="role-id">ID: {{ r.rolId }}</span>
          </div>

          <div class="role-card-body">
            <div class="role-permisos-toggle" (click)="toggleExpand(r.rolId)">
              <div class="role-permisos-toggle-left">
                <i class="pi text-sm transition-transform transition-duration-200" [class.pi-chevron-right]="!expandedRoles.has(r.rolId)" [class.pi-chevron-down]="expandedRoles.has(r.rolId)" [class.expanded]="expandedRoles.has(r.rolId)"></i>
                <span>Permisos asignados</span>
              </div>
              <span class="role-permisos-count" [class.empty]="getPermisosCount(r.rolId) === 0">
                {{ getPermisosCount(r.rolId) }}
              </span>
            </div>

            @if (expandedRoles.has(r.rolId)) {
            <div class="role-permisos-list">
              @for (p of permisos; track p.permisoId) {
              <label class="permiso-item" [class.active]="rolTienePermiso(r.rolId, p.permisoId)">
                <input type="checkbox" [checked]="rolTienePermiso(r.rolId, p.permisoId)" (change)="togglePermisoRol(r.rolId, p.permisoId)" />
                <i class="pi pi-shield"></i>
                <span>{{ p.nombrePermiso }}</span>
              </label>
              }
            </div>
            }
          </div>
        </div>
        } @empty {
        <div class="role-card-empty">
          <i class="pi pi-inbox"></i>
          <p>No hay roles disponibles</p>
        </div>
        }
      </div>

      <p-dialog
        [header]="(rolForm.rolId ? 'Editar' : 'Nuevo') + ' Rol'"
        [(visible)]="rolDialog"
        [modal]="true"
        [style]="{ width: '450px' }"
        [breakpoints]="{ '640px': '95vw' }"
        styleClass="role-dialog border-round-xl"
      >
        <div class="dialog-form">
          <div class="dialog-field">
            <label>Código <span class="required">*</span></label>
            <input pInputText [(ngModel)]="rolForm.codigoRol" placeholder="Ej: ROL_ADMIN" />
          </div>
          <div class="dialog-field">
            <label>Nombre <span class="required">*</span></label>
            <input pInputText [(ngModel)]="rolForm.nombreRol" placeholder="Ej: Administrador" />
          </div>
        </div>
        <ng-template #footer>
          <div class="dialog-actions">
            <p-button label="Cancelar" icon="pi pi-times" [text]="true" severity="secondary" (onClick)="rolDialog = false" />
            <p-button label="Guardar" icon="pi pi-check" (onClick)="saveRol()" />
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `
})
export class AdminRolesComponent {
  rolDialog = false;
  rolForm: Partial<Rol> = {};
  expandedRoles = new Set<number>();

  constructor(
    public rolOps: AdminRolOperations,
    public permisoOps: AdminPermisoOperations,
    public permisoRolOps: AdminPermisoRolOperations,
    public utils: AdminUtils,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {
    this.rolOps.setCdr(cdr);
  }

  get roles(): any[] { return this.rolOps.roles ? [...this.rolOps.roles] : []; }
  get permisos() { return this.permisoOps.permisos; }

  getPermisosCount(rolId: number): number {
    return this.permisos.filter(p => this.permisoRolOps.tienePermiso(rolId, p.permisoId)).length;
  }

  getAvatarClass(codigo: string | undefined): string {
    if (!codigo) return 'role-avatar--default';
    const c = codigo.toUpperCase();
    if (c.includes('ADMIN')) return 'role-avatar--admin';
    if (c.includes('DOCTOR') || c.includes('MEDICO')) return 'role-avatar--doctor';
    if (c.includes('RECEP') || c.includes('RECEPCION')) return 'role-avatar--recep';
    if (c.includes('PACIENTE')) return 'role-avatar--paciente';
    if (c.includes('DEV')) return 'role-avatar--developer';
    return 'role-avatar--default';
  }

  getRoleIcon(codigo: string | undefined): string {
    if (!codigo) return 'pi pi-user';
    const c = codigo.toUpperCase();
    if (c.includes('ADMIN')) return 'pi pi-shield';
    if (c.includes('DOCTOR') || c.includes('MEDICO')) return 'pi pi-user-plus';
    if (c.includes('RECEP') || c.includes('RECEPCION')) return 'pi pi-briefcase';
    if (c.includes('PACIENTE')) return 'pi pi-heart';
    if (c.includes('DEV')) return 'pi pi-code';
    return 'pi pi-user';
  }

  rolTienePermiso(rid: number, pid: number) { return this.permisoRolOps.tienePermiso(rid, pid); }

  togglePermisoRol(rid: number, pid: number) {
    this.permisoRolOps.toggle(rid, pid);
    this.cdr.detectChanges();
  }

  toggleExpand(rolId: number) {
    if (this.expandedRoles.has(rolId)) {
      this.expandedRoles.delete(rolId);
    } else {
      this.expandedRoles.add(rolId);
    }
    this.cdr.detectChanges();
  }

  openRolDialog(r?: Rol) {
    this.rolForm = r ? { ...r } : {};
    this.rolDialog = true;
    this.cdr.detectChanges();
  }

  saveRol() {
    this.rolOps.save(this.rolForm, !!this.rolForm.rolId);
    this.rolDialog = false;
    setTimeout(() => this.cdr.detectChanges(), 500);
  }

  deleteRol(r: Rol) {
    this.confirmationService.confirm({
      message: `Eliminar el rol ${r.nombreRol}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.rolOps.delete(r, () => {}),
    });
  }
}