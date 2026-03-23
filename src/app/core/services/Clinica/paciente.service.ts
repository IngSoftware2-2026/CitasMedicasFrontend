import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ConexionService } from '../Http/conexion.service';
import { Paciente } from '../../models/Clinica/Pacientes/paciente.model';

@Injectable({ providedIn: 'root' })
export class PacienteService extends ConexionService {

  listar(): Observable<Paciente[]> {
    return this.obtener<Paciente[]>('/Pacientes/Listar').pipe(
      map((respuesta: any) => {
        // Si la respuesta es un array directo
        if (Array.isArray(respuesta)) return respuesta as Paciente[];
        // Si es el objeto esperado
        const exitoso = respuesta.exitoso ?? respuesta.success;
        const datos = respuesta.datos ?? respuesta.data;
        if (exitoso && datos) return datos as Paciente[];
        throw new Error(respuesta.mensaje || 'Error al listar pacientes');
      })
    );
  }

  obtenerPorId(pacienteId: number): Observable<Paciente | null> {
    return this.obtener<Paciente>('/Pacientes/ObtenerPorId', { pacienteId }).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        const datos = respuesta.datos ?? respuesta.data;
        if (exitoso && datos) return datos as Paciente;
        return null;
      })
    );
  }

  insertar(paciente: Partial<Paciente>): Observable<Paciente> {
    return this.crear<Paciente>('/Pacientes/Insertar', paciente).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        const datos = respuesta.datos ?? respuesta.data;
        if (exitoso) return datos as Paciente;
        throw new Error(respuesta.mensaje || 'Error al insertar paciente');
      })
    );
  }

  editar(paciente: Partial<Paciente>): Observable<Paciente> {
    return this.crear<Paciente>('/Pacientes/Editar', paciente).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        const datos = respuesta.datos ?? respuesta.data;
        if (exitoso) return datos as Paciente;
        throw new Error(respuesta.mensaje || 'Error al editar paciente');
      })
    );
  }

  eliminarpaciente(pacienteId: number): Observable<boolean> {
    return this.eliminar<any>('/Pacientes/Eliminar', { pacienteId }).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        if (exitoso) return true;
        throw new Error(respuesta.mensaje || 'Error al eliminar paciente');
      })
    );
  }
}
