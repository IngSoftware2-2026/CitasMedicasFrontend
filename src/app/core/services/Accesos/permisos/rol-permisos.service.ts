import { Injectable } from '@angular/core';
import { ROLES, CodigoRol } from '../../../constants/roles';
import { PERMISSIONS } from '../../../constants/permissions';

const PERMISOS_POR_ROL: Record<CodigoRol, string[]> = {
  [ROLES.ADMIN]: [
    PERMISSIONS.VER_DASHBOARD,
    PERMISSIONS.GESTIONAR_USUARIOS,
    PERMISSIONS.GESTIONAR_ROLES,
    PERMISSIONS.VER_ROLES,
    PERMISSIONS.GESTIONAR_PACIENTES,
    PERMISSIONS.GESTIONAR_DOCTORES,
    PERMISSIONS.VER_DOCTORES,
    PERMISSIONS.GESTIONAR_CITAS,
    PERMISSIONS.VER_CITAS,
    PERMISSIONS.GESTIONAR_SOLICITUDES,
    PERMISSIONS.GESTIONAR_CATALOGOS,
    PERMISSIONS.VER_CATALOGOS,
    PERMISSIONS.VER_CONSULTAS,
    PERMISSIONS.GESTIONAR_CONSULTAS,
    PERMISSIONS.VER_HORARIOS,
    PERMISSIONS.GESTIONAR_HORARIOS,
    PERMISSIONS.VER_CONFIGURACIONES,
    PERMISSIONS.GESTIONAR_CONFIGURACIONES,
    PERMISSIONS.EDITAR_ROLES,
    PERMISSIONS.ELIMINAR_ROLES
  ],
  [ROLES.RECEPCION]: [
    PERMISSIONS.VER_DASHBOARD,
    PERMISSIONS.GESTIONAR_PACIENTES,
    PERMISSIONS.GESTIONAR_SOLICITUDES,
    PERMISSIONS.GESTIONAR_CITAS,
    PERMISSIONS.VER_CITAS,
    PERMISSIONS.VER_CATALOGOS,
    PERMISSIONS.GESTIONAR_CATALOGOS,
    PERMISSIONS.VER_HORARIOS,
    PERMISSIONS.GESTIONAR_HORARIOS,
    PERMISSIONS.VER_CONFIGURACIONES
  ],
  [ROLES.DOCTOR]: [
    PERMISSIONS.VER_DASHBOARD,
    PERMISSIONS.VER_PACIENTES,
    PERMISSIONS.VER_CITAS,
    PERMISSIONS.VER_CONSULTAS,
    PERMISSIONS.GESTIONAR_CONSULTAS,
    PERMISSIONS.VER_HORARIOS,
    PERMISSIONS.VER_CONFIGURACIONES
  ],
  [ROLES.PACIENTE]: [
    PERMISSIONS.VER_DASHBOARD,
    PERMISSIONS.VER_DOCTORES,
    PERMISSIONS.VER_HORARIOS,
    PERMISSIONS.VER_CITAS,
    PERMISSIONS.GESTIONAR_SOLICITUDES,
    PERMISSIONS.VER_CONFIGURACIONES
  ]
};

@Injectable({ providedIn: 'root' })
export class RolPermisosService {
  private _codigoRol: CodigoRol = ROLES.ADMIN;

  constructor() {
    this.obtenerCodigoRol();
  }

  private normalizarCodigoRol(codigo: string | null): CodigoRol {
    if (!codigo) {
      return ROLES.ADMIN;
    }

    const upper = codigo.toString().trim().toUpperCase();
    if (Object.values(ROLES).includes(upper as CodigoRol)) {
      return upper as CodigoRol;
    }

    return ROLES.ADMIN;
  }

  private obtenerCodigoRol(): void {
    const codigo = localStorage.getItem('codigoRol');
    this._codigoRol = this.normalizarCodigoRol(codigo);
  }

  establecerCodigoRol(codigo: string): void {
    const rolNormalizado = this.normalizarCodigoRol(codigo);
    localStorage.setItem('codigoRol', rolNormalizado);
    this._codigoRol = rolNormalizado;
  }

  obtenerCodigoRolActual(): CodigoRol {
    return this._codigoRol;
  }

  esRol(rol: CodigoRol): boolean {
    return this._codigoRol === rol;
  }

  esAdmin(): boolean {
    return this._codigoRol === ROLES.ADMIN;
  }

  esRecepcion(): boolean {
    return this._codigoRol === ROLES.RECEPCION;
  }

  esDoctor(): boolean {
    return this._codigoRol === ROLES.DOCTOR;
  }

  esPaciente(): boolean {
    return this._codigoRol === ROLES.PACIENTE;
  }

  tienePermiso(permiso: string): boolean {
    const permisosRol = PERMISOS_POR_ROL[this._codigoRol] ?? [];
    return permisosRol.includes(permiso);
  }

  limpiarSesion(): void {
    localStorage.removeItem('codigoRol');
    this._codigoRol = ROLES.ADMIN;
  }
}
