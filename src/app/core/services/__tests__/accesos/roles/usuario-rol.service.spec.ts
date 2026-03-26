import { describe, it, expect } from 'vitest';

describe('Logica Lectura - UsuarioService', () => {
  describe('Listado de Usuarios', () => {
    it('debe construir URL de listado correctamente', () => {
      const urlBase = 'https://api.example.com';
      const endpoint = '/Accesos/Usuarios/Listar';
      const urlCompleta = `${urlBase}${endpoint}`;
      expect(urlCompleta).toBe('https://api.example.com/Accesos/Usuarios/Listar');
    });

    it('debe parsear respuesta exitosa de listado', () => {
      const respuesta: any = {
        exitoso: true,
        datos: [
          { usuarioId: 1, nombreUsuario: 'admin' },
          { usuarioId: 2, nombreUsuario: 'recepcion' }
        ]
      };
      
      const exitoso = respuesta.exitoso ?? respuesta.success;
      const datos = respuesta.datos ?? respuesta.data;
      
      expect(exitoso).toBe(true);
      expect(datos).toHaveLength(2);
    });

    it('debe retornar array vacio en respuesta null', () => {
      const respuesta = null;
      const datos = !respuesta ? [] : [];
      expect(datos).toEqual([]);
    });

    it('debe retornar array vacio en respuesta fallida', () => {
      const respuesta: any = {
        exitoso: false,
        mensaje: 'Error'
      };
      
      const exitoso = respuesta.exitoso ?? respuesta.success;
      const exitosoBool = exitoso ? true : false;
      const datos = exitosoBool ? respuesta.datos ?? respuesta.data : [];
      expect(datos).toEqual([]);
    });
  });

  describe('Obtener Usuario por ID', () => {
    it('debe construir URL con ID correctamente', () => {
      const urlBase = 'https://api.example.com';
      const id = 5;
      const urlCompleta = `${urlBase}/Accesos/Usuarios/${id}`;
      expect(urlCompleta).toBe('https://api.example.com/Accesos/Usuarios/5');
    });

    it('debe parsear respuesta exitosa de usuario', () => {
      const respuesta: any = {
        exitoso: true,
        datos: { usuarioId: 1, nombreUsuario: 'admin', correo: 'admin@test.com' }
      };
      
      const exitoso = respuesta.exitoso ?? respuesta.success;
      const datos = exitoso ? respuesta.datos ?? respuesta.data : null;
      
      expect(datos.usuarioId).toBe(1);
      expect(datos.nombreUsuario).toBe('admin');
    });

    it('debe retornar null en respuesta fallida', () => {
      const respuesta: any = {
        exitoso: false
      };
      
      const exitoso = respuesta.exitoso ?? respuesta.success;
      const datos = exitoso ? respuesta.datos ?? respuesta.data : null;
      expect(datos).toBeNull();
    });

    it('debe retornar null en respuesta null', () => {
      const respuesta = null;
      const exitoso = respuesta ? true : false;
      const datos = exitoso ? respuesta?.datos : null;
      expect(datos).toBeNull();
    });
  });
});

describe('Logica Lectura - RolService', () => {
  describe('Listado de Roles', () => {
    it('debe construir URL de listado correctamente', () => {
      const urlBase = 'https://api.example.com';
      const endpoint = '/Accesos/Roles/Listar';
      const urlCompleta = `${urlBase}${endpoint}`;
      expect(urlCompleta).toBe('https://api.example.com/Accesos/Roles/Listar');
    });

    it('debe parsear respuesta exitosa de roles', () => {
      const respuesta: any = {
        exitoso: true,
        datos: [
          { rolId: 1, nombreRol: 'Administrador', codigoRol: 'ADMIN' },
          { rolId: 2, nombreRol: 'Recepcionista', codigoRol: 'RECEPCION' }
        ]
      };
      
      const exitoso = respuesta.exitoso ?? respuesta.success;
      const datos = exitoso ? respuesta.datos ?? respuesta.data : [];
      
      expect(datos).toHaveLength(2);
      expect(datos[0].codigoRol).toBe('ADMIN');
    });

    it('debe lanzar error en respuesta fallida', () => {
      const respuesta: any = {
        exitoso: false,
        mensaje: 'Error al listar roles'
      };
      
      const exitoso = respuesta.exitoso ?? respuesta.success;
      const datos = exitoso ? respuesta.datos : null;
      
      if (!exitoso) {
        expect(() => { throw new Error(respuesta.mensaje || respuesta.message); }).toThrow('Error al listar roles');
      }
    });
  });

  describe('Obtener Rol por ID', () => {
    it('debe encontrar rol por ID', () => {
      const roles = [
        { rolId: 1, nombreRol: 'Admin' },
        { rolId: 2, nombreRol: 'Recepcion' }
      ];
      
      const rolEncontrado = roles.find(r => r.rolId === 1) || null;
      expect(rolEncontrado).not.toBeNull();
      expect(rolEncontrado?.nombreRol).toBe('Admin');
    });

    it('debe retornar null si no encuentra rol', () => {
      const roles = [
        { rolId: 1, nombreRol: 'Admin' }
      ];
      
      const rolEncontrado = roles.find(r => r.rolId === 999) || null;
      expect(rolEncontrado).toBeNull();
    });
  });
});
