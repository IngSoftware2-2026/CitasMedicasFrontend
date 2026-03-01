export interface Usuario {
  usuarioId: number;
  nombreUsuario?: string;
  correo?: string;
  telefono?: string;
  claveHash: ArrayBuffer;
  rolId: number;
  activo: boolean;
  fechaCreacion: Date;
}