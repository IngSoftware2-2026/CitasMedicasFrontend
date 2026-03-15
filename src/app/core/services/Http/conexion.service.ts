/**
 * Servicio base para comunicación HTTP con el backend.
 * Proporciona métodos genéricos para realizar peticiones GET, POST, PUT y DELETE.
 * Extiende este servicio para crear servicios específicos de cada módulo.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Interfaz estándar de respuesta del backend.
 * @template T - Tipo de datos contenido en la respuesta
 */
export interface Respuesta<T> {
  tipo: string;
  codigo: number;
  exitoso: boolean;
  success?: boolean; 
  mensaje: string;
  datos: T;
  data?: T; 
}

/**
 * Servicio base que gestiona la conexión HTTP con el API.
 * Proveé métodos genéricos para todas las operaciones CRUD.
 */
@Injectable({ providedIn: 'root' })
export class ConexionService {
  private http = inject(HttpClient);
  private urlBase = environment.apiUrl;

  /**
   * Realiza una petición GET al endpoint especificado.
   * @param endpoint - Ruta del endpoint (ej: '/Accesos/Usuarios/Listar')
   * @param parametros - Objeto con parámetros de consulta opcionales
   * @returns Observable con la respuesta del servidor
   */
  obtener<T>(endpoint: string, parametros?: Record<string, string | number>): Observable<Respuesta<T>> {
    let parametrosHttp = new HttpParams();
    if (parametros) {
      Object.keys(parametros).forEach(clave => {
        parametrosHttp = parametrosHttp.set(clave, parametros[clave].toString());
      });
    }
    console.log(`GET ${this.urlBase}${endpoint}`);
    return this.http.get<Respuesta<T>>(`${this.urlBase}${endpoint}`, { params: parametrosHttp });
  }

  /**
   * Alias para obtener - mantiene compatibilidad con el código existente.
   */
  obtenerAsync<T>(endpoint: string, parametros?: Record<string, string | number>): Observable<Respuesta<T>> {
    return this.obtener<T>(endpoint, parametros);
  }

  /**
   * Realiza una petición POST para crear un nuevo recurso.
   * @param endpoint - Ruta del endpoint
   * @param cuerpo - Datos del recurso a crear
   * @returns Observable con la respuesta del servidor
   */
  crear<T>(endpoint: string, cuerpo: unknown): Observable<Respuesta<T>> {
    return this.http.post<Respuesta<T>>(`${this.urlBase}${endpoint}`, cuerpo);
  }

  /**
   * Realiza una petición PUT para actualizar un recurso existente.
   * @param endpoint - Ruta del endpoint
   * @param cuerpo - Datos actualizados del recurso
   * @returns Observable con la respuesta del servidor
   */
  actualizar<T>(endpoint: string, cuerpo: unknown): Observable<Respuesta<T>> {
    return this.http.put<Respuesta<T>>(`${this.urlBase}${endpoint}`, cuerpo);
  }

  /**
   * Realiza una petición DELETE para eliminar un recurso.
   * @param endpoint - Ruta del endpoint
   * @param parametros - Parámetros para identificar el recurso a eliminar
   * @returns Observable con la respuesta del servidor
   */
  eliminar<T>(endpoint: string, parametros?: Record<string, string | number>): Observable<Respuesta<T>> {
    let parametrosHttp = new HttpParams();
    if (parametros) {
      Object.keys(parametros).forEach(clave => {
        parametrosHttp = parametrosHttp.set(clave, parametros[clave].toString());
      });
    }
    return this.http.delete<Respuesta<T>>(`${this.urlBase}${endpoint}`, { params: parametrosHttp });
  }
}

/**
 * Constante exportada con la clave API para usar en interceptores.
 */
export const CLAVE_API = environment.apiKey;
