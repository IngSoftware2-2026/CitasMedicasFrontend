import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../../core/services/Accesos/usuario.service';
import { AuthService } from '../../../../core/services/Accesos/auth.service';
import { LoginRequest } from '../../../../core/models/Accesos/usuario.model';

@Injectable({ providedIn: 'root' })
export class LoginOperations {
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  private router = inject(Router);

  login(credentials: LoginRequest, onError: () => void): void {
    this.usuarioService.iniciarSesion(credentials).subscribe({
      next: (result) => {
        if (result && result.token) {
          const rolId = result.rol?.rolId ?? 1;
          this.authService.establecerAuth(result.token, result.usuarioId, rolId);
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => onError()
    });
  }
}
