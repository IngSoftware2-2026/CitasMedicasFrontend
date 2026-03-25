export interface CitasInsertarRequest {
  solicitudId?: number | null;
  pacienteId: number;
  medicoId: number;
  salaId: number;
  inicio: string;
  fin: string;
  duracionMinutos: number;
  creadaPorUsuarioId?: number | null;
}
