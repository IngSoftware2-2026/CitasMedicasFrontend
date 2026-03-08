export interface Usuario {
  usuarioId: number;
  nombreUsuario: string;
  correo: string;
  telefono?: string;
  clave?: string;
  rolId: number;
  activo: boolean;
  fechaCreacion: string;
}