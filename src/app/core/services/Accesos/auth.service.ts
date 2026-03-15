/**
 * Servicio de autenticación de usuarios.
 * Gestiona el inicio y cierre de sesión, almacenamiento de tokens y estado de autenticación.
 * Utiliza signals para reactivity en el estado de autenticación.
 */
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError } from 'rxjs';
import { UsuarioService } from './usuario.service';
import { LoginRequest, LoginResponse } from '../../models/Accesos/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private usuarioServicio = inject(UsuarioService);
  private router = inject(Router);
  
  private autenticado = signal(this.tieneToken());
  private idUsuario = signal<number | null>(this.obtenerIdUsuario());
  private idRol = signal<number | null>(this.obtenerIdRol());

  estaAutenticado = computed(() => this.autenticado());
  usuarioIdActual = computed(() => this.idUsuario());
  rolIdActual = computed(() => this.idRol());

  private tieneToken(): boolean {
    return !!localStorage.getItem('token');
  }

  private obtenerIdUsuario(): number | null {
    const id = localStorage.getItem('usuarioId');
    return id ? parseInt(id, 10) : null;
  }

  private obtenerIdRol(): number | null {
    const id = localStorage.getItem('rolId');
    return id ? parseInt(id, 10) : null;
  }

  establecerAuth(token: string, usuarioId: number, rolId: number): void {
    localStorage.setItem('token', token);
    localStorage.setItem('usuarioId', usuarioId.toString());
    localStorage.setItem('rolId', rolId.toString());
    this.autenticado.set(true);
    this.idUsuario.set(usuarioId);
    this.idRol.set(rolId);
  }

  iniciarSesion(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.usuarioServicio.iniciarSesion(credenciales).pipe(
      tap(respuesta => {
        const rolId = respuesta.rol?.rolId ?? 1;
        this.establecerAuth(respuesta.token, respuesta.usuarioId, rolId);
      }),
      catchError(error => {
        console.error('Error de login:', error);
        throw error;
      })
    );
  }

  cerrarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('rolId');
    this.autenticado.set(false);
    this.idUsuario.set(null);
    this.idRol.set(null);
    this.router.navigate(['/login']);
  }
}
