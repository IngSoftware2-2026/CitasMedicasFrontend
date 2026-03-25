import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ConexionService } from '../Http/conexion.service';
import { Consulta } from '../../models/Clinica/Citas/consulta.model';
import { ActualizarConsulta } from '../../models/Clinica/Consultas/actualizar-consulta.model';

@Injectable({ providedIn: 'root' })
export class ConsultaService extends ConexionService {

  obtenerConsultas(): Observable<Consulta[]> {
    return this.obtener<Consulta[]>('/Consultas/obtener-todas-las-consultas').pipe(
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

    insertar(consulta: Partial<Consulta>): Observable<Consulta> {
      return this.crear<Consulta>('/Consultas/Insertar-consulta', consulta).pipe(
        map((respuesta: any) => {
          const exitoso = respuesta.exitoso ?? respuesta.success;
          const datos = respuesta.datos ?? respuesta.data;
          if (exitoso) return datos as Consulta;
          throw new Error(respuesta.mensaje || 'Error al insertar consulta');
        })
      );
    }

  editar(consulta: Partial<ActualizarConsulta>): Observable<ActualizarConsulta> {
    return this.crear<ActualizarConsulta>('/Consultas/actualizar-consulta', consulta).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        const datos = respuesta.datos ?? respuesta.data;
        if (exitoso) return datos as ActualizarConsulta;
        throw new Error(respuesta.mensaje || 'Error al editar consulta');
      })
    );
  }

    // obtenerCitas(): Observable<Consulta[]> {
    // return this.obtener<Consulta[]>('/Consultas/obtener-todas-las-consultas').pipe(
    //   map((respuesta: any) => {
    //     // Si la respuesta es un array directo
    //     if (Array.isArray(respuesta)) return respuesta as Consulta[];
    //     // Si es el objeto esperado
    //     const exitoso = respuesta.exitoso ?? respuesta.success;
    //     const datos = respuesta.datos ?? respuesta.data;
    //     if (exitoso && datos) return datos as Consulta[];
    //     throw new Error(respuesta.mensaje || 'Error al listar consultas');
    //   })
    // );
  //}
}
