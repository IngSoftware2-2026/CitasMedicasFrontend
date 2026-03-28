import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/Accesos/auth/auth.service';

const NAVIGATION = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard'
} as const;

const ROLES_PERMITIDOS: Record<string, string[]> = {
  'PACIENTES': ['ADMIN', 'RECEP'],
  'DOCTORES': ['ADMIN', 'RECEP', 'PACIENTE'],
  'CITAS': ['ADMIN', 'RECEP', 'DOCTOR', 'PACIENTE'],
  'SOLICITUDES': ['ADMIN', 'RECEP', 'PACIENTE'],
  'SALAS': ['ADMIN', 'DOCTOR'],
  'ESPECIALIDADES': ['ADMIN', 'DOCTOR'],
  'PERMISOS': ['ADMIN'],
  'CONSULTAS': ['ADMIN', 'DOCTOR'],
  'HORARIOS': ['ADMIN', 'RECEP', 'DOCTOR', 'PACIENTE'],
  'USUARIOS': ['ADMIN'],
  'ADMIN': ['ADMIN'],
  'CONFIGURACIONES': ['ADMIN', 'RECEP', 'DOCTOR', 'PACIENTE'],
  'REPORTES': ['ADMIN']
};

const permissionGuard: CanActivateFn = (route): boolean => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const routeName = route.data?.['routeName'] as string | undefined;

  if (!auth.estaAutenticado()) {
    router.navigate([NAVIGATION.LOGIN]);
    return false;
  }

  if (routeName) {
    const rolesPermitidos = ROLES_PERMITIDOS[routeName];
    if (rolesPermitidos) {
      const rolActual = auth.codigoRolActual;
      if (!rolesPermitidos.includes(rolActual)) {
        console.warn('Acceso denegado a:', routeName, 'para rol:', rolActual);
        router.navigate([NAVIGATION.DASHBOARD]);
        return false;
      }
    }
  }

  return true;
};

export { permissionGuard };
