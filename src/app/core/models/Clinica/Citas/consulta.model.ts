export interface Consulta {
  consultaId: number;
  citaId: number;
  motivo?: string;
  notas?: string;
  tratamiento?: string;
  fecha: Date;
}