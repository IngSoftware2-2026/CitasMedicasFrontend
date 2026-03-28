import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Permiso } from '../../../../core/models/Accesos/permiso.model';

@Injectable()
export class PermisosAdminService {
  private messageService = inject(MessageService);

  listaPermisos: Permiso[] = [];
  listaRolPermisos: { rolId: number; permisoId: number }[] = [];
  private nextPermisoId = 1000;

  guardarPermiso(permiso: Partial<Permiso>, esEdicion: boolean): void {
    if (!permiso.codigoPermiso || !permiso.nombrePermiso) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Código y nombre son obligatorios' });
      return;
    }
    
    if (esEdicion && permiso.permisoId) {
      this.actualizarPermiso(permiso);
    } else {
      this.crearPermiso(permiso);
    }
  }

  private crearPermiso(permiso: Partial<Permiso>): void {
    this.listaPermisos.push({
      permisoId: ++this.nextPermisoId,
      codigoPermiso: permiso.codigoPermiso!,
      nombrePermiso: permiso.nombrePermiso!,
      descripcion: permiso.descripcion
    });
    this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Permiso creado exitosamente' });
  }

  private actualizarPermiso(permiso: Partial<Permiso>): void {
    const indice = this.listaPermisos.findIndex(p => p.permisoId === permiso.permisoId);
    if (indice >= 0) {
      this.listaPermisos[indice] = { ...this.listaPermisos[indice], ...permiso } as Permiso;
      this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Permiso actualizado exitosamente' });
    }
  }

  eliminarPermiso(permiso: Permiso, onConfirm: () => void): void {
    const indice = this.listaPermisos.indexOf(permiso);
    if (indice >= 0) {
      this.listaPermisos.splice(indice, 1);
    }
    
    for (let i = this.listaRolPermisos.length - 1; i >= 0; i--) {
      if (this.listaRolPermisos[i].permisoId === permiso.permisoId) {
        this.listaRolPermisos.splice(i, 1);
      }
    }
    
    this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Permiso eliminado exitosamente' });
    onConfirm();
  }
}
