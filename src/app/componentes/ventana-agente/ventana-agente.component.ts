import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {CommonModule, CurrencyPipe} from '@angular/common';
import {InmuebleServiceService} from '../../servicios/inmueble-service.service';
import {InmuebleResponse} from '../../dto/inmueble-response';
import {FormsModule} from '@angular/forms';
import {TipoNegocio} from '../../modelo/TipoNegocio';
import {AuthService} from '../../servicios/auth.service';
import {UsersService} from '../../servicios/users.service';
import {UsuarioResponseDto} from '../../dto/usuario-response.dto';
import {UserMenuComponent} from '../user-menu/user-menu.component';
import {RedireccionService} from '../../servicios/redireccion.service';

@Component({
  selector: 'app-inmuebles-proceso',
  templateUrl: './ventana-agente.component.html',
  styleUrls: ['./ventana-agente.component.css'],
  standalone: true,
  imports: [
    CommonModule,       // ✅ Esto es lo que faltaba
    CurrencyPipe,
    FormsModule,
    UserMenuComponent
  ]
})
export class VentanaAgenteComponent implements OnInit {
  @Output() logout = new EventEmitter<void>();
  userName: string = '';
  propiedadesDestacadas: InmuebleResponse[] = [];
  propiedadSeleccionada: InmuebleResponse | null = null;
  correoUsuario = localStorage.getItem('userEmail') || '';
  isLogged = false;

  constructor(protected inmuebleService: InmuebleServiceService,protected authservice: AuthService,protected userService:UsersService, protected redireccionamiento: RedireccionService) {
    this.isLogged=this.authservice.isAuthenticated();
  }

  ngOnInit(): void {

    if(this.isLogged)
    {
      this.userName=this.authservice.getUserEmail() || 'Usuario';
    }
    this.inmuebleService.obtenerListaInmueblesAgente(this.correoUsuario).subscribe({
      next: (inmuebles) => {
        this.propiedadesDestacadas = inmuebles;
        console.log('Propiedades destacadas cargadas:', inmuebles);
      },
      error: (err) => {
        console.error('No se pudieron obtener los inmuebles debido a que el agente no tiene inmuebles adjuntos a su nombre', err);
      }
    });
  }

  aceptarProceso(inmueble: InmuebleResponse): void {
    console.log('Inmueble recibido desde el botón:', inmueble);

    let nuevoEstado = 'EN_PROCESO';

    if (inmueble.tipoNegocio === TipoNegocio.ALQUILER) {
      nuevoEstado = 'PROCESOALQUIER';
    }

    if (inmueble.tipoNegocio === TipoNegocio.PERMUTACION) {
      nuevoEstado = 'PROCESOPERMUTACION';
    }

    if (inmueble.tipoNegocio === TipoNegocio.VENTA) {
      nuevoEstado = 'PROCESOCOMPRA';
    }

    this.inmuebleService.actualizarEstadoTransaccion(inmueble.id, nuevoEstado).subscribe({
      next: (response) => {
        console.log('Estado actualizado:', response);
        this.propiedadSeleccionada = response;

        window.location.reload();
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
      }
    });
  }


  cancelarProceso(inmueble: InmuebleResponse): void {
    console.log('Inmueble recibido desde el botón:', inmueble);

    let nuevoEstado = 'NOADMITIDA';

    this.inmuebleService.actualizarEstadoTransaccion(inmueble.id, nuevoEstado).subscribe({
      next: (response) => {
        console.log('Estado actualizado:', response);
        this.propiedadSeleccionada = response;

        window.location.reload();
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
      }
    });
  }

  deshacerRechazo(inmueble: InmuebleResponse): void {
    console.log('Inmueble recibido desde el botón:', inmueble);

    this.inmuebleService.actualizarEstadoTransaccion(inmueble.id, 'PENDIENTE').subscribe({
      next: (response) => {
        console.log('Estado actualizado:', response);
        this.propiedadSeleccionada = response;

        window.location.reload();
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
      }
    });
  }


  mostrarModalTransferencia = false;
  listaUsuarios: any[] = [];
  inmuebleSeleccionado: InmuebleResponse | null = null;

  // Modal de detalles del inmueble
  mostrarModalDetalle = false;
  detalleInmueble: InmuebleResponse | null = null;

  // 🔹 Método para abrir el modal de transferencia
  abrirModalTransferencia(inmueble: InmuebleResponse): void {
    this.inmuebleSeleccionado = inmueble;
    this.mostrarModalTransferencia = true;

    // Llamar al servicio para obtener la lista de usuarios habilitados
    console.log("Enviando"+inmueble.propietario);
    this.userService.obtenerTodosLosUsuariosHabilitados(inmueble.propietario,<string>this.authservice.getToken()).subscribe({
      next: (usuarios: UsuarioResponseDto[]) => {
        this.listaUsuarios = usuarios;
        console.log('Usuarios habilitados cargados:', usuarios);
      },
      error: (err) => {
        console.error('Error al obtener usuarios:', err);
      }
    });
  }


  // 🔹 Método para cerrar el modal de transferencia
  cerrarModalTransferencia() {
    this.mostrarModalTransferencia = false;
    this.inmuebleSeleccionado = null;
  }

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

  // 🔹 Método para ejecutar la transferencia
  transferirInmueble(usuario: UsuarioResponseDto | any) {
    if (!this.inmuebleSeleccionado) return;

    console.log(`Transfiriendo inmueble ${this.inmuebleSeleccionado.id} al usuario ${usuario.email}`);

    /*this.inmuebleService.transferirInmueble(this.inmuebleSeleccionado.id, usuario.id).subscribe({
      next: (res) => {
        console.log('Inmueble transferido con éxito:', res);
        this.cerrarModalTransferencia();
        window.location.reload();
      },
      error: (err) => {
        console.error('Error al transferir inmueble:', err);
      }
    });

     */
  }

  volver() {
    if(this.authservice.getToken()==null)
    {
      this.redireccionamiento.redirigirAHome()
    }
    else
    {
      this.redireccionamiento.redirigirAHomeIngresado();
      console.log("Redirigiendo a home ingresado"+this.authservice.getUserEmail() );
    }
  }


}
