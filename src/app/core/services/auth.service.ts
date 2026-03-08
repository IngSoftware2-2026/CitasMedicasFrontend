import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from '../models/Accesos/usuario.model';
import { MockDataService } from './mock-data.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authenticated = signal(false);
  private currentUserSignal = signal<Usuario | null>(null);

  isAuthenticated = computed(() => this.authenticated());
  currentUser = computed(() => this.currentUserSignal());

  constructor(
    private router: Router,
    private data: MockDataService
  ) {}

  login(email: string, password: string): boolean {
    const user = this.data.usuarios.find(
      (u) => u.correo.toLowerCase() === email.toLowerCase() && u.activo
    );

    if (!user) return false;

    if ((user.clave ?? '') !== password) return false;

    this.currentUserSignal.set(user);
    this.authenticated.set(true);
    return true;
  }

  getPermissionCodesForCurrentUser(): string[] {
    const user = this.currentUserSignal();
    if (!user) return [];

    const permisoIds = this.data.rolPermisos
      .filter((rp) => rp.rolId === user.rolId)
      .map((rp) => rp.permisoId);

    return this.data.permisos
      .filter((p) => permisoIds.includes(p.permisoId))
      .map((p) => p.codigoPermiso);
  }

  hasPermission(permissionCode: string): boolean {
    return this.getPermissionCodesForCurrentUser().includes(permissionCode);
  }

  logout(): void {
    this.authenticated.set(false);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }
}
