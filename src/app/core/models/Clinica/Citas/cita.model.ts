export interface Cita {
  citaId: number;
  solicitudId?: number;
  pacienteId: number;
  medicoId: number;
  salaId: number;
  inicio: Date;
  fin: Date;
  duracionMinutos: number;
  estadoId: number;
  creadaPorUsuarioId?: number;
  fechaCreacion: Date;
}