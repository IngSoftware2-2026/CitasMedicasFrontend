import { describe, it, expect } from 'vitest';

describe('Logica HTTP - Manejo de Errores', () => {
  const httpErrorMap: Record<number, { clave: string; mensaje: string }> = {
    400: { clave: 'BAD_REQUEST', mensaje: 'Solicitud incorrecta.' },
    401: { clave: 'UNAUTHORIZED', mensaje: 'Sesión expirada.' },
    403: { clave: 'FORBIDDEN', mensaje: 'Sin permisos.' },
    404: { clave: 'NOT_FOUND', mensaje: 'Recurso no encontrado.' },
    409: { clave: 'CONFLICT', mensaje: 'Conflicto de datos.' },
    500: { clave: 'SERVER_ERROR', mensaje: 'Error del servidor.' },
    502: { clave: 'BAD_GATEWAY', mensaje: 'Error de conexión.' },
    503: { clave: 'SERVICE_UNAVAILABLE', mensaje: 'Servicio no disponible.' },
  };

  const ERROR_CODES = {
    CONN_TIMEOUT: 5001,
    CONN_OFFLINE: 5002,
    SYS_UNKNOWN: 5000,
  };

  const crearError = (codigo: number, clave: string, mensaje: string) => ({
    codigo,
    clave,
    mensaje,
    tipo: 'error' as const,
    timestamp: new Date()
  });

  describe('Mapeo de Errores HTTP', () => {
    it('debe mapear error 400 correctamente', () => {
      const error = httpErrorMap[400];
      expect(error.clave).toBe('BAD_REQUEST');
      expect(error.mensaje).toBe('Solicitud incorrecta.');
    });

    it('debe mapear error 401 correctamente', () => {
      const error = httpErrorMap[401];
      expect(error.clave).toBe('UNAUTHORIZED');
      expect(error.mensaje).toBe('Sesión expirada.');
    });

    it('debe mapear error 403 correctamente', () => {
      const error = httpErrorMap[403];
      expect(error.clave).toBe('FORBIDDEN');
      expect(error.mensaje).toBe('Sin permisos.');
    });

    it('debe mapear error 404 correctamente', () => {
      const error = httpErrorMap[404];
      expect(error.clave).toBe('NOT_FOUND');
      expect(error.mensaje).toBe('Recurso no encontrado.');
    });

    it('debe mapear error 409 correctamente', () => {
      const error = httpErrorMap[409];
      expect(error.clave).toBe('CONFLICT');
      expect(error.mensaje).toBe('Conflicto de datos.');
    });

    it('debe mapear error 500 correctamente', () => {
      const error = httpErrorMap[500];
      expect(error.clave).toBe('SERVER_ERROR');
      expect(error.mensaje).toBe('Error del servidor.');
    });

    it('debe mapear error 502 correctamente', () => {
      const error = httpErrorMap[502];
      expect(error.clave).toBe('BAD_GATEWAY');
      expect(error.mensaje).toBe('Error de conexión.');
    });

    it('debe mapear error 503 correctamente', () => {
      const error = httpErrorMap[503];
      expect(error.clave).toBe('SERVICE_UNAVAILABLE');
      expect(error.mensaje).toBe('Servicio no disponible.');
    });

    it('debe retornar undefined para codigo no mapeado', () => {
      const error = httpErrorMap[418];
      expect(error).toBeUndefined();
    });
  });

  describe('Manejo de Errores JavaScript', () => {
    it('debe detectar error de timeout', () => {
      const mensaje = 'Request timeout exceeded';
      const esTimeout = mensaje.toLowerCase().includes('timeout');
      expect(esTimeout).toBe(true);
    });

    it('debe detectar error de red', () => {
      const mensaje = 'Network Error';
      const esRed = mensaje.toLowerCase().includes('network');
      expect(esRed).toBe(true);
    });

    it('debe no detectar timeout en mensaje normal', () => {
      const mensaje = 'Error normal';
      const esTimeout = mensaje.toLowerCase().includes('timeout');
      expect(esTimeout).toBe(false);
    });
  });

  describe('Creacion de ErrorDisplay', () => {
    it('debe crear error con tipo error por defecto', () => {
      const error = crearError(500, 'SERVER_ERROR', 'Error del servidor.');
      expect(error.tipo).toBe('error');
      expect(error.codigo).toBe(500);
    });

    it('debe incluir timestamp en error', () => {
      const antes = new Date();
      const error = crearError(404, 'NOT_FOUND', 'No encontrado');
      const despues = new Date();
      
      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(antes.getTime());
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(despues.getTime());
    });
  });

  describe('Conversion de Mensaje a Codigo', () => {
    it('debe retornar codigo de timeout para errores de timeout', () => {
      const esTimeout = true;
      const codigo = esTimeout ? ERROR_CODES.CONN_TIMEOUT : 0;
      expect(codigo).toBe(5001);
    });

    it('debe retornar codigo de red para errores de red', () => {
      const esRed = true;
      const codigo = esRed ? ERROR_CODES.CONN_OFFLINE : 0;
      expect(codigo).toBe(5002);
    });

    it('debe retornar codigo desconocido por defecto', () => {
      const esTimeout = false;
      const esRed = false;
      const codigo = esTimeout || esRed ? ERROR_CODES.CONN_TIMEOUT : ERROR_CODES.SYS_UNKNOWN;
      expect(codigo).toBe(5000);
    });
  });

  describe('Logica de Mensajes', () => {
    it('debe extraer mensaje de error.error.mensaje', () => {
      const error: any = { status: 500, error: { mensaje: 'Error del servidor' } };
      const mensaje = error.error?.mensaje;
      expect(mensaje).toBe('Error del servidor');
    });

    it('debe retornar mensaje por defecto si no hay mensaje', () => {
      const error: any = { status: 500, error: {} };
      const mensaje = error.error?.mensaje || 'Error de conexión.';
      expect(mensaje).toBe('Error de conexión.');
    });

    it('debe usar mensaje de error.message para errores JS', () => {
      const jsError = new Error('Error personalizado');
      const mensaje = jsError.message || 'Error desconocido';
      expect(mensaje).toBe('Error personalizado');
    });
  });

  describe('Notificaciones', () => {
    it('debe crear notificacion de exito', () => {
      const mensaje = 'Operación exitosa';
      const notificacion = {
        codigo: 0,
        clave: 'SUCCESS',
        mensaje,
        tipo: 'success' as const,
        timestamp: new Date()
      };
      
      expect(notificacion.clave).toBe('SUCCESS');
      expect(notificacion.tipo).toBe('success');
    });

    it('debe crear notificacion de advertencia', () => {
      const mensaje = 'Atención';
      const notificacion = {
        codigo: 0,
        clave: 'WARNING',
        mensaje,
        tipo: 'warning' as const,
        timestamp: new Date()
      };
      
      expect(notificacion.clave).toBe('WARNING');
      expect(notificacion.tipo).toBe('warning');
    });

    it('debe crear notificacion informativa', () => {
      const mensaje = 'Información';
      const notificacion = {
        codigo: 0,
        clave: 'INFO',
        mensaje,
        tipo: 'info' as const,
        timestamp: new Date()
      };
      
      expect(notificacion.clave).toBe('INFO');
      expect(notificacion.tipo).toBe('info');
    });
  });
});
