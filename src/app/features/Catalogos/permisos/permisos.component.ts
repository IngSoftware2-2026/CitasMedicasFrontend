import { Component, ChangeDetectorRef } from '@angular/core';
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
import { Permiso } from '../../../core/models/Accesos/permiso.model';
import { Rol } from '../../../core/models/Accesos/rol.model';
import {
  AdminPermisoOperations,
  AdminPermisoRolOperations,
  AdminUtils
} from '../../Accesos/admin/operaciones/index';

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, TagModule, ToolbarModule, TooltipModule, IconFieldModule, InputIconModule],
  providers: [MessageService, ConfirmationService, AdminPermisoOperations, AdminPermisoRolOperations, AdminUtils],
  styleUrls: ['./css/permisos.component.css'],
  template: `
    <div class="permisos-container">
      <div class="permisos-header">
        <div class="permisos-header-title">
          <div class="permisos-header-icon">
            <i class="pi pi-lock"></i>
          </div>
          <div>
            <h2>Catálogo de Permisos</h2>
            <p>Administra los permisos del sistema</p>
          </div>
        </div>
        <p-button label="Nuevo Permiso" icon="pi pi-plus" styleClass="p-button-rounded p-button-white" (onClick)="openPermisoDialog()" />
      </div>

      <div class="permisos-stats">
        <div class="permisos-stat-item">
          <div class="permisos-stat-icon permisos-stat-icon--primary"><i class="pi pi-lock"></i></div>
          <div class="permisos-stat-info"><span class="permisos-stat-number">{{ filteredPermisos.length }}</span><span class="permisos-stat-label">Total Permisos</span></div>
        </div>
        <div class="permisos-stat-item">
          <div class="permisos-stat-icon permisos-stat-icon--green"><i class="pi pi-link"></i></div>
          <div class="permisos-stat-info"><span class="permisos-stat-number">{{ countPermisosAsignados() }}</span><span class="permisos-stat-label">Con Roles Asignados</span></div>
        </div>
        <div class="permisos-stat-item">
          <div class="permisos-stat-icon permisos-stat-icon--amber"><i class="pi pi-exclamation-circle"></i></div>
          <div class="permisos-stat-info"><span class="permisos-stat-number">{{ countPermisosSinRol() }}</span><span class="permisos-stat-label">Sin Asignar</span></div>
        </div>
      </div>

      <div class="permisos-table-card">
        <p-table [value]="filteredPermisos" [paginator]="true" [rows]="10" dataKey="permisoId" [rowHover]="true" styleClass="p-datatable-sm">
          <ng-template #caption>
            <div class="permisos-table-caption">
              <p-iconfield class="permisos-search">
                <p-inputicon styleClass="pi pi-search" />
                <input pInputText [(ngModel)]="searchPermiso" placeholder="Buscar por código, nombre o descripción..." />
              </p-iconfield>
              <span class="permisos-table-count">{{ filteredPermisos.length }} permisos</span>
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
              <td><span class="permisos-row-number">{{ i + 1 }}</span></td>
              <td><p-tag [value]="p.codigoPermiso" severity="secondary" [rounded]="true" /></td>
              <td>
                <div class="permisos-person">
                  <span class="permisos-avatar"><i class="pi pi-lock"></i></span>
                  <span class="permisos-person-name">{{ p.nombrePermiso }}</span>
                </div>
              </td>
              <td><span class="permiso-description">{{ p.descripcion || '—' }}</span></td>
              <td>
                <div class="permiso-roles">
                  @for (r of roles; track r.rolId) {
                    @if (rolTienePermiso(r.rolId, p.permisoId)) {
                      <span [class]="'role-chip role-chip--' + getRolChipClass(r.codigoRol)">{{ r.nombreRol }}</span>
                    }
                  }
                  @if (countRolesDelPermiso(p.permisoId) === 0) {
                    <span class="permiso-no-roles">Sin asignar</span>
                  }
                </div>
              </td>
              <td>
                <div class="permisos-actions">
                  <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" size="small" pTooltip="Editar" tooltipPosition="top" (onClick)="openPermisoDialog(p)" />
                  <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" size="small" pTooltip="Eliminar" tooltipPosition="top" (onClick)="deletePermiso(p)" />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr><td colspan="6">
              <div class="permisos-empty"><i class="pi pi-lock"></i><p>No se encontraron permisos</p><span>Intenta con otros términos de búsqueda</span></div>
            </td></tr>
          </ng-template>
        </p-table>
      </div>

      <p-dialog
        [header]="(permisoForm.permisoId ? 'Editar' : 'Nuevo') + ' Permiso'"
        [(visible)]="permisoDialog"
        [modal]="true"
        [style]="{ width: '450px' }"
        [breakpoints]="{ '640px': '95vw' }"
        styleClass="permiso-dialog border-round-xl"
      >
        <div class="dialog-form">
          <div class="dialog-field">
            <label>Código <span class="required">*</span></label>
            <input pInputText [(ngModel)]="permisoForm.codigoPermiso" placeholder="Ej: PERMISO_ADMIN" />
          </div>
          <div class="dialog-field">
            <label>Nombre <span class="required">*</span></label>
            <input pInputText [(ngModel)]="permisoForm.nombrePermiso" placeholder="Ej: Acceso Total" />
          </div>
          <div class="dialog-field">
            <label>Descripción</label>
            <input pInputText [(ngModel)]="permisoForm.descripcion" placeholder="Descripción del permiso" />
          </div>
        </div>
        <ng-template #footer>
          <div class="dialog-actions">
            <p-button label="Cancelar" icon="pi pi-times" [text]="true" severity="secondary" (onClick)="permisoDialog = false" />
            <p-button label="Guardar" icon="pi pi-check" (onClick)="savePermiso()" />
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `
})
export class PermisosComponent {
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
    this.cdr.detectChanges();
  }

  savePermiso() {
    this.permisoOps.save(this.permisoForm, !!this.permisoForm.permisoId);
    this.permisoDialog = false;
    setTimeout(() => this.cdr.detectChanges(), 500);
  }

  deletePermiso(p: Permiso) {
    this.confirmationService.confirm({
      message: `Eliminar el permiso ${p.nombrePermiso}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.permisoOps.delete(p, () => {});
        this.cdr.detectChanges();
      }
    });
  }
}