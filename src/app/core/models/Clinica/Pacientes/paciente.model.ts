export interface Paciente {
  pacienteId: number;
  usuarioId?: number;
  nombres: string;
  apellidos?: string;
  telefono: string;
  correo?: string;
  fechaNacimiento?: Date;
  numeroIdentidad?: string;
  activo: boolean;
  fechaCreacion: Date;
}