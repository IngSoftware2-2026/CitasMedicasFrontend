import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../../core/services/Accesos/usuario.service';
import { AuthService } from '../../../../core/services/Accesos/auth.service';
import { RolPermisosService } from '../../../../core/services/Accesos/rol-permisos.service';
import { LoginRequest } from '../../../../core/models/Accesos/usuario.model';
import { ROLES } from '../../../../core/constants/roles';

@Injectable({ providedIn: 'root' })
export class LoginOperations {
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  private permisosService = inject(RolPermisosService);
  private router = inject(Router);

  login(credentials: LoginRequest, onError: () => void): void {
    this.usuarioService.iniciarSesion(credentials).subscribe({
      next: (result) => {
        if (result && result.token) {
          const rolId = result.rol?.rolId ?? 1;
          const codigoRol = result.rol?.codigoRol ?? ROLES.ADMIN;
          const nombreRol = result.rol?.nombreRol ?? 'Administrador';
          
          localStorage.setItem('nombreUsuario', result.nombreUsuario || credentials.nombreUsuario);
          localStorage.setItem('correo', result.correo || '');
          localStorage.setItem('rolNombre', nombreRol);
          localStorage.setItem('codigoRol', codigoRol);
          
          this.authService.establecerAuth(result.token, result.usuarioId, rolId, codigoRol);
          this.permisosService.establecerCodigoRol(codigoRol);
          
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => onError()
    });
  }
}
