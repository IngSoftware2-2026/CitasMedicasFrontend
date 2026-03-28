import { Injectable } from '@angular/core';
import { Permiso } from '../../models/Accesos/permiso.model';
import { Rol } from '../../models/Accesos/rol.model';
import { Sala } from '../../models/Catalogos/sala.model';

/**
 * Servicio de datos mock usado por componentes de admin/catálogos
 * que aún no están conectados al backend real.
 * TODO: Migrar estos componentes a servicios reales y eliminar este archivo.
 */
@Injectable({ providedIn: 'root' })
export class MockDataService {
  permisos: Permiso[] = [];
  rolPermisos: { rolId: number; permisoId: number }[] = [];
  roles: Rol[] = [];
  salas: Sala[] = [];
  citas: any[] = [];
  solicitudes: any[] = [];
  estadosSolicitud: any[] = [];
  doctores: any[] = [];

  private counters: Record<string, number> = {};

  nextId(entity: string): number {
    if (!this.counters[entity]) this.counters[entity] = 1000;
    return ++this.counters[entity];
  }

  getPacienteNombre(_id: number): string { return '—'; }
  getDoctorNombre(_id: number): string { return '—'; }
  getEstadoSolicitudSeverity(_codigo: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | undefined {
    return 'secondary';
  }
}
