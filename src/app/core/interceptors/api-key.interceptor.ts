import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl) || req.url.includes('cloudinary.com')) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        'XApiKey': environment.apiKey
      }
    })
  );
};
