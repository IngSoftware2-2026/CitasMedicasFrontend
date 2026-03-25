export interface CitaListadoResponse {
  citaId: number;
  solicitudId?: number | null;
  pacienteId: number;
  paciente?: string | null;
  medicoId: number;
  medico?: string | null;
  salaId: number;
  sala?: string | null;
  inicio: string;
  fin: string;
  duracionMinutos: number;
  estadoId: number;
  codigoEstado?: string | null;
  estado?: string | null;
  creadaPorUsuarioId?: number | null;
  fechaCreacion: string;
}

export interface CitaDetalleResponse {
  citaId: number;
  solicitudId?: number | null;
  pacienteId: number;
  nombres?: string | null;
  apellidos?: string | null;
  paciente?: string | null;
  medicoId: number;
  medicoUsuarioId: number;
  medico?: string | null;
  salaPredeterminadaId?: number | null;
  duracionIntervaloMinutos?: number | null;
  duracionDefaultMinutos?: number | null;
  minutosBuffer?: number | null;
  salaId: number;
  codigoSala?: string | null;
  sala?: string | null;
  inicio: string;
  fin: string;
  duracionMinutos: number;
  estadoId: number;
  codigoEstado?: string | null;
  estado?: string | null;
  creadaPorUsuarioId?: number | null;
  fechaCreacion: string;
}
