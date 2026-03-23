import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { MockDataService } from '../../../../core/services/Clinica/mock-data.service';
import { Permiso } from '../../../../core/models/Accesos/permiso.model';

@Injectable()
export class AdminPermisoOperations {
  private data = inject(MockDataService);
  private messageService = inject(MessageService);

  get permisos() { return this.data.permisos; }
  get rolPermisos() { return this.data.rolPermisos; }

  save(p: Partial<Permiso>, isEdit: boolean): void {
    if (!p.codigoPermiso || !p.nombrePermiso) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Codigo y nombre son obligatorios' });
      return;
    }
    if (isEdit) {
      const idx = this.permisos.findIndex(perm => perm.permisoId === p.permisoId);
      if (idx >= 0) {
        this.permisos[idx] = { ...this.permisos[idx], ...p } as Permiso;
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Permiso actualizado' });
      }
    } else {
      this.permisos.push({
        permisoId: this.data.nextId('permiso'),
        codigoPermiso: p.codigoPermiso,
        nombrePermiso: p.nombrePermiso,
        descripcion: p.descripcion
      });
      this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Permiso creado' });
    }
  }

  delete(p: Permiso, onConfirm: () => void): void {
    const idx = this.permisos.indexOf(p);
    if (idx >= 0) this.permisos.splice(idx, 1);
    for (let i = this.rolPermisos.length - 1; i >= 0; i--) {
      if (this.rolPermisos[i].permisoId === p.permisoId) this.rolPermisos.splice(i, 1);
    }
    this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Permiso eliminado' });
    onConfirm();
  }
}
