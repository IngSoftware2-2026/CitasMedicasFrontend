import { Component, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Permiso } from '../../../../core/models/Accesos/permiso.model';
import { Rol } from '../../../../core/models/Accesos/rol.model';
import {
  AdminPermisoOperations,
  AdminPermisoRolOperations,
  AdminUtils
} from './index';

@Component({
  selector: 'app-admin-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, TagModule, ToolbarModule, TooltipModule, IconFieldModule, InputIconModule],
  providers: [MessageService, ConfirmationService, AdminPermisoOperations, AdminPermisoRolOperations, AdminUtils],
  template: `
    <p-toolbar styleClass="mt-4 mb-3">
      <ng-template #start><h3 class="m-0"><i class="pi pi-lock"></i> Catálogo de Permisos</h3></ng-template>
      <ng-template #end><p-button label="Nuevo Permiso" icon="pi pi-plus" (onClick)="openPermisoDialog()" /></ng-template>
    </p-toolbar>

    <div class="admin-permisos-stats">
      <div class="admin-permisos-stat-item">
        <div class="admin-permisos-stat-icon admin-permisos-stat-icon--accent"><i class="pi pi-lock"></i></div>
        <div class="admin-permisos-stat-info"><span class="admin-permisos-stat-number">{{ filteredPermisos.length }}</span><span class="admin-permisos-stat-label">Total Permisos</span></div>
      </div>
      <div class="admin-permisos-stat-item">
        <div class="admin-permisos-stat-icon admin-permisos-stat-icon--green"><i class="pi pi-link"></i></div>
        <div class="admin-permisos-stat-info"><span class="admin-permisos-stat-number">{{ countPermisosAsignados() }}</span><span class="admin-permisos-stat-label">Con Roles Asignados</span></div>
      </div>
      <div class="admin-permisos-stat-item">
        <div class="admin-permisos-stat-icon admin-permisos-stat-icon--amber"><i class="pi pi-exclamation-circle"></i></div>
        <div class="admin-permisos-stat-info"><span class="admin-permisos-stat-number">{{ countPermisosSinRol() }}</span><span class="admin-permisos-stat-label">Sin Asignar</span></div>
      </div>
    </div>

    <div class="admin-permisos-table-card">
      <p-table [value]="filteredPermisos" [paginator]="true" [rows]="10" dataKey="permisoId" [rowHover]="true">
        <ng-template #caption>
          <div class="admin-permisos-table-caption">
            <p-iconfield class="admin-permisos-search">
              <p-inputicon styleClass="pi pi-search" />
              <input pInputText [(ngModel)]="searchPermiso" placeholder="Buscar por código, nombre o descripción..." />
            </p-iconfield>
            <span class="admin-permisos-table-count">{{ filteredPermisos.length }} permisos</span>
          </div>
        </ng-template>
        <ng-template #header>
          <tr>
            <th style="width: 3rem">#</th>
            <th>Código</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Roles Asignados</th>
            <th style="width: 8rem; text-align: center">Acciones</th>
          </tr>
        </ng-template>
        <ng-template #body let-p let-i="rowIndex">
          <tr>
            <td><span class="admin-permisos-row-number">{{ i + 1 }}</span></td>
            <td><p-tag [value]="p.codigoPermiso" severity="secondary" [rounded]="true" /></td>
            <td>
              <div class="admin-permisos-person">
                <span class="admin-permisos-avatar"><i class="pi pi-lock"></i></span>
                <span class="admin-permisos-person-name">{{ p.nombrePermiso }}</span>
              </div>
            </td>
            <td><span class="admin-permiso-description">{{ p.descripcion || '—' }}</span></td>
            <td>
              <div class="admin-permiso-roles">
                @for (r of roles; track r.rolId) {
                  @if (rolTienePermiso(r.rolId, p.permisoId)) {
                    <span [class]="'admin-role-chip admin-role-chip--' + getRolChipClass(r.codigoRol)">{{ r.nombreRol }}</span>
                  }
                }
                @if (countRolesDelPermiso(p.permisoId) === 0) {
                  <span class="admin-permiso-no-roles">Sin asignar</span>
                }
              </div>
            </td>
            <td>
              <div class="admin-permisos-actions">
                <button class="admin-permisos-action-btn admin-permisos-action-btn--edit" pTooltip="Editar" tooltipPosition="top" (click)="openPermisoDialog(p)"><i class="pi pi-pencil"></i></button>
                <button class="admin-permisos-action-btn admin-permisos-action-btn--danger" pTooltip="Eliminar" tooltipPosition="top" (click)="deletePermiso(p)"><i class="pi pi-trash"></i></button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr><td colspan="6">
            <div class="admin-permisos-empty"><i class="pi pi-lock"></i><p>No se encontraron permisos</p><span>Intenta con otros términos de búsqueda</span></div>
          </td></tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog header="{{ permisoForm.permisoId ? 'Editar' : 'Nuevo' }} Permiso" [(visible)]="permisoDialog" [modal]="true">
      <div class="admin-dialog-form">
        <div class="admin-dialog-form-row">
          <div class="admin-dialog-field"><label>Código *</label><input pInputText [(ngModel)]="permisoForm.codigoPermiso" /></div>
          <div class="admin-dialog-field"><label>Nombre *</label><input pInputText [(ngModel)]="permisoForm.nombrePermiso" /></div>
        </div>
        <div class="admin-dialog-field"><label>Descripción</label><input pInputText [(ngModel)]="permisoForm.descripcion" /></div>
      </div>
      <ng-template #footer>
        <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="permisoDialog = false" />
        <p-button label="Guardar" icon="pi pi-check" (onClick)="savePermiso()" />
      </ng-template>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPermisosComponent {
  permisoDialog = false;
  permisoForm: Partial<Permiso> = {};
  searchPermiso = '';

  constructor(
    public permisoOps: AdminPermisoOperations,
    public permisoRolOps: AdminPermisoRolOperations,
    public utils: AdminUtils,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  get filteredPermisos() {
    return this.utils.filterPermisos(this.searchPermiso);
  }

  get permisos() { return this.permisoOps.permisos; }
  get roles(): Rol[] { return this.utils.getRoles(); }

  countPermisosAsignados() { return this.utils.countPermisosAsignados(); }
  countPermisosSinRol() { return this.utils.countPermisosSinRol(); }
  countRolesDelPermiso(id: number) { return this.permisoRolOps.countRolesDelPermiso(id); }
  getRolChipClass(cod: string) { return this.utils.getRolChipClass(cod); }
  rolTienePermiso(rid: number, pid: number) { return this.permisoRolOps.tienePermiso(rid, pid); }

  openPermisoDialog(p?: Permiso) {
    this.permisoForm = p ? { ...p } : {};
    this.permisoDialog = true;
  }

  savePermiso() {
    this.permisoOps.save(this.permisoForm, !!this.permisoForm.permisoId);
    this.permisoDialog = false;
  }

  deletePermiso(p: Permiso) {
    this.confirmationService.confirm({
      message: `Eliminar el permiso ${p.nombrePermiso}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.permisoOps.delete(p, () => {})
    });
  }
}
