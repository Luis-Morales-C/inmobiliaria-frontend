import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import { MapaService } from '../../mapa.service';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { RedireccionService } from '../../servicios/redireccion.service';
import {InmuebleServiceService} from '../../servicios/inmueble-service.service';
import {InmuebleResponse} from '../../dto/inmueble-response';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UserMenuComponent]
})
export class InicioComponent implements OnInit, AfterViewInit {
  isLogged = false;
  usuarioConectado = '';
  userEmail: string | null = null;
  tipoInicio: string = 'INVITADO'; // Puede ser USUARIO, ASESOR, INVITADO, etc.
  userName: string = '';
  inicioDeUsuario = '';
  propiedadesDestacadas: InmuebleResponse[] = [];// Inicializamos como cadena vacía

  constructor(private authService: AuthService, private router: Router, private mapaService: MapaService,protected redireccionamiento:RedireccionService,protected inmuebleService: InmuebleServiceService) {
    this.isLogged = this.authService.isAuthenticated();
    // Utilizar decodeTokenRoles para obtener los roles directamente del token
    const rolesArr = this.authService.decodeTokenRoles();
    console.log('Roles obtenidos en el constructor:', rolesArr);

    // Usar el primer rol disponible o un valor por defecto
    this.usuarioConectado = Array.isArray(rolesArr) && rolesArr.length > 0 ? rolesArr[0] : '';

    if (this.isLogged) {
      this.userEmail = this.authService.getUserEmail();
      this.userName = this.userEmail || 'Usuario';
      this.tipoInicio = this.usuarioConectado; // Asignamos el rol directamente
      this.inicioDeUsuario = this.usuarioConectado; // Asignamos el rol directamente
      console.log('Usuario conectado:', this.usuarioConectado);
      console.log('Tipo de inicio:', this.tipoInicio);
      console.log('Inicio de usuario:', this.inicioDeUsuario);
    } else {
      this.tipoInicio = 'INVITADO';
      this.inicioDeUsuario = 'INVITADO'; // Asignamos INVITADO si no está logueado
    }
  }

  ngOnInit(): void {
    // Si no está autenticado, redirige a la vista de visitante
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }

    this.inmuebleService.obtenerListaDeInmuebles().subscribe({
      next: (inmuebles) => {
        this.propiedadesDestacadas = inmuebles;
        console.log('Propiedades destacadas cargadas:', inmuebles);
      },
      error: (err) => {
        console.error('Error al obtener inmuebles', err);
      }
    });
  }

  ngAfterViewInit(): void {
    // Crear el mapa después de que la vista se haya inicializado completamente
    if (this.isLogged) {
      setTimeout(() => {
        this.mapaService.crearMapa();
        this.mapaService.agregarMarcador();
      }, 0);
    }
  }

  public logout() {
    this.authService.logout();
    window.location.reload();
  }


}
