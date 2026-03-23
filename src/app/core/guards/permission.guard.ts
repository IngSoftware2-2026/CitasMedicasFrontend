import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/Accesos/auth.service';

const NAVIGATION = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard'
} as const;

const permissionGuard: CanActivateFn = (route): boolean => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredPermission = route.data?.['permission'] as string | undefined;

  if (!auth.estaAutenticado()) {
    router.navigate([NAVIGATION.LOGIN]);
    return false;
  }

  // Por ahora simplificado - solo verifica autenticación
  // TODO: Implementar verificación de permisos específicos
  return true;
};

export { permissionGuard };
