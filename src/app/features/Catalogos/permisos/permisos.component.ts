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
  templateUrl: './permisos.component.html',
  styleUrls: ['./css/permisos.component.css']
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