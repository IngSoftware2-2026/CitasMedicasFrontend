import { HttpInterceptorFn } from '@angular/common/http';
import { CLAVE_API } from '../services/Http/conexion.service';

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('API Key Interceptor - URL:', req.url);
  console.log('API Key Interceptor - Method:', req.method);
  
  req = req.clone({
    setHeaders: {
      'XApiKey': CLAVE_API
    }
  });
  
  console.log('API Key enviada:', CLAVE_API);
  
  return next(req);
};
