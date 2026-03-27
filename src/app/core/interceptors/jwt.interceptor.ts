import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const urlsExcluidas = ['/Accesos/Login', '/Accesos/Usuarios/Insertar', '/Publicas/Insertar'];
  const debeOmitir = urlsExcluidas.some(url => req.url.includes(url));
  
  if (debeOmitir || req.url.includes('cloudinary.com')) {
    return next(req);
  }

  const token = localStorage.getItem('token');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuarioId');
        localStorage.removeItem('rolId');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
