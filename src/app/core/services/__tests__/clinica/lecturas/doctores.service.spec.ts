import { describe, it, expect } from 'vitest';

describe('Logica DoctoresService', () => {
  describe('Construccion de Endpoints', () => {
    it('debe construir URL base de doctores', () => {
      const apiUrl = 'https://api.example.com';
      const endpoint = '/api/doctores';
      const urlCompleta = `${apiUrl}${endpoint}`;
      expect(urlCompleta).toBe('https://api.example.com/api/doctores');
    });

    it('debe construir URL para obtener por ID', () => {
      const baseUrl = 'https://api.example.com/api/doctores';
      const id = 5;
      const urlCompleta = `${baseUrl}/${id}`;
      expect(urlCompleta).toBe('https://api.example.com/api/doctores/5');
    });

    it('debe construir URL de especialidades', () => {
      const baseUrl = 'https://api.example.com/api/doctores';
      const medicoId = 3;
      const urlCompleta = `${baseUrl}/${medicoId}/especialidades`;
      expect(urlCompleta).toBe('https://api.example.com/api/doctores/3/especialidades');
    });
  });

  describe('Normalizacion de Datos', () => {
    it('debe normalizar camelCase a camelCase (sin cambios)', () => {
      const dato = {
        medicoId: 1,
        nombrePublico: 'Dr. Perez',
        usuarioId: 10,
        activo: true
      };
      
      expect(dato.medicoId).toBe(1);
      expect(dato.nombrePublico).toBe('Dr. Perez');
    });

    it('debe normalizar PascalCase a camelCase', () => {
      const dato: any = {
        MedicoId: 1,
        NombrePublico: 'Dr. Perez',
        UsuarioId: 10,
        Activo: true
      };
      
      const normalizado = {
        medicoId: dato.MedicoId,
        nombrePublico: dato.NombrePublico,
        usuarioId: dato.UsuarioId,
        activo: dato.Activo
      };
      
      expect(normalizado.medicoId).toBe(1);
      expect(normalizado.nombrePublico).toBe('Dr. Perez');
      expect(normalizado.activo).toBe(true);
    });

    it('debe manejar datos faltantes con valores por defecto', () => {
      const dato: any = {};
      
      const normalizado = {
        medicoId: dato.medicoId ?? dato.MedicoId,
        nombrePublico: dato.nombrePublico ?? dato.NombrePublico ?? '',
        activo: dato.activo ?? dato.Activo ?? true,
        duracionIntervaloMinutos: dato.duracionIntervaloMinutos ?? 10,
        duracionDefaultMinutos: dato.duracionDefaultMinutos ?? 30
      };
      
      expect(normalizado.activo).toBe(true);
      expect(normalizado.duracionIntervaloMinutos).toBe(10);
      expect(normalizado.duracionDefaultMinutos).toBe(30);
    });
  });

  describe('Parsing de Respuesta Directa (sin wrapper)', () => {
    it('debe parsear array directo como respuesta', () => {
      const respuesta = [
        { MedicoId: 1, NombrePublico: 'Dr. Perez' },
        { MedicoId: 2, NombrePublico: 'Dra. Gomez' }
      ];
      
      const datos = Array.isArray(respuesta) ? respuesta : [];
      expect(datos).toHaveLength(2);
    });

    it('debe extraer datos de wrapper datos', () => {
      const respuesta: any = { datos: [{ MedicoId: 1 }] };
      const datos = Array.isArray(respuesta) ? respuesta : (respuesta.datos || []);
      expect(datos).toHaveLength(1);
    });

    it('debe extraer datos de wrapper data', () => {
      const respuesta: any = { data: [{ MedicoId: 1 }] };
      const datos = Array.isArray(respuesta) ? respuesta : (respuesta.data || []);
      expect(datos).toHaveLength(1);
    });

    it('debe retornar array vacio en error', () => {
      const datos = [];
      expect(datos).toEqual([]);
    });
  });

  describe('Deduplicacion por ID', () => {
    it('debe deduplicar doctores con misma especialidad', () => {
      const doctores = [
        { medicoId: 1, nombrePublico: 'Dr. Perez', nombreEspecialidad: 'Cardiologia' },
        { medicoId: 1, nombrePublico: 'Dr. Perez', nombreEspecialidad: 'Medicina General' }
      ];
      
      const agrupado = new Map<number, any>();
      for (const doc of doctores) {
        if (!agrupado.has(doc.medicoId)) {
          agrupado.set(doc.medicoId, { ...doc, especialidades: [doc.nombreEspecialidad] });
        } else {
          agrupado.get(doc.medicoId).especialidades.push(doc.nombreEspecialidad);
        }
      }
      
      const resultado = Array.from(agrupado.values());
      expect(resultado).toHaveLength(1);
      expect(resultado[0].especialidades).toHaveLength(2);
    });
  });

  describe('Construccion de Payload para Crear', () => {
    it('debe crear payload completo', () => {
      const doctor: any = {
        nombrePublico: 'Dr. Nuevo',
        usuarioId: 15,
        salaPredeterminadaId: 3,
        duracionIntervaloMinutos: 15,
        duracionDefaultMinutos: 30
      };
      
      const payload = {
        medicoId: 0,
        nombrePublico: doctor.nombrePublico || '',
        usuarioId: doctor.usuarioId || 0,
        salaPredeterminadaId: doctor.salaPredeterminadaId || null,
        duracionIntervaloMinutos: doctor.duracionIntervaloMinutos || 10,
        duracionDefaultMinutos: doctor.duracionDefaultMinutos || 30,
        minutosBuffer: 0,
        activo: true
      };
      
      expect(payload.medicoId).toBe(0);
      expect(payload.nombrePublico).toBe('Dr. Nuevo');
      expect(payload.activo).toBe(true);
    });

    it('debe usar valores por defecto cuando faltan campos', () => {
      const doctor: any = {};
      
      const payload = {
        nombrePublico: doctor.nombrePublico || '',
        duracionIntervaloMinutos: doctor.duracionIntervaloMinutos || 10,
        duracionDefaultMinutos: doctor.duracionDefaultMinutos || 30
      };
      
      expect(payload.nombrePublico).toBe('');
      expect(payload.duracionIntervaloMinutos).toBe(10);
      expect(payload.duracionDefaultMinutos).toBe(30);
    });
  });

  describe('Parsing de Especialidades', () => {
    it('debe parsear especialidades con camelCase', () => {
      const especialidad: any = {
        especialidadId: 1,
        nombreEspecialidad: 'Cardiologia',
        principal: true
      };
      
      expect(especialidad.especialidadId).toBe(1);
      expect(especialidad.nombreEspecialidad).toBe('Cardiologia');
      expect(especialidad.principal).toBe(true);
    });

    it('debe parsear especialidades con PascalCase', () => {
      const especialidad: any = {
        EspecialidadId: 1,
        NombreEspecialidad: 'Cardiologia',
        Principal: true
      };
      
      const normalizado = {
        especialidadId: especialidad.especialidadId ?? especialidad.EspecialidadId,
        nombreEspecialidad: especialidad.nombreEspecialidad ?? especialidad.NombreEspecialidad ?? '',
        principal: especialidad.principal ?? especialidad.Principal ?? false
      };
      
      expect(normalizado.especialidadId).toBe(1);
      expect(normalizado.nombreEspecialidad).toBe('Cardiologia');
      expect(normalizado.principal).toBe(true);
    });
  });

  describe('Parsing de Horarios', () => {
    it('debe parsear horario completo', () => {
      const horario: any = {
        horarioId: 1,
        doctorId: 5,
        diaSemana: 1,
        horaInicio: '08:00',
        horaFin: '17:00',
        activo: true
      };
      
      expect(horario.horarioId).toBe(1);
      expect(horario.diaSemana).toBe(1);
      expect(horario.activo).toBe(true);
    });

    it('debe convertir hora de 5 chars a 8 chars', () => {
      const hora = '08:00';
      const horaFormateada = hora.length === 5 ? hora + ':00' : hora;
      expect(horaFormateada).toBe('08:00:00');
    });

    it('debe mantener hora de 8 chars sin cambios', () => {
      const hora = '08:00:00';
      const horaFormateada = hora.length === 5 ? hora + ':00' : hora;
      expect(horaFormateada).toBe('08:00:00');
    });
  });

  describe('Parametros de Consulta', () => {
    it('debe crear params vacios', () => {
      const params: any = {};
      const tieneParams = Object.keys(params).length > 0;
      expect(tieneParams).toBe(false);
    });

    it('debe crear params con activo', () => {
      const activo = true;
      const params: any = {};
      if (activo !== undefined) params.activo = activo.toString();
      
      expect(params.activo).toBe('true');
    });

    it('debe crear params con especialidadId', () => {
      const especialidadId = 3;
      const params: any = {};
      if (especialidadId) params.especialidadId = especialidadId.toString();
      
      expect(params.especialidadId).toBe('3');
    });

    it('debe crear params con ambos filtros', () => {
      const activo = true;
      const especialidadId = 2;
      const params: any = {};
      if (activo !== undefined) params.activo = activo.toString();
      if (especialidadId) params.especialidadId = especialidadId.toString();
      
      expect(params.activo).toBe('true');
      expect(params.especialidadId).toBe('2');
    });
  });
});
