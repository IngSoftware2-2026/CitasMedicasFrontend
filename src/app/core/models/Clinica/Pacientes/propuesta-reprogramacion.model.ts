export interface PropuestaReprogramacion {
  propuestaId: number;
  solicitudId: number;
  opcionInicio: Date;
  opcionFin: Date;
  duracionMinutos: number;
  seleccionada: boolean;
  fechaCreacion: Date;
}