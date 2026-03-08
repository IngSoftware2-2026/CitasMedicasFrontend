import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { Rol } from '../../core/models/Accesos/rol.model';
import { Permiso } from '../../core/models/Accesos/permiso.model';
import { MessageService, ConfirmationService } from 'primeng/api';
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

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, TagModule, CardModule, ToolbarModule, TooltipModule, AvatarModule, DividerModule, IconFieldModule, InputIconModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  rolDialog = false;
  permisoDialog = false;
  rolForm: Partial<Rol> = {};
  permisoForm: Partial<Permiso> = {};
  searchPermiso = '';

  get roles() { return this.data.roles; }
  get permisos() { return this.data.permisos; }
  get rolPermisos() { return this.data.rolPermisos; }

  constructor(
    private data: MockDataService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  get filteredPermisos() {
    const term = this.searchPermiso.toLowerCase();
    if (!term) return this.permisos;
    return this.permisos.filter(p =>
      p.codigoPermiso.toLowerCase().includes(term) ||
      p.nombrePermiso.toLowerCase().includes(term) ||
      (p.descripcion ?? '').toLowerCase().includes(term)
    );
  }

  countPermisosAsignados(): number {
    return this.permisos.filter(p => this.rolPermisos.some(rp => rp.permisoId === p.permisoId)).length;
  }

  countPermisosSinRol(): number {
    return this.permisos.filter(p => !this.rolPermisos.some(rp => rp.permisoId === p.permisoId)).length;
  }

  countRolesDelPermiso(permisoId: number): number {
    return this.rolPermisos.filter(rp => rp.permisoId === permisoId).length;
  }

  getRolChipClass(codigoRol: string): string {
    switch (codigoRol) {
      case 'ADMIN': return '--admin';
      case 'DOCTOR': return '--doctor';
      case 'RECEP': return '--recep';
      case 'PACIENTE': return '--paciente';
      default: return '';
    }
  }

  getPermisosDeRol(rolId: number): string[] {
    const permisoIds = this.rolPermisos.filter(rp => rp.rolId === rolId).map(rp => rp.permisoId);
    return this.permisos.filter(p => permisoIds.includes(p.permisoId)).map(p => p.nombrePermiso);
  }

  getPermisoNombre(permisoId: number): string {
    return this.permisos.find(p => p.permisoId === permisoId)?.nombrePermiso ?? '';
  }

  rolTienePermiso(rolId: number, permisoId: number): boolean {
    return this.rolPermisos.some(rp => rp.rolId === rolId && rp.permisoId === permisoId);
  }

  togglePermisoRol(rolId: number, permisoId: number): void {
    const idx = this.rolPermisos.findIndex(rp => rp.rolId === rolId && rp.permisoId === permisoId);
    if (idx >= 0) {
      this.rolPermisos.splice(idx, 1);
      this.messageService.add({ severity: 'info', summary: 'Permiso removido', detail: `${this.getPermisoNombre(permisoId)} removido del rol` });
    } else {
      this.rolPermisos.push({ rolId, permisoId });
      this.messageService.add({ severity: 'success', summary: 'Permiso asignado', detail: `${this.getPermisoNombre(permisoId)} asignado al rol` });
    }
  }

  openRolDialog(r?: Rol): void {
    this.rolForm = r ? { ...r } : {};
    this.rolDialog = true;
  }

  saveRol(): void {
    if (!this.rolForm.codigoRol || !this.rolForm.nombreRol) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Codigo y nombre son obligatorios' });
      return;
    }
    if (this.rolForm.rolId) {
      const idx = this.roles.findIndex(r => r.rolId === this.rolForm.rolId);
      if (idx >= 0) {
        this.roles[idx] = { ...this.roles[idx], ...this.rolForm } as Rol;
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Rol actualizado' });
      }
    } else {
      this.roles.push({
        rolId: this.data.nextId('rol'),
        codigoRol: this.rolForm.codigoRol,
        nombreRol: this.rolForm.nombreRol
      });
      this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Rol creado' });
    }
    this.rolDialog = false;
  }

  deleteRol(r: Rol): void {
    this.confirmationService.confirm({
      message: `Eliminar el rol ${r.nombreRol}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const idx = this.roles.indexOf(r);
        if (idx >= 0) this.roles.splice(idx, 1);
        for (let i = this.rolPermisos.length - 1; i >= 0; i--) {
          if (this.rolPermisos[i].rolId === r.rolId) this.rolPermisos.splice(i, 1);
        }
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Rol eliminado' });
      }
    });
  }

  openPermisoDialog(p?: Permiso): void {
    this.permisoForm = p ? { ...p } : {};
    this.permisoDialog = true;
  }

  savePermiso(): void {
    if (!this.permisoForm.codigoPermiso || !this.permisoForm.nombrePermiso) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Codigo y nombre son obligatorios' });
      return;
    }
    if (this.permisoForm.permisoId) {
      const idx = this.permisos.findIndex(p => p.permisoId === this.permisoForm.permisoId);
      if (idx >= 0) {
        this.permisos[idx] = { ...this.permisos[idx], ...this.permisoForm } as Permiso;
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Permiso actualizado' });
      }
    } else {
      this.permisos.push({
        permisoId: this.data.nextId('permiso'),
        codigoPermiso: this.permisoForm.codigoPermiso,
        nombrePermiso: this.permisoForm.nombrePermiso,
        descripcion: this.permisoForm.descripcion
      });
      this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Permiso creado' });
    }
    this.permisoDialog = false;
  }

  deletePermiso(p: Permiso): void {
    this.confirmationService.confirm({
      message: `Eliminar el permiso ${p.nombrePermiso}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const idx = this.permisos.indexOf(p);
        if (idx >= 0) this.permisos.splice(idx, 1);
        for (let i = this.rolPermisos.length - 1; i >= 0; i--) {
          if (this.rolPermisos[i].permisoId === p.permisoId) this.rolPermisos.splice(i, 1);
        }
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Permiso eliminado' });
      }
    });
  }
}
