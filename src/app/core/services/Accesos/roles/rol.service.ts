/**
 * Servicio para gestión de roles en el sistema.
 * Extiende ConexionService para comunicarse con el API de roles.
 * Proporciona métodos para listar, obtener, insertar, actualizar y eliminar roles.
 */
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ConexionService, Respuesta } from '../../Http/conexion.service';
import { Rol } from '../../../models/Accesos/rol.model';

/**
 * Servicio que gestiona las operaciones CRUD de roles.
 * Extiende el servicio base de conexión HTTP.
 */
@Injectable({ providedIn: 'root' })
export class RolService extends ConexionService {

  /**
   * Obtiene la lista de todos los roles del sistema.
   * @returns Observable con array de roles
   */
  listar(): Observable<Rol[]> {
    return this.obtener<Rol[]>('/Accesos/Roles/Listar').pipe(
      map((respuesta: any) => {
        console.log('Respuesta listar roles:', respuesta);
        const exitoso = respuesta.exitoso ?? respuesta.success;
        const datos = respuesta.datos ?? respuesta.data;
        
        if (exitoso && datos) {
          return datos as Rol[];
        }
        throw new Error(respuesta.mensaje || respuesta.message || 'Error al listar roles');
      })
    );
  }

  /**
   * Obtiene un rol específico por su ID.
   * @param id - ID del rol a buscar
   * @returns Observable con el rol encontrado o null
   */
  obtenerPorId(id: number): Observable<Rol | null> {
    return this.listar().pipe(
      map(roles => roles.find(r => r.rolId === id) || null)
    );
  }

  /**
   * Inserta un nuevo rol en el sistema.
   * @param datos - Datos parciales del rol a crear
   * @returns Observable con el rol creado
   */
  insertar(datos: Partial<Rol>): Observable<Rol> {
    return this.crear<Rol>('/Accesos/Roles/Insertar', datos).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        const datosResp = respuesta.datos ?? respuesta.data;
        
        if (exitoso && datosResp) {
          return datosResp as Rol;
        }
        throw new Error(respuesta.mensaje || respuesta.message || 'Error al insertar rol');
      })
    );
  }

  /**
   * Actualiza los datos de un rol existente.
   * @param id - ID del rol a actualizar
   * @param datos - Datos actualizados del rol
   * @returns Observable con el rol actualizado
   */
  actualizarRol(id: number, datos: Partial<Rol>): Observable<Rol> {
    return this.actualizar<Rol>('/Accesos/Roles/Editar', { rolId: id, ...datos }).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        const datosResp = respuesta.datos ?? respuesta.data;
        
        if (exitoso && datosResp) {
          return datosResp as Rol;
        }
        throw new Error(respuesta.mensaje || respuesta.message || 'Error al actualizar rol');
      })
    );
  }

  /**
   * Elimina un rol del sistema.
   * @param id - ID del rol a eliminar
   * @returns Observable con true si fue exitoso
   */
  eliminarRol(id: number): Observable<boolean> {
    console.log('=== ELIMINAR ROL ===');
    console.log('rolId:', id);
    console.log('URL:', '/Accesos/Roles/Eliminar?rolId=' + id);
    return this.eliminar<boolean>('/Accesos/Roles/Eliminar?rolId=' + id).pipe(
      map((respuesta: any) => {
        console.log('Response:', respuesta);
        const exitoso = respuesta.exitoso ?? respuesta.success;
        
        if (exitoso) {
          return true;
        }
        throw new Error(respuesta.mensaje || respuesta.message || 'Error al eliminar rol');
      })
    );
  }
}
