import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/Accesos/auth/auth.service';

const authGuard: CanActivateFn = (): boolean => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaAutenticado()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export { authGuard };
