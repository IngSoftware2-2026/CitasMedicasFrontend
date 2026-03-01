export interface InvitacionPaciente {
  invitacionId: number;
  pacienteId: number;
  hashToken: ArrayBuffer;
  expiraEn: Date;
  usadoEn?: Date;
  generadoPorUsuarioId: number;
  fechaCreacion: Date;
}