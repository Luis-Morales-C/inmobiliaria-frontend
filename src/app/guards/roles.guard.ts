import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../servicios/auth.service';

export const rolesGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  const expectedRoles: string[] = route.data['expectedRoles'];
  const userRoles = authService.decodeTokenRoles();
  console.log('Expected roles:', expectedRoles);
  console.log('User roles:', userRoles);
  const hasRole = expectedRoles.some(role => userRoles.includes(role));
  console.log('Has required role:', hasRole);
  return hasRole ? true : router.createUrlTree(['/unauthorized']);
};