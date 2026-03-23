import { Injectable } from '@angular/core';
import { Usuario } from '../../models/Accesos/usuario.model';
import { Rol } from '../../models/Accesos/rol.model';
import { Permiso } from '../../models/Accesos/permiso.model';
import { Especialidad } from '../../models/Catalogos/especialidad.model';
import { EstadoCita } from '../../models/Catalogos/estadocita.model';
import { EstadoSolicitud } from '../../models/Catalogos/estado-solicitud.model';
import { Sala } from '../../models/Catalogos/sala.model';
import { Cita } from '../../models/Clinica/Citas/cita.model';
import { Consulta } from '../../models/Clinica/Citas/consulta.model';
import { SolicitudCita } from '../../models/Clinica/Citas/solicitud.model';
import { Doctor } from '../../models/Clinica/Doctores/doctor.model';
import { DoctorEspecialidad } from '../../models/Clinica/Doctores/doctor-especialidad.model';
import { HorarioDoctor } from '../../models/Clinica/Doctores/horario-doctor.model';
import { Paciente } from '../../models/Clinica/Pacientes/paciente.model';
import { PropuestaReprogramacion } from '../../models/Clinica/Pacientes/propuesta-reprogramacion.model';

@Injectable({ providedIn: 'root' })
export class MockDataService {

  // === HELPERS ===
  getPacienteNombre(id: number): string {
    const p = this.pacientes.find(x => x.pacienteId === id);
    return p ? `${p.nombres} ${p.apellidos ?? ''}`.trim() : 'Desconocido';
  }

  getDoctorNombre(id: number): string {
    return this.doctores.find(x => x.medicoId === id)?.nombrePublico ?? 'Desconocido';
  }

  getSalaNombre(id: number): string {
    return this.salas.find(x => x.salaId === id)?.nombreSala ?? 'Sin sala';
  }

  getEstadoCitaNombre(id: number): string {
    return this.estadosCita.find(x => x.estadoCitaId === id)?.nombreEstado ?? '';
  }

  getEstadoCitaCodigo(id: number): string {
    return this.estadosCita.find(x => x.estadoCitaId === id)?.codigoEstado ?? '';
  }

  getDoctorEspecialidad(medicoId: number): string {
    const rel = this.doctorEspecialidades.find(x => x.medicoId === medicoId && x.principal);
    if (!rel) return 'Sin especialidad';
    return this.especialidades.find(x => x.especialidadId === rel.especialidadId)?.nombre ?? 'Sin especialidad';
  }

  getDoctorSala(medicoId: number): string {
    const d = this.doctores.find(x => x.medicoId === medicoId);
    if (!d?.salaPredeterminadaId) return 'No asignada';
    return this.salas.find(x => x.salaId === d.salaPredeterminadaId)?.nombreSala ?? 'No asignada';
  }

  getHorariosDeDoctor(medicoId: number): HorarioDoctor[] {
    return this.horariosDoctor.filter(h => h.medicoId === medicoId && h.activo);
  }

  getEstadoCitaSeverity(codigo: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (codigo) {
      case 'CONFIRMADA': return 'info';
      case 'EN_CURSO': return 'warn';
      case 'FINALIZADA': return 'success';
      case 'CANCELADA': return 'danger';
      case 'NO_ASISTIO': return 'secondary';
      default: return undefined;
    }
  }

  getEstadoSolicitudSeverity(codigo: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (codigo) {
      case 'PENDIENTE': return 'warn';
      case 'PROPUESTA': return 'info';
      case 'CONFIRMADA': return 'success';
      case 'RECHAZADA': return 'danger';
      case 'CANCELADA': return 'secondary';
      default: return undefined;
    }
  }

