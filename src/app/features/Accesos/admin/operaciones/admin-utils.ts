import { Injectable, inject } from '@angular/core';
import { MockDataService } from '../../../../core/services/Clinica/mock-data.service';
import { Permiso } from '../../../../core/models/Accesos/permiso.model';
import { Rol } from '../../../../core/models/Accesos/rol.model';

@Injectable()
export class AdminUtils {
  private data = inject(MockDataService);

  get permisos() { return this.data.permisos; }
  get rolPermisos() { return this.data.rolPermisos; }
  get roles(): Rol[] { return this.data.roles; }

  getRoles(): Rol[] { return this.roles; }

  filterPermisos(term: string): Permiso[] {
    const t = term.toLowerCase();
    if (!t) return this.permisos;
    return this.permisos.filter(p =>
      p.codigoPermiso.toLowerCase().includes(t) ||
      p.nombrePermiso.toLowerCase().includes(t) ||
      (p.descripcion ?? '').toLowerCase().includes(t)
    );
  }

  countPermisosAsignados(): number {
    return this.permisos.filter(p => this.rolPermisos.some(rp => rp.permisoId === p.permisoId)).length;
  }

  countPermisosSinRol(): number {
    return this.permisos.filter(p => !this.rolPermisos.some(rp => rp.permisoId === p.permisoId)).length;
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
}
