import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import { MapaService } from '../../mapa.service';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { RedireccionService } from '../../servicios/redireccion.service';
import {InmuebleServiceService} from '../../servicios/inmueble-service.service';
import {InmuebleResponse} from '../../dto/inmueble-response';
import { IdiomaService } from '../../servicios/idioma.service';
import { ES } from '../../i18n/es';
import { Subscription } from 'rxjs';
import {ChatbotComponent} from '../chatbot/chatbot.component';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UserMenuComponent,ChatbotComponent]
})
export class InicioComponent implements OnInit, AfterViewInit, OnDestroy {
  isLogged = false;
  usuarioConectado = '';
  userEmail: string | null = null;
  tipoInicio: string = 'INVITADO'; // Puede ser USUARIO, ASESOR, INVITADO, etc.
  userName: string = '';
  inicioDeUsuario = '';
  propiedadesDestacadas: InmuebleResponse[] = [];// Inicializamos como cadena vacía
  t: typeof ES;
  private sub!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private mapaService: MapaService,
    protected redireccionamiento:RedireccionService,
    protected inmuebleService: InmuebleServiceService,
    public idiomaService: IdiomaService
  ) {
    this.t = idiomaService.t;
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

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  ngOnInit(): void {
    this.sub = this.idiomaService.traducciones$.subscribe(t => {
      this.t = t;
    });

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

  mostrarModalDetalle = false;
  detalleInmueble: InmuebleResponse | null = null;

  // 🔹 Método para abrir el modal de detalles
  abrirModalDetalles(inmueble: InmuebleResponse): void {
    this.detalleInmueble = inmueble;
    this.mostrarModalDetalle = true;
  }

  // 🔹 Método para cerrar el modal de detalles
  cerrarModalDetalles(): void {
    this.mostrarModalDetalle = false;
    this.detalleInmueble = null;
  }

  irAMiUbicacion(): void {
    this.mapaService.irAMiUbicacion();
  }


}
