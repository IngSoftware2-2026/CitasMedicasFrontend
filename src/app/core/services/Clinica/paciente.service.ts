import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ConexionService } from '../Http/conexion.service';
import { Paciente } from '../../models/Clinica/Pacientes/paciente.model';

@Injectable({ providedIn: 'root' })
export class PacienteService extends ConexionService {

  listar(): Observable<Paciente[]> {
    return this.obtener<Paciente[]>('/Pacientes/Listar').pipe(
      map((respuesta: any) => {
        if (!respuesta) return [];
        if (Array.isArray(respuesta)) return respuesta as Paciente[];
        const exitoso = respuesta.success ?? respuesta.exitoso;
        const datos = respuesta.data ?? respuesta.datos;
        if (exitoso && Array.isArray(datos)) return datos as Paciente[];
        if (respuesta.message || respuesta.mensaje) throw new Error(respuesta.message || respuesta.mensaje);
        return [];
      })
    );
  }

  obtenerPorId(pacienteId: number): Observable<Paciente | null> {
    return this.obtener<Paciente>('/Pacientes/ObtenerPorId', { pacienteId }).pipe(
      map((respuesta: any) => {
        if (!respuesta) return null;
        if (!respuesta.success && !respuesta.exitoso) return null;
        const datos = respuesta.data ?? respuesta.datos;
        if (datos) return datos as Paciente;
        return null;
      })
    );
  }

  obtenerPerfilActual(): Observable<Paciente | null> {
    return this.obtener<Paciente>('/Pacientes/PerfilActual').pipe(
      tap({
        next: (respuesta: any) => console.log('[PerfilActual] response', respuesta),
        error: (error) => console.error('[PerfilActual] error', {
          status: error?.status,
          message: error?.message,
          body: error?.error
        })
      }),
      map((respuesta: any) => {
        if (!respuesta) return null;
        const exitoso = respuesta.success ?? respuesta.exitoso;
        const datos = respuesta.data ?? respuesta.datos;
        if (exitoso && datos) return datos as Paciente;
        return null;
      })
    );
  }

  insertar(paciente: Partial<Paciente>): Observable<Paciente> {
    return this.crear<Paciente>('/Pacientes/Insertar', paciente).pipe(
      map((respuesta: any) => {
        if (!respuesta) return paciente as Paciente;
        const exitoso = respuesta.success ?? respuesta.exitoso;
        if (exitoso) return paciente as Paciente;
        const msg = respuesta.message || respuesta.mensaje;
        if (msg) throw new Error(msg);
        return paciente as Paciente;
      })
    );
  }

  editar(paciente: Partial<Paciente>): Observable<Paciente> {
    return this.crear<Paciente>('/Pacientes/Editar', paciente).pipe(
      map((respuesta: any) => {
        if (!respuesta) return paciente as Paciente;
        const exitoso = respuesta.success ?? respuesta.exitoso;
        if (exitoso) return paciente as Paciente;
        const msg = respuesta.message || respuesta.mensaje;
        if (msg) throw new Error(msg);
        return paciente as Paciente;
      })
    );
  }

  completarPerfil(paciente: Partial<Paciente>): Observable<Paciente> {
    return this.crear<Paciente>('/Pacientes/CompletarPerfil', paciente).pipe(
      map((respuesta: any) => {
        if (!respuesta) return paciente as Paciente;
        const exitoso = respuesta.success ?? respuesta.exitoso;
        if (exitoso) return paciente as Paciente;
        const msg = respuesta.message || respuesta.mensaje;
        if (msg) throw new Error(msg);
        return paciente as Paciente;
      })
    );
  }

  eliminarpaciente(pacienteId: number): Observable<boolean> {
    return this.eliminar<any>('/Pacientes/Eliminar', { pacienteId }).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.success ?? respuesta.exitoso;
        if (exitoso) return true;
        throw new Error(respuesta.message || respuesta.mensaje || 'Error al eliminar paciente');
      })
    );
  }
}
