import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ERROR_CODES } from '../../shared/error-codes';

export interface ErrorDisplay {
  codigo: number;
  clave: string;
  mensaje: string;
  tipo: 'error' | 'warning' | 'success' | 'info';
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  private router = inject(Router);
  
  readonly errores = signal<ErrorDisplay[]>([]);
  readonly tieneErrores = signal(false);

  private httpErrorMap: Record<number, { clave: string; mensaje: string }> = {
    400: { clave: 'BAD_REQUEST', mensaje: 'Solicitud incorrecta.' },
    401: { clave: 'UNAUTHORIZED', mensaje: 'Sesión expirada.' },
    403: { clave: 'FORBIDDEN', mensaje: 'Sin permisos.' },
    404: { clave: 'NOT_FOUND', mensaje: 'Recurso no encontrado.' },
    409: { clave: 'CONFLICT', mensaje: 'Conflicto de datos.' },
    500: { clave: 'SERVER_ERROR', mensaje: 'Error del servidor.' },
    502: { clave: 'BAD_GATEWAY', mensaje: 'Error de conexión.' },
    503: { clave: 'SERVICE_UNAVAILABLE', mensaje: 'Servicio no disponible.' },
  };

  handle(error: unknown): ErrorDisplay {
    let errorDisplay: ErrorDisplay;

    if (error instanceof HttpErrorResponse) {
      errorDisplay = this.handleHttpError(error);
    } else if (error instanceof Error) {
      errorDisplay = this.handleJsError(error);
    } else {
      errorDisplay = this.handleUnknownError();
    }

    this.agregarError(errorDisplay);
    return errorDisplay;
  }

  private handleHttpError(error: HttpErrorResponse): ErrorDisplay {
    const mapped = this.httpErrorMap[error.status];
    
    if (mapped) {
      if (error.status === 401) this.router.navigate(['/login']);
      return this.crearError(error.status, mapped.clave, mapped.mensaje);
    }

    if (error.error?.mensaje) {
      return this.crearError(error.status || 5000, 'SERVER_ERROR', error.error.mensaje);
    }

    return this.crearError(5000, 'SYS_UNKNOWN', 'Error de conexión.');
  }

  private handleJsError(error: Error): ErrorDisplay {
    const msg = error.message || 'Error desconocido';
    
    if (msg.includes('timeout') || msg.includes('Timeout')) {
      return this.crearError(ERROR_CODES.CONN_TIMEOUT, 'CONN_TIMEOUT', 'Tiempo de conexión agotado.');
    }

    if (msg.includes('network') || msg.includes('Network')) {
      return this.crearError(ERROR_CODES.CONN_OFFLINE, 'CONN_OFFLINE', 'Sin conexión a internet.');
    }

    return this.crearError(5000, 'SYS_UNKNOWN', msg);
  }

  private handleUnknownError(): ErrorDisplay {
    return this.crearError(ERROR_CODES.SYS_UNKNOWN, 'SYS_UNKNOWN', 'Error desconocido.');
  }

  private crearError(codigo: number, clave: string, mensaje: string): ErrorDisplay {
    return { codigo, clave, mensaje, tipo: 'error', timestamp: new Date() };
  }

  agregarError(error: ErrorDisplay): void {
    this.errores.update(errores => [...errores, error]);
    this.tieneErrores.set(true);
    setTimeout(() => this.eliminarError(error), 8000);
  }

  eliminarError(error: ErrorDisplay): void {
    this.errores.update(errores => errores.filter(e => e !== error));
    if (this.errores().length === 0) this.tieneErrores.set(false);
  }

  limpiarErrores(): void {
    this.errores.set([]);
    this.tieneErrores.set(false);
  }

  showError(codigo: number, mensaje: string, clave = 'CUSTOM_ERROR'): void {
    this.agregarError(this.crearError(codigo, clave, mensaje));
  }

  showSuccess(mensaje: string): void {
    this.agregarError({ codigo: 0, clave: 'SUCCESS', mensaje, tipo: 'success', timestamp: new Date() });
    setTimeout(() => this.eliminarPorClave('SUCCESS'), 5000);
  }

  showWarning(mensaje: string): void {
    this.agregarError({ codigo: 0, clave: 'WARNING', mensaje, tipo: 'warning', timestamp: new Date() });
    setTimeout(() => this.eliminarPorClave('WARNING'), 6000);
  }

  showInfo(mensaje: string): void {
    this.agregarError({ codigo: 0, clave: 'INFO', mensaje, tipo: 'info', timestamp: new Date() });
    setTimeout(() => this.eliminarPorClave('INFO'), 5000);
  }

  private eliminarPorClave(clave: string): void {
    const errores = this.errores();
    const target = errores.find(e => e.clave === clave);
    if (target) this.eliminarError(target);
  }
}
