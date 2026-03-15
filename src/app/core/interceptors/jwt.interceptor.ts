import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const urlsExcluidas = ['/Accesos/Login', '/Accesos/Usuarios/Insertar'];
  const debeOmitir = urlsExcluidas.some(url => req.url.includes(url));
  
  if (debeOmitir) {
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
  
  return next(req);
};
