import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ErrorHandlerService } from '../services/Http/error-handler.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const errorHandler = inject(ErrorHandlerService);
  const urlsExcluidas = ['/Accesos/Login', '/Accesos/Usuarios/Insertar', '/Publicas/Insertar'];
  const debeOmitir = urlsExcluidas.some(url => req.url.includes(url));
  
  if (debeOmitir || req.url.includes('cloudinary.com')) {
    return next(req);
  }

  const tokenRaw = localStorage.getItem('token');
  const token = tokenRaw?.startsWith('Bearer ') ? tokenRaw.slice(7).trim() : tokenRaw?.trim();

  console.log('[JWT] outgoing request', {
    url: req.url,
    hasToken: !!token,
    tokenPreview: token ? `${token.slice(0, 20)}...` : null
  });
  
  if (token && token.length > 0) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.error('[JWT] 401 response', {
          url: req.url,
          wwwAuthenticate: error.headers?.get('WWW-Authenticate'),
          jwtError: error.headers?.get('X-JWT-Error'),
          body: error.error
        });
        localStorage.removeItem('token');
        localStorage.removeItem('usuarioId');
        localStorage.removeItem('rolId');
        localStorage.removeItem('pacienteId');
        errorHandler.showError(401, 'Tu sesion expiro o no es valida. Inicia sesion nuevamente.');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
