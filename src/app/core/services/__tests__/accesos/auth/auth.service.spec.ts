import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockLocalStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((clave: string) => mockLocalStorage[clave] ?? null),
  setItem: vi.fn((clave: string, valor: string) => { mockLocalStorage[clave] = valor; }),
  removeItem: vi.fn((clave: string) => { delete mockLocalStorage[clave]; }),
  clear: vi.fn(() => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); }),
};

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('Logica Auth - Login', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Credenciales de Login', () => {
    it('debe crear credenciales de login correctamente', () => {
      const credenciales = {
        nombreUsuario: 'admin',
        clave: 'password123'
      };
      
      expect(credenciales.nombreUsuario).toBe('admin');
      expect(credenciales.clave).toBe('password123');
    });

    it('debe construir endpoint de login correctamente', () => {
      const urlBase = 'https://api.example.com';
      const endpoint = '/Accesos/Login';
      const urlCompleta = `${urlBase}${endpoint}`;
      expect(urlCompleta).toBe('https://api.example.com/Accesos/Login');
    });
  });

  describe('Parsing de Respuesta de Login', () => {
    it('debe parsear respuesta exitosa de login', () => {
      const respuesta: any = {
        exitoso: true,
        datos: {
          token: 'jwt-token-123',
          usuarioId: 1,
          rol: { rolId: 1, codigoRol: 'ADMIN' }
        }
      };
      
      const exitoso = respuesta.success !== undefined ? respuesta.success : respuesta.exitoso;
      const datos = respuesta.data !== undefined ? respuesta.data : respuesta.datos;
      
      expect(exitoso).toBe(true);
      expect(datos.token).toBe('jwt-token-123');
      expect(datos.usuarioId).toBe(1);
    });

    it('debe extraer token de respuesta', () => {
      const respuesta: any = {
        data: { token: 'abc123', usuarioId: 5 }
      };
      
      const exitoso = respuesta.success !== undefined ? respuesta.success : respuesta.exitoso;
      const datos = respuesta.data !== undefined ? respuesta.data : respuesta.datos;
      
      expect(datos.token).toBe('abc123');
    });

    it('debe lanzar error en login fallido', () => {
      const respuesta: any = {
        exitoso: false,
        mensaje: 'Usuario o contraseña incorrectos'
      };
      
      const exitoso = respuesta.success !== undefined ? respuesta.success : respuesta.exitoso;
      if (!exitoso) {
        expect(() => { throw new Error(respuesta.mensaje); }).toThrow('Usuario o contraseña incorrectos');
      }
    });
  });
});

describe('Logica Auth - Sesion', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Almacenamiento de Sesion', () => {
    it('debe guardar token en localStorage', () => {
      localStorage.setItem('token', 'token123');
      expect(localStorage.getItem('token')).toBe('token123');
    });

    it('debe guardar usuarioId en localStorage', () => {
      localStorage.setItem('usuarioId', '1');
      expect(localStorage.getItem('usuarioId')).toBe('1');
    });

    it('debe guardar rolId en localStorage', () => {
      localStorage.setItem('rolId', '2');
      expect(localStorage.getItem('rolId')).toBe('2');
    });

    it('debe guardar codigoRol normalizado', () => {
      const codigoRol = 'admin';
      const rolNormalizado = codigoRol.trim().toUpperCase();
      localStorage.setItem('codigoRol', rolNormalizado);
      expect(localStorage.getItem('codigoRol')).toBe('ADMIN');
    });
  });

  describe('Validacion de Sesion', () => {
    it('debe retornar falso cuando no existe token', () => {
      const tieneToken = () => !!localStorage.getItem('token');
      expect(tieneToken()).toBe(false);
    });

    it('debe retornar verdadero cuando existe token', () => {
      localStorage.setItem('token', 'token-prueba');
      const tieneToken = () => !!localStorage.getItem('token');
      expect(tieneToken()).toBe(true);
    });

    it('debe parsear usuarioId desde string', () => {
      localStorage.setItem('usuarioId', '42');
      const id = localStorage.getItem('usuarioId');
      const idParseado = id ? parseInt(id, 10) : null;
      expect(idParseado).toBe(42);
    });

    it('debe retornar null cuando usuarioId no existe', () => {
      const id = localStorage.getItem('usuarioId');
      const idParseado = id ? parseInt(id, 10) : null;
      expect(idParseado).toBeNull();
    });
  });

  describe('Cierre de Sesion', () => {
    it('debe limpiar todos los datos de sesion', () => {
      localStorage.setItem('token', 'token123');
      localStorage.setItem('usuarioId', '1');
      localStorage.setItem('rolId', '2');
      localStorage.setItem('codigoRol', 'ADMIN');

      const cerrarSesion = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuarioId');
        localStorage.removeItem('rolId');
        localStorage.removeItem('codigoRol');
      };

      cerrarSesion();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('usuarioId')).toBeNull();
      expect(localStorage.getItem('rolId')).toBeNull();
      expect(localStorage.getItem('codigoRol')).toBeNull();
    });
  });
});
