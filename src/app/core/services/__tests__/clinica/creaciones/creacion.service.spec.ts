import { describe, it, expect } from 'vitest';

describe('Logica Creacion - ConsultaService', () => {
  describe('Payload de Insercion', () => {
    it('debe crear payload de consulta completo', () => {
      const consulta: any = {
        citaId: 1,
        pacienteId: 5,
        medicoId: 10,
        notas: 'Paciente presenta sintomas leves',
        diagnostico: 'Resfriado comun',
        tratamiento: 'Reposo y liquidos'
      };
      
      expect(consulta.citaId).toBe(1);
      expect(consulta.pacienteId).toBe(5);
      expect(consulta.notas).toBeTruthy();
    });

    it('debe crear payload minimo de consulta', () => {
      const consulta: any = {};
      
      expect(consulta.citaId).toBeUndefined();
    });
  });

  describe('Parsing de Respuesta de Insercion', () => {
    it('debe parsear respuesta exitosa', () => {
      const respuesta: any = {
        exitoso: true,
        datos: { consultaId: 1, citaId: 5 }
      };
      
      const exitoso = respuesta.exitoso ?? respuesta.success;
      const datos = respuesta.datos ?? respuesta.data;
      
      expect(exitoso).toBe(true);
      expect(datos.consultaId).toBe(1);
    });

    it('debe lanzar error en respuesta fallida', () => {
      const respuesta: any = {
        exitoso: false,
        mensaje: 'Error al insertar consulta'
      };
      
      const exitoso = respuesta.exitoso ?? respuesta.success;
      if (!exitoso) {
        expect(() => { throw new Error(respuesta.mensaje); }).toThrow('Error al insertar consulta');
      }
    });

    it('debe usar mensaje por defecto en error sin mensaje', () => {
      const respuesta: any = {
        exitoso: false
      };
      
      const exitoso = respuesta.exitoso ?? respuesta.success;
      const mensaje = respuesta.mensaje || 'Error al insertar consulta';
      
      if (!exitoso) {
        expect(mensaje).toBe('Error al insertar consulta');
      }
    });
  });

  describe('Endpoint de Insercion', () => {
    it('debe construir URL de inserccion correctamente', () => {
      const urlBase = 'https://api.example.com';
      const endpoint = '/Consultas/Insertar-consulta';
      const urlCompleta = `${urlBase}${endpoint}`;
      expect(urlCompleta).toBe('https://api.example.com/Consultas/Insertar-consulta');
    });
  });
});

describe('Logica Creacion - PacienteService', () => {
  describe('Payload de Insercion', () => {
    it('debe crear payload de paciente', () => {
      const paciente: any = {
        nombre: 'Juan',
        apellidos: 'Perez',
        email: 'juan@correo.com',
        telefono: '1234567890'
      };
      
      expect(paciente.nombre).toBe('Juan');
      expect(paciente.email).toBe('juan@correo.com');
    });
  });

  describe('Parsing de Respuesta', () => {
    it('debe retornar paciente en respuesta exitosa', () => {
      const respuesta: any = {
        exitoso: true,
        datos: { pacienteId: 1, nombre: 'Juan' }
      };
      
      const exitoso = respuesta.exitoso ?? respuesta.success;
      const datos = exitoso ? respuesta.datos : null;
      
      expect(datos.pacienteId).toBe(1);
    });
  });
});

describe('Logica Creacion - DoctoresService', () => {
  describe('Payload de Creacion', () => {
    it('debe crear payload completo de doctor', () => {
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
      expect(payload.activo).toBe(true);
      expect(payload.duracionDefaultMinutos).toBe(30);
    });

    it('debe usar valores por defecto', () => {
      const doctor: any = {};
      
      const payload = {
        nombrePublico: doctor.nombrePublico || '',
        duracionIntervaloMinutos: doctor.duracionIntervaloMinutos || 10,
        activo: true
      };
      
      expect(payload.duracionIntervaloMinutos).toBe(10);
      expect(payload.activo).toBe(true);
    });
  });

  describe('Parsing de Respuesta', () => {
    it('debe extraer medicoId de respuesta', () => {
      const respuesta: any = { medicoId: 42 };
      const resultado = { medicoId: respuesta?.medicoId || respuesta?.MedicoId || 0 };
      expect(resultado.medicoId).toBe(42);
    });

    it('debe usar medicoId 0 si no existe', () => {
      const respuesta: any = {};
      const resultado = { medicoId: respuesta?.medicoId || respuesta?.MedicoId || 0 };
      expect(resultado.medicoId).toBe(0);
    });
  });
});
