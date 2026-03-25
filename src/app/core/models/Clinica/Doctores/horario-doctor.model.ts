export interface HorarioDoctor {
  horarioId: number;
  medicoId: number;
  doctorId?: number;
  diaSemana: number;
  horaInicio: string; 
  horaFin: string;
  activo: boolean;
}