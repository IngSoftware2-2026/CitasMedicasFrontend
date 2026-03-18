/**
 * Modelo de usuario del sistema.
 */
export interface Usuario {
  usuarioId: number;
  nombreUsuario: string;
  correo: string;
  telefono?: string;
  clave?: string;
  claveHash?: string;
  rolId: number;
  activo: boolean;
  fechaCreacion?: string;
}

/** Request para iniciar sesión */
export interface LoginRequest {
  nombreUsuario: string;
  clave: string;
}

/** Response del login */
export interface LoginResponse {
  usuarioId: number;
  nombreUsuario: string;
  correo: string;
  token: string;
  rol?: {
    rolId: number;
    codigoRol: string;
    nombreRol: string;
  };
}
