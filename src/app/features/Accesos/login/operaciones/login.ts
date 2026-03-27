import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/Accesos/auth/auth.service';
import { LoginRequest } from '../../../../core/models/Accesos/usuario.model';

@Injectable({ providedIn: 'root' })
export class LoginOperations {
  private authService = inject(AuthService);
  private router = inject(Router);

  login(credentials: LoginRequest, onError: () => void): void {
    this.authService.iniciarSesion(credentials).subscribe({
      next: (result) => {
        if (result && result.token) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => onError()
    });
  }
}
