export interface CitasFiltroRequest {
  medicoId?: number | null;
  pacienteId?: number | null;
  salaId?: number | null;
  estadoId?: number | null;
  desde?: string | null;
  hasta?: string | null;
}
