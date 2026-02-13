import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../servicios/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si el usuario está autenticado, permitir el acceso
  // Si no está autenticado, redirigir al login
  return authService.isAuthenticated()
    ? true
    : router.createUrlTree(['/login']);
};
