import { HttpInterceptorFn } from '@angular/common/http';

import { inject } from '@angular/core';
import { AuthService } from '../servicios/auth.service';
import {catchError, throwError} from 'rxjs';
import {Router} from '@angular/router';

export const usuarioInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // No aplicar el interceptor a login o registro
  if (req.url.includes('/api/usuarios') || req.url.includes('/api/auth')) {
    return next(req);
  }

  if (!authService.isAuthenticated()) {
    return next(req);
  }

  const token = authService.getToken();

  // ✅ Si el cuerpo es FormData, no tocar los headers de Content-Type
  let authReq = req;
  if (req.body instanceof FormData) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
