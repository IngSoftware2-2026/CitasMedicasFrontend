/**
 * Servicio de autenticación de usuarios.
 * Gestiona el inicio y cierre de sesión, almacenamiento de tokens y estado de autenticación.
 * Utiliza signals para reactivity en el estado de autenticación.
 */
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError } from 'rxjs';
import { UsuarioService } from '../usuarios/usuario.service';
import { RolPermisosService } from '../permisos/rol-permisos.service';
import { LoginRequest, LoginResponse } from '../../../models/Accesos/usuario.model';
import { CodigoRol, ROLES } from '../../../constants/roles';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private usuarioServicio = inject(UsuarioService);
  private rolPermisosService = inject(RolPermisosService);
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

  establecerAuth(token: string, usuarioId: number, rolId: number, codigoRol?: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('usuarioId', usuarioId.toString());
    localStorage.setItem('rolId', rolId.toString());
    if (codigoRol) {
      const rolNormalizado = codigoRol.trim().toUpperCase();
      localStorage.setItem('codigoRol', rolNormalizado);
      this.rolPermisosService.establecerCodigoRol(rolNormalizado);
      console.debug('AuthService: rol seteado', { rolId, codigoRol, rolNormalizado });
    }
    this.autenticado.set(true);
    this.idUsuario.set(usuarioId);
    this.idRol.set(rolId);
  }

  get codigoRolActual(): CodigoRol {
    return this.rolPermisosService.obtenerCodigoRolActual();
  }

  get esAdmin(): boolean {
    return this.rolPermisosService.esAdmin();
  }

  get esRecepcion(): boolean {
    return this.rolPermisosService.esRecepcion();
  }

  get esDoctor(): boolean {
    return this.rolPermisosService.esDoctor();
  }

  get esPaciente(): boolean {
    return this.rolPermisosService.esPaciente();
  }

  get permisosService(): RolPermisosService {
    return this.rolPermisosService;
  }

  get nombreUsuario(): string {
    return localStorage.getItem('nombreUsuario') || '';
  }

  get correoUsuario(): string {
    return localStorage.getItem('correo') || '';
  }

  get telefonoUsuario(): string {
    return localStorage.getItem('telefono') || '';
  }

  get nombreRol(): string {
    return localStorage.getItem('rolNombre') || '';
  }

  iniciarSesion(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.usuarioServicio.iniciarSesion(credenciales).pipe(
      tap(respuesta => {
        const rolId = respuesta.rol?.rolId ?? 1;
        const codigoRol = respuesta.rol?.codigoRol ?? ROLES.ADMIN;
        this.establecerAuth(respuesta.token, respuesta.usuarioId, rolId, codigoRol);
        
        localStorage.setItem('nombreUsuario', respuesta.nombreUsuario);
        localStorage.setItem('correo', respuesta.correo);
        localStorage.setItem('telefono', respuesta.telefono || '');
        if (respuesta.rol?.nombreRol) {
          localStorage.setItem('rolNombre', respuesta.rol.nombreRol);
        }
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
    localStorage.removeItem('codigoRol');
    localStorage.removeItem('nombreUsuario');
    localStorage.removeItem('correo');
    localStorage.removeItem('telefono');
    localStorage.removeItem('rolNombre');
    this.rolPermisosService.limpiarSesion();
    this.autenticado.set(false);
    this.idUsuario.set(null);
    this.idRol.set(null);
    this.router.navigate(['/login']);
  }
}
