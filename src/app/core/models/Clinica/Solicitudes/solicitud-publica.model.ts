// ── Formulario público ──
export interface SolicitudPublicaInsertarDTO {
  nombrePaciente: string;
  telefono: string;
  email?: string;
  medicoId: number;
  fechaHoraInicio: string;
  motivo?: string;
}

export interface SolicitudUsuarioInsertarDTO {
  pacienteId: number;
  medicoId: number;
  fechaHoraInicio: string;
  duracionMinutos: number;
  motivo?: string;
}

// ── Listado de solicitudes públicas (response del backend) ──
export interface SolicitudPublicaListadoDTO {
  solicitudId: number;
  nombrePaciente: string;
  telefono: string;
  email?: string;
  medicoId: number;
  medico: string;
  duracionDefaultMinutos?: number;
  fechaHoraInicio: string;
  motivo?: string;
  estadoId: number;
  codigoEstado: string;
  estado: string;
  fechaCreacion: string;
}

// ── Listado de solicitudes de usuario registrado (response del backend) ──
export interface SolicitudCitaListadoDTO {
  solicitudId: number;
  pacienteId: number;
  nombrePaciente: string;
  telefono: string;
  email?: string;
  medicoId: number;
  medico: string;
  duracionDefaultMinutos?: number;
  fechaHoraInicio: string;
  duracionMinutos: number;
  motivo?: string;
  estadoId: number;
  codigoEstado: string;
  estado: string;
  fechaCreacion: string;
}

// ── Tipo unificado para la UI (construido en el front) ──
export type TipoSolicitud = 'PUBLICA' | 'USUARIO';

export interface SolicitudUnificada {
  solicitudId: number;
  tipo: TipoSolicitud;
  nombrePaciente: string;
  telefono: string;
  email?: string;
  medicoId: number;
  medico: string;
  duracionDefaultMinutos?: number;
  fechaHoraInicio: string;
  duracionMinutos?: number;
  motivo?: string;
  estadoId: number;
  codigoEstado: string;
  estado: string;
  fechaCreacion: string;
  pacienteId?: number;
  propuestas?: PropuestaReprogramacionDetalle[];
}

// ── Propuesta de reprogramación (detalle) ──
export interface PropuestaReprogramacionDetalle {
  propuestaId: number;
  opcionInicio: string;
  estado: string;
  fechaCreacion: string;
}

// ── Filtros ──
export interface SolicitudesFiltroDTO {
  estadoId?: number;
  medicoId?: number;
  pacienteId?: number;
  desde?: string;
  hasta?: string;
}

// ── Cambiar estado ──
export interface CambiarEstadoSolicitudDTO {
  solicitudId: number;
  codigoEstado: string;
}

// ── Crear cita desde solicitud ──
export interface CitaInsertarDTO {
  solicitudId?: number;
  pacienteId: number;
  medicoId: number;
  salaId: number;
  inicio: string;
  fin: string;
  duracionMinutos: number;
  creadaPorUsuarioId?: number;
}

// ── Propuesta de reprogramación ──
export interface PropuestaReprogramacionInsertarDTO {
  solicitudCitaId?: number;
  solicitudPublicaId?: number;
  opcionInicio: string;
  usuarioProponeId: number;
}

export interface AceptarPropuestaDTO {
  propuestaId: number;
  usuarioId: number;
}

// ── Doctor público (para dropdown) ──
export interface DoctorPublicoDTO {
  medicoId: number;
  nombrePublico: string;
  nombreEspecialidad: string;
  duracionDefaultMinutos?: number;
  salaPredeterminadaId?: number;
}
