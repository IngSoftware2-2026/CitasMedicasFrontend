import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ConexionService } from '../Http/conexion.service';
import { Consulta } from '../../models/Clinica/Citas/consulta.model';

@Injectable({ providedIn: 'root' })
export class ConsultaService extends ConexionService {

  obtenerConsultasPorId(pacienteId: number): Observable<Consulta[]> {
    return this.obtener<Consulta[]>('/Consultas/obtener-consulta', { pacienteId }).pipe(
      map((respuesta: any) => {
        // Si la respuesta es un array directo
        if (Array.isArray(respuesta)) return respuesta as Consulta[];
        // Si es el objeto esperado
        const exitoso = respuesta.exitoso ?? respuesta.success;
        const datos = respuesta.datos ?? respuesta.data;
        if (exitoso && datos) return datos as Consulta[];
        throw new Error(respuesta.mensaje || 'Error al listar consultas');
      })
    );
  }
}
