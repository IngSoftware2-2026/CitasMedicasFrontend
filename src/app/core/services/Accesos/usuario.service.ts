/**
 * Servicio para gestión de usuarios en el sistema.
 * Extiende ConexionService para comunicarse con el API de usuarios.
 * Proporciona métodos para login, listar, obtener, insertar, actualizar y eliminar usuarios.
 */
import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, tap } from 'rxjs';
import { ConexionService, Respuesta } from '../Http/conexion.service';
import { ErrorHandlerService } from '../Http/error-handler.service';
import { ERROR_CODES } from '../../shared/models/error-codes';
import { Usuario, LoginRequest, LoginResponse } from '../../models/Accesos/usuario.model';

/**
 * Servicio que gestiona las operaciones CRUD de usuarios.
 * Extiende el servicio base de conexión HTTP.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService extends ConexionService {
  private errorHandler = inject(ErrorHandlerService);

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
        const err = this.errorHandler.handle(error);
        throw new Error(err.mensaje);
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
        if (respuesta.mensaje) {
          this.errorHandler.showError(ERROR_CODES.BUSINESS_NOT_FOUND, respuesta.mensaje);
          throw new Error(respuesta.mensaje);
        }
        return [];
      }),
      catchError(error => {
        this.errorHandler.handle(error);
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
    return this.crear<Usuario>('/Accesos/Usuarios/Insertar', payload).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        const datos = respuesta.datos ?? respuesta.data;
        
        if (exitoso && datos) {
          this.errorHandler.showSuccess('Usuario creado correctamente');
          return datos as Usuario;
        }
        const mensaje = respuesta.mensaje || respuesta.message || 'Error al insertar usuario';
        this.errorHandler.showError(ERROR_CODES.BUSINESS_DUPLICATE, mensaje);
        throw new Error(mensaje);
      }),
      catchError(error => {
        this.errorHandler.handle(error);
        throw error;
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
    return this.actualizar<Usuario>('/Accesos/Usuarios/Editar', payload).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        const datos = respuesta.datos ?? respuesta.data;
        
        if (exitoso && datos) {
          this.errorHandler.showSuccess('Usuario actualizado correctamente');
          return datos as Usuario;
        }
        const mensaje = respuesta.mensaje || respuesta.message || 'Error al actualizar usuario';
        this.errorHandler.showError(ERROR_CODES.BUSINESS_CONSTRAINT, mensaje);
        throw new Error(mensaje);
      }),
      catchError(error => {
        this.errorHandler.handle(error);
        throw error;
      })
    );
  }

  eliminarUsuario(id: number): Observable<boolean> {
    return this.eliminar<boolean>('/Accesos/Usuarios/Eliminar?usuarioId=' + id).pipe(
      map((respuesta: any) => {
        const exitoso = respuesta.exitoso ?? respuesta.success;
        
        if (exitoso) {
          this.errorHandler.showSuccess('Usuario eliminado correctamente');
          return true;
        }
        const mensaje = respuesta.mensaje || respuesta.message || 'Error al eliminar usuario';
        this.errorHandler.showError(ERROR_CODES.BUSINESS_IN_USE, mensaje);
        throw new Error(mensaje);
      }),
      catchError(error => {
        this.errorHandler.handle(error);
        throw error;
      })
    );
  }
}
