/**
 * Servicio para gestión del catálogo de especialidades.
 * Extiende ConexionService para comunicarse con el API de especialidades.
 * Endpoints backend: EspecialidadesController (Listar, Insertar, Editar, Eliminar)
 */
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ConexionService } from '../Http/conexion.service';
import { Especialidad } from '../../models/Catalogos/especialidad.model';

@Injectable({ providedIn: 'root' })
export class EspecialidadesService extends ConexionService {

  /**
   * Obtiene la lista completa de especialidades del catálogo.
   * GET /Especialidades/Listar
   */
  listar(): Observable<Especialidad[]> {
    return this.obtener<Especialidad[]>('/Especialidades/Listar').pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        const datos = respuesta.datos ?? respuesta.data;
        if (exitoso && datos) return datos as Especialidad[];
        throw new Error(respuesta.mensaje || 'Error al listar especialidades');
      })
    );
  }

  /**
   * Crea una nueva especialidad en el catálogo.
   * POST /Especialidades/Insertar
   */
  insertar(especialidad: Partial<Especialidad>): Observable<any> {
    const payload = {
      especialidadId: 0,
      nombre: especialidad.nombre || '',
      activo: especialidad.activo ?? true
    };
    return this.crear<any>('/Especialidades/Insertar', payload).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        if (exitoso) return respuesta;
        throw new Error(respuesta.mensaje ?? respuesta.message ?? 'Error al crear especialidad');
      })
    );
  }

  /**
   * Actualiza una especialidad existente.
   * POST /Especialidades/Editar
   */
  editar(especialidad: Especialidad): Observable<any> {
    const payload = {
      especialidadId: especialidad.especialidadId,
      nombre: especialidad.nombre,
      activo: especialidad.activo
    };
    // El backend usa [HttpPost("Editar")]
    return this.crear<any>('/Especialidades/Editar', payload).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        if (exitoso) return respuesta;
        throw new Error(respuesta.mensaje ?? respuesta.message ?? 'Error al editar especialidad');
      })
    );
  }

  /**
   * Desactiva (elimina lógicamente) una especialidad.
   * DELETE /Especialidades/Eliminar?especialidadId=X
   */
  desactivar(especialidadId: number): Observable<any> {
    return this.eliminar<any>('/Especialidades/Eliminar', { especialidadId }).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        if (exitoso) return respuesta;
        throw new Error(respuesta.mensaje ?? respuesta.message ?? 'Error al eliminar especialidad');
      })
    );
  }
}