  toDateString(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  toDateTimeString(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  private counters: Record<string, number> = {
    paciente: 11, doctor: 7, cita: 11, sala: 9, solicitud: 9,
    especialidad: 9, consulta: 5, horario: 19, propuesta: 3,
    rol: 5, permiso: 11, usuario: 7
  };

  nextId(entity: string): number {
    return this.counters[entity]++;
  }

  roles: Rol[] = [
    { rolId: 1, codigoRol: 'ADMIN', nombreRol: 'Administrador' },
    { rolId: 2, codigoRol: 'DOCTOR', nombreRol: 'Doctor' },
    { rolId: 3, codigoRol: 'RECEP', nombreRol: 'Recepcion' },
    { rolId: 4, codigoRol: 'PACIENTE', nombreRol: 'Paciente' }
  ];

  permisos: Permiso[] = [
    { permisoId: 1, codigoPermiso: 'GESTIONAR_USUARIOS', nombrePermiso: 'Gestionar Usuarios', descripcion: 'Crear, editar y eliminar usuarios del sistema' },
    { permisoId: 2, codigoPermiso: 'GESTIONAR_ROLES', nombrePermiso: 'Gestionar Roles', descripcion: 'Crear y asignar roles y permisos' },
    { permisoId: 3, codigoPermiso: 'VER_DASHBOARD', nombrePermiso: 'Ver Dashboard', descripcion: 'Acceso al panel de estadisticas' },
    { permisoId: 4, codigoPermiso: 'GESTIONAR_PACIENTES', nombrePermiso: 'Gestionar Pacientes', descripcion: 'CRUD completo de pacientes' },
    { permisoId: 5, codigoPermiso: 'GESTIONAR_DOCTORES', nombrePermiso: 'Gestionar Doctores', descripcion: 'CRUD completo de doctores' },
    { permisoId: 6, codigoPermiso: 'GESTIONAR_CITAS', nombrePermiso: 'Gestionar Citas', descripcion: 'Crear, editar y cancelar citas' },
    { permisoId: 7, codigoPermiso: 'VER_CITAS', nombrePermiso: 'Ver Citas', descripcion: 'Consultar citas asignadas' },
    { permisoId: 8, codigoPermiso: 'GESTIONAR_SOLICITUDES', nombrePermiso: 'Gestionar Solicitudes', descripcion: 'Aprobar o rechazar solicitudes de citas' },
    { permisoId: 9, codigoPermiso: 'GESTIONAR_CATALOGOS', nombrePermiso: 'Gestionar Catalogos', descripcion: 'Administrar especialidades, salas y estados' },
    { permisoId: 10, codigoPermiso: 'VER_CONSULTAS', nombrePermiso: 'Ver Consultas', descripcion: 'Consultar historial de consultas medicas' }
  ];

  rolPermisos: { rolId: number; permisoId: number }[] = [
    { rolId: 1, permisoId: 1 }, { rolId: 1, permisoId: 2 }, { rolId: 1, permisoId: 3 },
    { rolId: 1, permisoId: 4 }, { rolId: 1, permisoId: 5 }, { rolId: 1, permisoId: 6 },
    { rolId: 1, permisoId: 7 }, { rolId: 1, permisoId: 8 }, { rolId: 1, permisoId: 9 },
    { rolId: 1, permisoId: 10 },
    { rolId: 2, permisoId: 3 }, { rolId: 2, permisoId: 7 }, { rolId: 2, permisoId: 10 },
    { rolId: 3, permisoId: 3 }, { rolId: 3, permisoId: 4 }, { rolId: 3, permisoId: 6 },
    { rolId: 3, permisoId: 7 }, { rolId: 3, permisoId: 8 },
    { rolId: 4, permisoId: 7 }
  ];

  usuarios: Usuario[] = [
    { usuarioId: 1, nombreUsuario: 'admin', correo: 'admin@medicitas.com', telefono: '5551234567', clave: 'admin123', rolId: 1, activo: true, fechaCreacion: '2025-01-15' },
    { usuarioId: 2, nombreUsuario: 'dr.martinez', correo: 'martinez@medicitas.com', telefono: '5559876543', clave: 'doctor123', rolId: 2, activo: true, fechaCreacion: '2025-02-01' },
    { usuarioId: 3, nombreUsuario: 'dr.garcia', correo: 'garcia@medicitas.com', telefono: '5558765432', clave: 'doctor123', rolId: 2, activo: true, fechaCreacion: '2025-02-10' },
    { usuarioId: 4, nombreUsuario: 'recepcion1', correo: 'recepcion@medicitas.com', telefono: '5554567890', clave: 'recep123', rolId: 3, activo: true, fechaCreacion: '2025-03-01' },
    { usuarioId: 5, nombreUsuario: 'paciente.lopez', correo: 'lopez@correo.com', telefono: '5551112233', clave: 'paciente123', rolId: 4, activo: true, fechaCreacion: '2025-04-20' },
    { usuarioId: 6, nombreUsuario: 'paciente.ramirez', correo: 'ramirez@correo.com', telefono: '5554445566', clave: 'paciente123', rolId: 4, activo: false, fechaCreacion: '2025-05-10' }
  ];

  especialidades: Especialidad[] = [
    { especialidadId: 1, nombre: 'Cardiologia', activo: true },
    { especialidadId: 2, nombre: 'Pediatria', activo: true },
    { especialidadId: 3, nombre: 'Dermatologia', activo: true },
    { especialidadId: 4, nombre: 'Ginecologia', activo: true },
    { especialidadId: 5, nombre: 'Traumatologia', activo: true },
    { especialidadId: 6, nombre: 'Neurologia', activo: true },
    { especialidadId: 7, nombre: 'Oftalmologia', activo: true },
    { especialidadId: 8, nombre: 'Medicina General', activo: true }
  ];

  salas: Sala[] = [
    { salaId: 1, codigoSala: 'S101', nombreSala: 'Sala 101', ubicacion: 'Piso 1, Ala Norte', activo: true },
    { salaId: 2, codigoSala: 'S102', nombreSala: 'Sala 102', ubicacion: 'Piso 1, Ala Norte', activo: true },
    { salaId: 3, codigoSala: 'S103', nombreSala: 'Sala 103', ubicacion: 'Piso 1, Ala Sur', activo: true },
    { salaId: 4, codigoSala: 'S104', nombreSala: 'Sala 104', ubicacion: 'Piso 1, Ala Sur', activo: true },
    { salaId: 5, codigoSala: 'S203', nombreSala: 'Sala 203', ubicacion: 'Piso 2, Ala Norte', activo: true },
    { salaId: 6, codigoSala: 'S204', nombreSala: 'Sala 204', ubicacion: 'Piso 2, Ala Norte', activo: false },
    { salaId: 7, codigoSala: 'S301', nombreSala: 'Sala 301', ubicacion: 'Piso 3, Ala Norte', activo: true },
    { salaId: 8, codigoSala: 'S302', nombreSala: 'Sala 302', ubicacion: 'Piso 3, Ala Sur', activo: true }
  ];

  estadosSolicitud: EstadoSolicitud[] = [
    { estadoSolicitudId: 1, codigoEstado: 'PENDIENTE', nombreEstado: 'Pendiente' },
    { estadoSolicitudId: 2, codigoEstado: 'PROPUESTA', nombreEstado: 'Propuesta' },
    { estadoSolicitudId: 3, codigoEstado: 'CONFIRMADA', nombreEstado: 'Confirmada' },
    { estadoSolicitudId: 4, codigoEstado: 'RECHAZADA', nombreEstado: 'Rechazada' },
    { estadoSolicitudId: 5, codigoEstado: 'CANCELADA', nombreEstado: 'Cancelada' }
  ];

  estadosCita: EstadoCita[] = [
    { estadoCitaId: 1, codigoEstado: 'CONFIRMADA', nombreEstado: 'Confirmada' },
    { estadoCitaId: 2, codigoEstado: 'EN_CURSO', nombreEstado: 'En curso' },
    { estadoCitaId: 3, codigoEstado: 'FINALIZADA', nombreEstado: 'Finalizada' },
    { estadoCitaId: 4, codigoEstado: 'CANCELADA', nombreEstado: 'Cancelada' },
    { estadoCitaId: 5, codigoEstado: 'NO_ASISTIO', nombreEstado: 'No asistio' }
  ];

  pacientes: Paciente[] = [
    { pacienteId: 1, nombres: 'Maria', apellidos: 'Rodriguez', telefono: '+502 4123-4567', correo: 'maria@email.com', fechaNacimiento: new Date('1990-05-15'), numeroIdentidad: '1234567890101', activo: true, fechaCreacion: new Date('2026-01-08') },
    { pacienteId: 2, nombres: 'Juan', apellidos: 'Lopez', telefono: '+502 5234-5678', correo: 'juan@email.com', fechaNacimiento: new Date('1985-08-22'), numeroIdentidad: '2345678901012', activo: true, fechaCreacion: new Date('2026-01-09') },
    { pacienteId: 3, nombres: 'Sofia', apellidos: 'Ramirez', telefono: '+502 5890-1234', correo: 'sofia@email.com', fechaNacimiento: new Date('2000-06-05'), numeroIdentidad: '8901234567018', activo: true, fechaCreacion: new Date('2026-01-10') },
    { pacienteId: 4, nombres: 'Pedro', apellidos: 'Garcia', telefono: '+502 3345-6789', correo: 'pedro@email.com', fechaNacimiento: new Date('1978-12-03'), numeroIdentidad: '3456789012013', activo: true, fechaCreacion: new Date('2026-01-11') },
    { pacienteId: 5, nombres: 'Lucia', apellidos: 'Fernandez', telefono: '+502 4456-7890', correo: 'lucia@email.com', fechaNacimiento: new Date('1995-03-28'), numeroIdentidad: '4567890123014', activo: true, fechaCreacion: new Date('2026-01-12') },
    { pacienteId: 6, nombres: 'Andres', apellidos: 'Herrera', telefono: '+502 5567-8901', correo: 'andres@email.com', fechaNacimiento: new Date('1982-07-10'), numeroIdentidad: '5678901234015', activo: true, fechaCreacion: new Date('2026-01-13') },
    { pacienteId: 7, nombres: 'Carmen', apellidos: 'Soto', telefono: '+502 3678-9012', correo: 'carmen@email.com', fechaNacimiento: new Date('1988-11-20'), numeroIdentidad: '6789012345016', activo: false, fechaCreacion: new Date('2026-01-14') },
    { pacienteId: 8, nombres: 'Fernando', apellidos: 'Castillo', telefono: '+502 3901-2345', correo: 'fernando@email.com', fechaNacimiento: new Date('1992-09-30'), numeroIdentidad: '9012345678019', activo: true, fechaCreacion: new Date('2026-01-15') },
    { pacienteId: 9, nombres: 'Diana', apellidos: 'Morales', telefono: '+502 4012-3456', correo: 'diana@email.com', fechaNacimiento: new Date('1987-04-18'), numeroIdentidad: '0123456789020', activo: true, fechaCreacion: new Date('2026-01-16') },
    { pacienteId: 10, nombres: 'Roberto', apellidos: 'Vasquez', telefono: '+502 4789-0123', correo: 'roberto.v@email.com', fechaNacimiento: new Date('1970-01-14'), numeroIdentidad: '7890123456017', activo: false, fechaCreacion: new Date('2026-01-17') }
  ];

  doctores: Doctor[] = [
    { medicoId: 1, usuarioId: 2, salaPredeterminadaId: 1, nombrePublico: 'Dr. Carlos Mendez', duracionIntervaloMinutos: 10, duracionDefaultMinutos: 30, minutosBuffer: 0, activo: true },
    { medicoId: 2, usuarioId: 3, salaPredeterminadaId: 5, nombrePublico: 'Dra. Ana Martinez', duracionIntervaloMinutos: 10, duracionDefaultMinutos: 30, minutosBuffer: 0, activo: true },
    { medicoId: 3, usuarioId: 4, salaPredeterminadaId: 2, nombrePublico: 'Dr. Roberto Silva', duracionIntervaloMinutos: 15, duracionDefaultMinutos: 45, minutosBuffer: 5, activo: true },
    { medicoId: 4, usuarioId: 5, salaPredeterminadaId: 7, nombrePublico: 'Dra. Patricia Ruiz', duracionIntervaloMinutos: 10, duracionDefaultMinutos: 30, minutosBuffer: 0, activo: true },
    { medicoId: 5, usuarioId: 6, salaPredeterminadaId: 3, nombrePublico: 'Dr. Luis Hernandez', duracionIntervaloMinutos: 15, duracionDefaultMinutos: 45, minutosBuffer: 5, activo: true },
    { medicoId: 6, usuarioId: 7, salaPredeterminadaId: 8, nombrePublico: 'Dra. Laura Castillo', duracionIntervaloMinutos: 10, duracionDefaultMinutos: 30, minutosBuffer: 0, activo: true }
  ];

  doctorEspecialidades: DoctorEspecialidad[] = [
    { medicoId: 1, especialidadId: 1, principal: true },
    { medicoId: 2, especialidadId: 2, principal: true },
    { medicoId: 3, especialidadId: 3, principal: true },
    { medicoId: 4, especialidadId: 4, principal: true },
    { medicoId: 5, especialidadId: 5, principal: true },
    { medicoId: 6, especialidadId: 6, principal: true }
  ];

  horariosDoctor: HorarioDoctor[] = [
    { horarioId: 1, medicoId: 1, diaSemana: 1, horaInicio: '08:00', horaFin: '16:00', activo: true },
    { horarioId: 2, medicoId: 1, diaSemana: 2, horaInicio: '08:00', horaFin: '16:00', activo: true },
    { horarioId: 3, medicoId: 1, diaSemana: 3, horaInicio: '08:00', horaFin: '16:00', activo: true },
    { horarioId: 4, medicoId: 2, diaSemana: 1, horaInicio: '07:00', horaFin: '15:00', activo: true },
    { horarioId: 5, medicoId: 2, diaSemana: 2, horaInicio: '07:00', horaFin: '15:00', activo: true },
    { horarioId: 6, medicoId: 2, diaSemana: 4, horaInicio: '07:00', horaFin: '15:00', activo: true },
    { horarioId: 7, medicoId: 3, diaSemana: 1, horaInicio: '09:00', horaFin: '17:00', activo: true },
    { horarioId: 8, medicoId: 3, diaSemana: 3, horaInicio: '09:00', horaFin: '17:00', activo: true },
    { horarioId: 9, medicoId: 3, diaSemana: 5, horaInicio: '09:00', horaFin: '17:00', activo: true },
    { horarioId: 10, medicoId: 4, diaSemana: 1, horaInicio: '08:00', horaFin: '16:00', activo: true },
    { horarioId: 11, medicoId: 4, diaSemana: 2, horaInicio: '08:00', horaFin: '16:00', activo: true },
    { horarioId: 12, medicoId: 4, diaSemana: 4, horaInicio: '08:00', horaFin: '16:00', activo: true },
    { horarioId: 13, medicoId: 5, diaSemana: 1, horaInicio: '07:30', horaFin: '15:30', activo: true },
    { horarioId: 14, medicoId: 5, diaSemana: 3, horaInicio: '07:30', horaFin: '15:30', activo: true },
    { horarioId: 15, medicoId: 5, diaSemana: 5, horaInicio: '07:30', horaFin: '15:30', activo: true },
    { horarioId: 16, medicoId: 6, diaSemana: 2, horaInicio: '08:30', horaFin: '16:30', activo: true },
    { horarioId: 17, medicoId: 6, diaSemana: 3, horaInicio: '08:30', horaFin: '16:30', activo: true },
    { horarioId: 18, medicoId: 6, diaSemana: 4, horaInicio: '08:30', horaFin: '16:30', activo: true }
  ];

  solicitudes: SolicitudCita[] = [
    { solicitudId: 1, pacienteId: 1, medicoId: 1, fechaHoraInicio: new Date('2026-03-09T09:00'), duracionMinutos: 30, motivo: 'Control cardiologico', estadoId: 3, fechaCreacion: new Date('2026-03-01') },
    { solicitudId: 2, pacienteId: 2, medicoId: 2, fechaHoraInicio: new Date('2026-03-09T10:00'), duracionMinutos: 30, motivo: 'Consulta pediatrica', estadoId: 1, fechaCreacion: new Date('2026-03-01') },
    { solicitudId: 3, pacienteId: 3, medicoId: 3, fechaHoraInicio: new Date('2026-03-10T11:00'), duracionMinutos: 45, motivo: 'Evaluacion dermatologica', estadoId: 3, fechaCreacion: new Date('2026-03-02') },
    { solicitudId: 4, pacienteId: 4, medicoId: 4, fechaHoraInicio: new Date('2026-03-10T09:00'), duracionMinutos: 30, motivo: 'Consulta ginecologica', estadoId: 1, fechaCreacion: new Date('2026-03-02') },
    { solicitudId: 5, pacienteId: 5, medicoId: 1, fechaHoraInicio: new Date('2026-03-11T14:00'), duracionMinutos: 30, motivo: 'Electrocardiograma', estadoId: 2, fechaCreacion: new Date('2026-03-03') },
    { solicitudId: 6, pacienteId: 6, medicoId: 5, fechaHoraInicio: new Date('2026-03-11T10:00'), duracionMinutos: 45, motivo: 'Dolor en rodilla', estadoId: 3, fechaCreacion: new Date('2026-03-03') },
    { solicitudId: 7, pacienteId: 8, medicoId: 6, fechaHoraInicio: new Date('2026-03-12T09:00'), duracionMinutos: 30, motivo: 'Evaluacion neurologica', estadoId: 5, fechaCreacion: new Date('2026-03-04') },
    { solicitudId: 8, pacienteId: 9, medicoId: 2, fechaHoraInicio: new Date('2026-03-12T08:00'), duracionMinutos: 30, motivo: 'Vacunacion', estadoId: 1, fechaCreacion: new Date('2026-03-04') }
  ];

  propuestas: PropuestaReprogramacion[] = [
    { propuestaId: 1, solicitudId: 5, opcionInicio: new Date('2026-03-12T14:00'), opcionFin: new Date('2026-03-12T14:30'), duracionMinutos: 30, seleccionada: false, fechaCreacion: new Date('2026-03-05') },
    { propuestaId: 2, solicitudId: 5, opcionInicio: new Date('2026-03-13T09:00'), opcionFin: new Date('2026-03-13T09:30'), duracionMinutos: 30, seleccionada: false, fechaCreacion: new Date('2026-03-05') }
  ];

  citas: Cita[] = [
    { citaId: 1, solicitudId: 1, pacienteId: 1, medicoId: 1, salaId: 1, inicio: new Date('2026-03-09T09:00'), fin: new Date('2026-03-09T09:30'), duracionMinutos: 30, estadoId: 1, creadaPorUsuarioId: 1, fechaCreacion: new Date('2026-03-06') },
    { citaId: 2, solicitudId: 3, pacienteId: 3, medicoId: 3, salaId: 2, inicio: new Date('2026-03-10T11:00'), fin: new Date('2026-03-10T11:45'), duracionMinutos: 45, estadoId: 1, creadaPorUsuarioId: 1, fechaCreacion: new Date('2026-03-06') },
    { citaId: 3, solicitudId: 6, pacienteId: 6, medicoId: 5, salaId: 3, inicio: new Date('2026-03-11T10:00'), fin: new Date('2026-03-11T10:45'), duracionMinutos: 45, estadoId: 2, creadaPorUsuarioId: 1, fechaCreacion: new Date('2026-03-06') },
    { citaId: 4, pacienteId: 2, medicoId: 2, salaId: 5, inicio: new Date('2026-03-07T10:00'), fin: new Date('2026-03-07T10:30'), duracionMinutos: 30, estadoId: 3, creadaPorUsuarioId: 1, fechaCreacion: new Date('2026-03-01') },
    { citaId: 5, pacienteId: 4, medicoId: 4, salaId: 7, inicio: new Date('2026-03-07T09:00'), fin: new Date('2026-03-07T09:30'), duracionMinutos: 30, estadoId: 3, creadaPorUsuarioId: 1, fechaCreacion: new Date('2026-03-01') },
    { citaId: 6, pacienteId: 5, medicoId: 1, salaId: 1, inicio: new Date('2026-03-07T14:00'), fin: new Date('2026-03-07T14:30'), duracionMinutos: 30, estadoId: 4, creadaPorUsuarioId: 1, fechaCreacion: new Date('2026-03-02') },
    { citaId: 7, pacienteId: 8, medicoId: 6, salaId: 8, inicio: new Date('2026-03-08T09:00'), fin: new Date('2026-03-08T09:30'), duracionMinutos: 30, estadoId: 5, creadaPorUsuarioId: 1, fechaCreacion: new Date('2026-03-03') },
    { citaId: 8, pacienteId: 9, medicoId: 2, salaId: 5, inicio: new Date('2026-03-12T08:00'), fin: new Date('2026-03-12T08:30'), duracionMinutos: 30, estadoId: 1, creadaPorUsuarioId: 1, fechaCreacion: new Date('2026-03-05') },
    { citaId: 9, pacienteId: 1, medicoId: 4, salaId: 7, inicio: new Date('2026-03-13T09:00'), fin: new Date('2026-03-13T09:30'), duracionMinutos: 30, estadoId: 1, creadaPorUsuarioId: 1, fechaCreacion: new Date('2026-03-06') },
    { citaId: 10, pacienteId: 6, medicoId: 3, salaId: 2, inicio: new Date('2026-03-14T15:00'), fin: new Date('2026-03-14T15:45'), duracionMinutos: 45, estadoId: 1, creadaPorUsuarioId: 1, fechaCreacion: new Date('2026-03-06') }
  ];

  consultas: Consulta[] = [
    { consultaId: 1, citaId: 4, motivo: 'Consulta pediatrica', notas: 'Paciente con cuadro gripal leve. Se recomienda reposo.', tratamiento: 'Acetaminofen 500mg cada 8h por 5 dias', fecha: new Date('2026-03-07T10:30') },
    { consultaId: 2, citaId: 5, motivo: 'Consulta ginecologica', notas: 'Control prenatal normal. Signos vitales estables.', tratamiento: 'Acido folico 5mg diario. Proxima cita en 4 semanas.', fecha: new Date('2026-03-07T09:30') },
    { consultaId: 3, citaId: 6, motivo: 'Electrocardiograma', notas: 'Paciente cancelo por motivos personales.', fecha: new Date('2026-03-07T14:00') },
    { consultaId: 4, citaId: 7, motivo: 'Evaluacion neurologica', notas: 'Paciente no se presento a la cita.', fecha: new Date('2026-03-08T09:00') }
  ];
}
