import {Component, EventEmitter, OnInit, OnDestroy, Output} from '@angular/core';
import {CommonModule, CurrencyPipe} from '@angular/common';
import {InmuebleServiceService} from '../../servicios/inmueble-service.service';
import {InmuebleResponse} from '../../dto/inmueble-response';
import {FormsModule} from '@angular/forms';
import {TipoNegocio} from '../../modelo/TipoNegocio';
import {AuthService} from '../../servicios/auth.service';
import {UsersService} from '../../servicios/users.service';
import {UsuarioResponseDto} from '../../dto/usuario-response.dto';
import {RedireccionService} from '../../servicios/redireccion.service';
import { IdiomaService } from '../../servicios/idioma.service';
import { ES } from '../../i18n/es';
import { Subscription } from 'rxjs';
import {DetalleInmuebleComponent} from '../detalle-inmueble/detalle-inmueble.component';

@Component({
  selector: 'app-inmuebles-proceso',
  templateUrl: './ventana-agente.component.html',
  styleUrls: ['./ventana-agente.component.css'],
  standalone: true,
  imports: [
    CommonModule,       // ✅ Esto es lo que faltaba
    CurrencyPipe,
    FormsModule,
    DetalleInmuebleComponent
    // UserMenuComponent removed because it's not used in template
  ]
})
export class VentanaAgenteComponent implements OnInit, OnDestroy {
  @Output() logout = new EventEmitter<void>();
  userName: string = '';
  propiedadesDestacadas: InmuebleResponse[] = [];
  propiedadSeleccionada: InmuebleResponse | null = null;
  correoUsuario = localStorage.getItem('userEmail') || '';
  isLogged = false;
  t: typeof ES;
  private sub!: Subscription;

  isLoading = false;



  constructor(
    protected inmuebleService: InmuebleServiceService,
    protected authservice: AuthService,
    protected userService:UsersService,
    protected redireccionamiento: RedireccionService,
    public idiomaService: IdiomaService
  ) {
    this.t = idiomaService.t;
    this.isLogged=this.authservice.isAuthenticated();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  ngOnInit(): void {
    this.sub = this.idiomaService.traducciones$.subscribe(t => {
      this.t = t;
    });

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
    this.isLoading = true;

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
    this.isLoading = true;

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

    this.isLoading = true;

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

  // Carrusel: índice de la imagen actualmente mostrada
  currentImageIndex: number = 0;

  // Obtener array de imágenes (seguro con fallback)
  get detalleImagenes(): string[] {
    return this.detalleInmueble?.imagenes || [];
  }

  // Función para abrir el modal de transferencia
  abrirModalTransferencia(inmueble: InmuebleResponse): void {
    this.inmuebleSeleccionado = inmueble;
    this.mostrarModalTransferencia = true;

    // Llamar al servicio para obtener la lista de usuarios habilitados
    console.log("Enviando"+inmueble.propietario);
    this.userService.obtenerTodosLosUsuariosHabilitados(inmueble.propietario.id,<string>this.authservice.getToken()).subscribe({
      next: (usuarios: UsuarioResponseDto[]) => {
        this.listaUsuarios = usuarios;
        console.log('Usuarios habilitados cargados:', usuarios);
      },
      error: (err) => {
        console.error('Error al obtener usuarios:', err);
      }
    });
  }


  // Cerrar modal de transferencia
  cerrarModalTransferencia() {
    this.mostrarModalTransferencia = false;
    this.inmuebleSeleccionado = null;
  }

  abrirModalDetalles(inmueble: InmuebleResponse): void {
    this.detalleInmueble = inmueble;
    this.currentImageIndex = 0;
    this.currentDocIndex = 0;
    this.mostrarModalDetalle = true;
    console.log(this.detalleInmueble.documentosImportantes.length)
  }

  cerrarModalDetalles(): void {
    this.mostrarModalDetalle = false;
    this.detalleInmueble = null;
    this.currentImageIndex = 0;
    this.currentDocIndex = 0;
  }

  // Ejecutar la transferencia
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

  // ================== DOCUMENTOS ==================

// Obtener lista de PDFs del inmueble
  get detalleDocumentos(): string[] {
    return this.detalleInmueble?.documentosImportantes || [];
  }

  // Índices para los indicadores del carousel de documentos (0..n-1)
  get detalleDocumentosIndices(): number[] {
    const docs = this.detalleDocumentos;
    return docs && docs.length ? docs.map((_, i) => i) : [];
  }

// Índice actual del carrusel de documentos
  currentDocIndex: number = 0;

// Abrir documento en el navegador (Cloudinary)
  abrirDocumento(url: string): void {
    if (!url) return;
    window.open(url, '_blank');
  }

  // Extrae el nombre de archivo desde una URL (ej: Cloudinary) y lo decodifica
  getFileNameFromUrl(url: string | undefined | null): string {
    if (!url) return '';
    try {
      // Intentar usar el constructor URL para obtener el pathname
      const u = new URL(url);
      let filename = u.pathname.split('/').pop() || '';
      // Quitar parámetros si los hubiera (aunque URL.pathname no incluye query)
      const qIdx = filename.indexOf('?');
      if (qIdx !== -1) filename = filename.substring(0, qIdx);
      return decodeURIComponent(filename);
    } catch (e) {
      // Fallback sencillo si la URL no es absoluta
      const lastSlash = url.lastIndexOf('/');
      let filename = lastSlash !== -1 ? url.substring(lastSlash + 1) : url;
      const qIdx = filename.indexOf('?');
      if (qIdx !== -1) filename = filename.substring(0, qIdx);
      try { return decodeURIComponent(filename); } catch { return filename; }
    }
  }

  iniciarChat(correoContacto: string) {
    
  }
}
