import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { MockDataService } from '../../../../core/services/Clinica/mock-data.service';
import { Permiso } from '../../../../core/models/Accesos/permiso.model';

interface RolPermiso { rolId: number; permisoId: number }

@Injectable()
export class AdminPermisoRolOperations {
  private data = inject(MockDataService);
  private messageService = inject(MessageService);

  get rolPermisos(): RolPermiso[] { return this.data.rolPermisos; }
  get permisos(): Permiso[] { return this.data.permisos; }

  getPermisoNombre(permisoId: number): string {
    return this.permisos.find(p => p.permisoId === permisoId)?.nombrePermiso ?? '';
  }

  toggle(rolId: number, permisoId: number): void {
    const idx = this.rolPermisos.findIndex(rp => rp.rolId === rolId && rp.permisoId === permisoId);
    if (idx >= 0) {
      this.rolPermisos.splice(idx, 1);
      this.messageService.add({ severity: 'info', summary: 'Permiso removido', detail: `${this.getPermisoNombre(permisoId)} removido del rol` });
    } else {
      this.rolPermisos.push({ rolId, permisoId });
      this.messageService.add({ severity: 'success', summary: 'Permiso asignado', detail: `${this.getPermisoNombre(permisoId)} asignado al rol` });
    }
  }

  tienePermiso(rolId: number, permisoId: number): boolean {
    return this.rolPermisos.some(rp => rp.rolId === rolId && rp.permisoId === permisoId);
  }

  getPermisosDeRol(rolId: number): string[] {
    const permisoIds = this.rolPermisos.filter(rp => rp.rolId === rolId).map(rp => rp.permisoId);
    return this.permisos.filter(p => permisoIds.includes(p.permisoId)).map(p => p.nombrePermiso);
  }

  countRolesDelPermiso(permisoId: number): number {
    return this.rolPermisos.filter(rp => rp.permisoId === permisoId).length;
  }
}
