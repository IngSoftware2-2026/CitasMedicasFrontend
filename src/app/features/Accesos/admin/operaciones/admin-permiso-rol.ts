import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { MockDataService } from '../../../../core/services/Clinica/mock-data.service';
import { Permiso } from '../../../../core/models/Accesos/permiso.model';

interface RolPermisoAsignacion { rolId: number; permisoId: number }

@Injectable()
export class PermisosRolAdminService {
  private mockDataService = inject(MockDataService);
  private messageService = inject(MessageService);

  get listaRolPermisos(): RolPermisoAsignacion[] { 
    return this.mockDataService.rolPermisos; 
  }
  
  get listaPermisos(): Permiso[] { 
    return this.mockDataService.permisos; 
  }

  obtenerNombrePermiso(idPermiso: number): string {
    return this.listaPermisos.find(p => p.permisoId === idPermiso)?.nombrePermiso ?? '';
  }

  alternarPermisoAsignado(idRol: number, idPermiso: number): void {
    const indice = this.listaRolPermisos.findIndex(
      rp => rp.rolId === idRol && rp.permisoId === idPermiso
    );
    
    if (indice >= 0) {
      this.listaRolPermisos.splice(indice, 1);
      this.messageService.add({ 
        severity: 'info', 
        summary: 'Permiso removido', 
        detail: `${this.obtenerNombrePermiso(idPermiso)} removido del rol` 
      });
    } else {
      this.listaRolPermisos.push({ rolId: idRol, permisoId: idPermiso });
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Permiso asignado', 
        detail: `${this.obtenerNombrePermiso(idPermiso)} asignado al rol` 
      });
    }
  }

  verificarPermisoAsignado(idRol: number, idPermiso: number): boolean {
    return this.listaRolPermisos.some(rp => rp.rolId === idRol && rp.permisoId === idPermiso);
  }

  obtenerPermisosDelRol(idRol: number): string[] {
    const idsPermisos = this.listaRolPermisos
      .filter(rp => rp.rolId === idRol)
      .map(rp => rp.permisoId);
    return this.listaPermisos
      .filter(p => idsPermisos.includes(p.permisoId))
      .map(p => p.nombrePermiso);
  }

  contarRolesConPermiso(idPermiso: number): number {
    return this.listaRolPermisos.filter(rp => rp.permisoId === idPermiso).length;
  }
}
