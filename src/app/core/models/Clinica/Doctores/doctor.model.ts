export interface Doctor {
  medicoId: number;
  usuarioId: number;
  salaPredeterminadaId?: number;
  nombrePublico: string;
  duracionIntervaloMinutos: number;
  duracionDefaultMinutos: number;
  minutosBuffer: number;
  activo: boolean;
}