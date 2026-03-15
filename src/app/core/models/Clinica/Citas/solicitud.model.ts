export interface SolicitudCita {
  solicitudId: number;
  pacienteId: number;
  medicoId: number;
  fechaHoraInicio: Date;
  duracionMinutos: number;
  motivo: string;
  estadoId: number;
  fechaCreacion: Date;
}
