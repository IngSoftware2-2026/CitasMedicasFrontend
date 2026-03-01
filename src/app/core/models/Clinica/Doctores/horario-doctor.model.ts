export interface HorarioDoctor {
  horarioId: number;
  medicoId: number;
  diaSemana: number;
  horaInicio: string; 
  horaFin: string;
  activo: boolean;
}