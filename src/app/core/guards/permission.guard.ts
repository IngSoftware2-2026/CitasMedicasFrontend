import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredPermission = route.data?.['permission'] as string | undefined;

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (!requiredPermission || auth.hasPermission(requiredPermission)) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};