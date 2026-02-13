import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
@Injectable({
  providedIn: 'root'
})
export class RedireccionService {
  constructor(private router: Router) {}

  /**
   * Redirige al usuario según su rol.
   * @param rol Lista de roles del usuario.
   */
  redirigirSegunRol(rol: string): void {
    if (rol.includes('CLIENTE')) {
      this.router.navigate(['/perfil']);
    } else if (rol.includes('AGENTE')) {
      this.router.navigate(['/ventanaAgente']);
    } else {
      this.router.navigate(['/unauthorized']);
    }
  }

  redirigirALogin() {
    this.router.navigate(['/login']);
  }

  redirigirARegistro() {
    this.router.navigate(['/registro']);
  }

  redirigirARegistroInmueble() {
    this.router.navigate(['/registroInmueble']);
  }

  redirigirAPerfil() {
    this.router.navigate(['/perfil']);
  }

  redirigirAHome() {
    this.router.navigate(['/']);
  }

  redirigirAHomeIngresado() {
    this.router.navigate(['/inicio']);
  }

  redirigirAPoliticaDatos() {
    this.router.navigate(['/politicaDatos']);
  }

}
