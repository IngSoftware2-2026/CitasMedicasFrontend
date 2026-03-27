export interface Doctor {
  medicoId: number;
  nombrePublico: string;
  usuarioId: number;
  salaPredeterminadaId?: number | null;
  duracionIntervaloMinutos: number;
  duracionDefaultMinutos: number;
  minutosBuffer: number;
  activo: boolean;
  nombreEspecialidad?: string;
  horarios?: any[];
  imagen?: string | null;
}

export interface DoctorEspecialidad {
  especialidadId: number;
  nombreEspecialidad: string;
  principal: boolean;
}

export interface DoctorDetalle extends Doctor {
  especialidades?: DoctorEspecialidad[];
  usuario?: any;
}