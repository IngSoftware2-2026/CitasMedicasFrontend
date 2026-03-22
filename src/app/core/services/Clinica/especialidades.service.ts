/**
 * Servicio para gestión del catálogo de especialidades.
 * Extiende ConexionService para comunicarse con el API de especialidades.
 */
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ConexionService } from '../Http/conexion.service';
import { Especialidad } from '../../models/Catalogos/especialidad.model';

@Injectable({ providedIn: 'root' })
export class EspecialidadesService extends ConexionService {

  /**
   * Obtiene la lista completa de especialidades del catálogo.
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
}
