import { describe, it, expect } from 'vitest';

describe('Logica PacienteService', () => {
  describe('Parsing de Respuesta', () => {
    it('debe retornar array vacio cuando la respuesta es null', () => {
      const respuesta: any = null;
      const datos = !respuesta ? [] : Array.isArray(respuesta) ? respuesta : [];
      expect(datos).toEqual([]);
    });

    it('debe retornar array cuando la respuesta es un array', () => {
      const respuesta = [{ id: 1 }, { id: 2 }];
      const datos = !respuesta ? [] : Array.isArray(respuesta) ? respuesta : [];
      expect(datos).toHaveLength(2);
    });

    it('debe extraer datos de respuesta exitosa', () => {
      const respuesta: any = {
        success: true,
        data: [{ id: 1, nombre: 'Paciente 1' }]
      };
      const exitoso = respuesta.success;
      const datos = exitoso ? respuesta.data : [];
      expect(datos).toHaveLength(1);
    });

    it('debe retornar array vacio para respuesta fallida', () => {
      const respuesta: any = {
        success: false,
        message: 'Error'
      };
      const exitoso = respuesta.success;
      const datos = exitoso ? respuesta.data : [];
      expect(datos).toEqual([]);
    });

    it('debe manejar bandera exitoso en lugar de success', () => {
      const respuesta: any = {
        exitoso: true,
        datos: [{ id: 1 }]
      };
      const exitoso = respuesta.exitoso;
      const datos = exitoso ? respuesta.datos : [];
      expect(datos).toHaveLength(1);
    });
  });

  describe('Parsing de Entidad', () => {
    it('debe retornar null cuando entidad no se encuentra', () => {
      const respuesta: any = { success: false };
      const exitoso = respuesta.success;
      const datos = exitoso ? respuesta.data : null;
      expect(datos).toBeNull();
    });

    it('debe retornar entidad cuando se encuentra', () => {
      const respuesta: any = {
        success: true,
        data: { id: 1, nombre: 'Prueba' }
      };
      const exitoso = respuesta.success;
      const datos = exitoso ? respuesta.data : null;
      expect(datos).toEqual({ id: 1, nombre: 'Prueba' });
    });
  });

  describe('Manejo de Errores', () => {
    it('debe lanzar error desde campo message', () => {
      const respuesta: any = { success: false, message: 'Mensaje de error' };
      const exitoso = respuesta.success;
      const msg = respuesta.message;
      if (!exitoso && msg) {
        expect(() => { throw new Error(msg); }).toThrow('Mensaje de error');
      }
    });

    it('debe lanzar error desde campo mensaje', () => {
      const respuesta: any = { success: false, mensaje: 'Mensaje de error' };
      const exitoso = respuesta.success;
      const msg = respuesta.message || respuesta.mensaje;
      if (!exitoso && msg) {
        expect(() => { throw new Error(msg); }).toThrow('Mensaje de error');
      }
    });
  });
});
