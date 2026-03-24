/**
 * Servicio para gestión de usuarios en el sistema.
 * Extiende ConexionService para comunicarse con el API de usuarios.
 * Proporciona métodos para login, listar, obtener, insertar, actualizar y eliminar usuarios.
 */
import { Injectable } from '@angular/core';
import { Observable, map, catchError, tap } from 'rxjs';
import { ConexionService, Respuesta } from '../Http/conexion.service';
import { Usuario, LoginRequest, LoginResponse } from '../../models/Accesos/usuario.model';

/**
 * Servicio que gestiona las operaciones CRUD de usuarios.
 * Extiende el servicio base de conexión HTTP.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService extends ConexionService {

  /**
   * Realiza el inicio de sesión de un usuario.
   * @param credenciales - Objeto con nombre de usuario y contraseña
   * @returns Observable con los datos del usuario logueado
   */
  iniciarSesion(credenciales: LoginRequest): Observable<LoginResponse> {
    console.log('Login request enviado:', credenciales);
    
    return this.crear<LoginResponse>('/Accesos/Login', credenciales).pipe(
      tap(respuesta => console.log('Login respuesta:', respuesta)),
      map((respuesta: any) => {
        const exitoso = respuesta.success !== undefined ? respuesta.success : respuesta.exitoso;
        const datos = respuesta.data !== undefined ? respuesta.data : respuesta.datos;
        
        if (exitoso && datos) {
          return datos as LoginResponse;
        }
        throw new Error(respuesta.mensaje || 'Usuario o contraseña incorrectos');
      }),
      catchError(error => {
        console.error('Error de login:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene la lista de todos los usuarios del sistema.
   * @returns Observable con array de usuarios
   */
  listar(): Observable<Usuario[]> {
    return this.obtener<Usuario[]>('/Accesos/Usuarios/Listar').pipe(
      map((respuesta: any) => {
        if (!respuesta) return [];
        const exitoso = respuesta.exitoso ?? respuesta.success;
        const datos = respuesta.datos ?? respuesta.data;
        if (exitoso && datos) return datos as Usuario[];
        if (respuesta.mensaje) throw new Error(respuesta.mensaje);
        return [];
      })
    );
  }

  obtenerPorId(id: number): Observable<Usuario | null> {
    return this.obtener<Usuario>(`/Accesos/Usuarios/${id}`).pipe(
      map((respuesta: any) => {
        if (!respuesta) return null;
        const exitoso = respuesta.success ?? respuesta.exitoso;
        const datos = respuesta.data ?? respuesta.datos;
        if (exitoso && datos) return datos as Usuario;
        return null;
      }),
      catchError(() => [])
    );
  }

  insertar(datos: Partial<Usuario>): Observable<Usuario> {
    const payload = {
      nombreUsuario: datos.nombreUsuario || '',
      correo: datos.correo || '',
      telefono: datos.telefono || '',
      clave: datos.clave || '',
      rolId: datos.rolId ?? 1
    };
    console.log('Payload insertar:', JSON.stringify(payload));
    return this.crear<Usuario>('/Accesos/Usuarios/Insertar', payload).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        const datos = respuesta.datos ?? respuesta.data;
        
        if (exitoso && datos) {
          return datos as Usuario;
        }
        throw new Error(respuesta.mensaje || respuesta.message || 'Error al insertar usuario');
      })
    );
  }

  /**
   * Actualiza los datos de un usuario existente.
   * @param id - ID del usuario a actualizar
   * @param datos - Datos actualizados del usuario
   * @returns Observable con el usuario actualizado
   */
  actualizarUsuario(id: number, datos: Partial<Usuario>): Observable<Usuario> {
    const payload = {
      usuarioId: id,
      nombreUsuario: datos.nombreUsuario || '',
      correo: datos.correo || '',
      telefono: datos.telefono || '',
      rolId: datos.rolId ?? 1,
      activo: datos.activo ?? true
    };
    console.log('Payload actualizar:', JSON.stringify(payload));
    return this.actualizar<Usuario>('/Accesos/Usuarios/Editar', payload).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        const datos = respuesta.datos ?? respuesta.data;
        
        if (exitoso && datos) {
          return datos as Usuario;
        }
        throw new Error(respuesta.mensaje || respuesta.message || 'Error al actualizar usuario');
      })
    );
  }

  eliminarUsuario(id: number): Observable<boolean> {
    console.log('Eliminar usuario ID:', id);
    return this.eliminar<boolean>('/Accesos/Usuarios/Eliminar?usuarioId=' + id).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        
        if (exitoso) {
          return true;
        }
        throw new Error(respuesta.mensaje || respuesta.message || 'Error al eliminar usuario');
      })
    );
  }
}
