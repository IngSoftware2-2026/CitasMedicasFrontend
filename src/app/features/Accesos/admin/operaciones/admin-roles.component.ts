import { Component, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
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
import { Rol } from '../../../../core/models/Accesos/rol.model';
import { Permiso } from '../../../../core/models/Accesos/permiso.model';
import {
  AdminRolOperations,
  AdminPermisoOperations,
  AdminPermisoRolOperations,
  AdminUtils
} from './index';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, TagModule, CardModule, ToolbarModule, TooltipModule, AvatarModule, DividerModule, IconFieldModule, InputIconModule],
  providers: [MessageService, ConfirmationService, AdminRolOperations, AdminPermisoOperations, AdminPermisoRolOperations, AdminUtils],
  template: `
    <p-toolbar styleClass="mb-3">
      <ng-template #start><h3 class="m-0"><i class="pi pi-id-card"></i> Roles</h3></ng-template>
      <ng-template #end><p-button label="Nuevo Rol" icon="pi pi-plus" (onClick)="openRolDialog()" /></ng-template>
    </p-toolbar>

    <div class="admin-roles-grid">
      @for (r of roles; track r.rolId) {
      <p-card styleClass="admin-role-card">
        <div class="admin-role-header">
          <div class="admin-role-title">
            <p-avatar icon="pi pi-id-card" shape="circle" styleClass="role-avatar" />
            <div>
              <h4>{{ r.nombreRol || '' }}</h4>
              <p-tag [value]="r.codigoRol || ''" severity="info" />
            </div>
          </div>
          <div class="admin-role-actions">
            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" pTooltip="Editar" (onClick)="openRolDialog(r)" />
            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" pTooltip="Eliminar" (onClick)="deleteRol(r)" />
          </div>
        </div>
        <p-divider />
        <p class="admin-permisos-label" (click)="toggleExpand(r.rolId)" style="cursor: pointer;">
          <i class="pi" [class.pi-chevron-down]="!expandedRoles.has(r.rolId)" [class.pi-chevron-right]="expandedRoles.has(r.rolId)"></i> 
          Permisos asignados ({{ getPermisosCount(r.rolId) }})
        </p>
        <div class="admin-permisos-checkboxes" [class.hidden]="!expandedRoles.has(r.rolId)">
          @for (p of permisos; track p.permisoId) {
          <label class="admin-permiso-toggle" [class.admin-permiso-toggle--active]="rolTienePermiso(r.rolId, p.permisoId)">
            <input type="checkbox" [checked]="rolTienePermiso(r.rolId, p.permisoId)" (change)="togglePermisoRol(r.rolId, p.permisoId)" />
            <span>{{ p.nombrePermiso }}</span>
          </label>
          }
        </div>
      </p-card>
      }
    </div>

    <p-dialog header="{{ rolForm.rolId ? 'Editar' : 'Nuevo' }} Rol" [(visible)]="rolDialog" [modal]="true">
      <div class="admin-dialog-form">
        <div class="admin-dialog-form-row">
          <div class="admin-dialog-field"><label>Código *</label><input pInputText [(ngModel)]="rolForm.codigoRol" /></div>
          <div class="admin-dialog-field"><label>Nombre *</label><input pInputText [(ngModel)]="rolForm.nombreRol" /></div>
        </div>
      </div>
      <ng-template #footer>
        <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="rolDialog = false" />
        <p-button label="Guardar" icon="pi pi-check" (onClick)="saveRol()" />
      </ng-template>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
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

  get roles(): any[] { 
    return this.rolOps.roles ? [...this.rolOps.roles] : [];
  }

  get permisos() { return this.permisoOps.permisos; }

  getPermisosCount(rolId: number): number {
    return this.permisos.filter(p => this.permisoRolOps.tienePermiso(rolId, p.permisoId)).length;
  }

  rolTienePermiso(rid: number, pid: number) { return this.permisoRolOps.tienePermiso(rid, pid); }
  togglePermisoRol(rid: number, pid: number) { this.permisoRolOps.toggle(rid, pid); }
  
  toggleExpand(rolId: number) {
    if (this.expandedRoles.has(rolId)) {
      this.expandedRoles.delete(rolId);
    } else {
      this.expandedRoles.add(rolId);
    }
    this.cdr.markForCheck();
  }

  openRolDialog(r?: Rol) {
    this.rolForm = r ? { ...r } : {};
    this.rolDialog = true;
  }

  saveRol() {
    this.rolOps.save(this.rolForm, !!this.rolForm.rolId);
    this.rolDialog = false;
  }

  deleteRol(r: Rol) {
    this.confirmationService.confirm({
      message: `Eliminar el rol ${r.nombreRol}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.rolOps.delete(r, () => {})
    });
  }
}
