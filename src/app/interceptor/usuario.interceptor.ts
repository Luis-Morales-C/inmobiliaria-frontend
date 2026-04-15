import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../servicios/auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

// 🔥 Función para validar expiración del token
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // convertir a milisegundos
    return Date.now() > exp;
  } catch (e) {
    return true; // si falla, lo tratamos como expirado
  }
}

export const usuarioInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // ✅ No interceptar login o registro
  if (req.url.includes('/api/auth') || req.url.includes('/api/usuarios')) {
    return next(req);
  }

  const token = authService.getToken();

  // ✅ Si no hay token, continuar normal
  if (!token) {
    return next(req);
  }

  // 🔥 Validar si el token ya expiró ANTES de enviar la request
  if (isTokenExpired(token)) {
    console.warn('Token expirado (frontend)');
    authService.logout();
    router.navigate(['/login']);
    return next(req);
  }

  // ✅ Clonar request y agregar Authorization
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq).pipe(
    catchError((error) => {

      // 🔥 Manejo de token inválido o expirado desde backend
      if (error.status === 401) {
        console.warn('Token inválido o expirado (backend)');
        authService.logout();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
