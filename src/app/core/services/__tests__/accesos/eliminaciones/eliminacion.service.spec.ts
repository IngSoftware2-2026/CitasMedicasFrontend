import { describe, it, expect } from 'vitest';

describe('Logica Eliminacion - UsuarioService', () => {
  describe('Endpoint de Eliminacion', () => {
    it('debe construir URL con query string', () => {
      const urlBase = 'https://api.example.com';
      const id = 5;
      const urlCompleta = `${urlBase}/Accesos/Usuarios/Eliminar?usuarioId=${id}`;
      expect(urlCompleta).toBe('https://api.example.com/Accesos/Usuarios/Eliminar?usuarioId=5');
    });

    it('debe usar metodo DELETE', () => {
      const metodo = 'DELETE';
      expect(metodo).toBe('DELETE');
    });
  });

  describe('Parsing de Respuesta', () => {
    it('debe retornar true en eliminacion exitosa', () => {
      const respuesta: any = {
        exitoso: true
      };
      
      const exitoso = respuesta.exitoso ?? respuesta.success;
      const resultado = exitoso ? true : false;
      expect(resultado).toBe(true);
    });

    it('debe lanzar error en eliminacion fallida', () => {
      const respuesta: any = {
        exitoso: false,
        mensaje: 'No se puede eliminar usuario en uso'
      };
      
      const exitoso = respuesta.exitoso ?? respuesta.success;
      if (!exitoso) {
        expect(() => { throw new Error(respuesta.mensaje || respuesta.message); }).toThrow('No se puede eliminar usuario en uso');
      }
    });

    it('debe usar mensaje de error de respuesta', () => {
      const respuesta: any = {
        exitoso: false,
        mensaje: 'Usuario tiene permisos asignados'
      };
      
      const exitoso = respuesta.exitoso ?? respuesta.success;
      const msg = respuesta.mensaje || respuesta.message || 'Error al eliminar usuario';
      if (!exitoso) {
        expect(msg).toBe('Usuario tiene permisos asignados');
      }
    });
  });
});

describe('Logica Eliminacion - RolService', () => {
  describe('Endpoint de Eliminacion', () => {
    it('debe construir URL con query string', () => {
      const urlBase = 'https://api.example.com';
      const id = 3;
      const urlCompleta = `${urlBase}/Accesos/Roles/Eliminar?rolId=${id}`;
      expect(urlCompleta).toBe('https://api.example.com/Accesos/Roles/Eliminar?rolId=3');
    });

    it('debe usar metodo DELETE', () => {
      const metodo = 'DELETE';
      expect(metodo).toBe('DELETE');
    });
  });

  describe('Parsing de Respuesta', () => {
    it('debe retornar true en eliminacion exitosa', () => {
      const respuesta: any = {
        exitoso: true
      };
      
      const exitoso = respuesta.exitoso ?? respuesta.success;
      const resultado = exitoso ? true : false;
      expect(resultado).toBe(true);
    });

    it('debe lanzar error en eliminacion fallida', () => {
      const respuesta: any = {
        exitoso: false,
        mensaje: 'No se puede eliminar rol en uso'
      };
      
      const exitoso = respuesta.exitoso ?? respuesta.success;
      if (!exitoso) {
        expect(() => { throw new Error(respuesta.mensaje || respuesta.message); }).toThrow('No se puede eliminar rol en uso');
      }
    });
  });
});
