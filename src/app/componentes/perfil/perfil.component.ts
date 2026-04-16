import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '../../servicios/users.service';
import { RedireccionService } from '../../servicios/redireccion.service';
import { InmuebleServiceService } from '../../servicios/inmueble-service.service';
import { InmuebleResponse } from '../../dto/inmueble-response';
import { IdiomaService } from '../../servicios/idioma.service';
import { ES } from '../../i18n/es';
import { Subscription } from 'rxjs';
import { DetalleInmuebleComponent } from '../detalle-inmueble/detalle-inmueble.component';

@Component({
  selector: 'app-perfil',
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    DetalleInmuebleComponent
  ],
  standalone: true,
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit, OnDestroy {
  // Lógica de Idioma
  t: typeof ES;
  private sub!: Subscription;

  // Propiedades del perfil
  perfilForm!: FormGroup;
  email = '';
  nombre = '';
  apellido = '';
  documentoIdentidad = '';
  telefono = '';
  rol = '';
  id='';
  editando = false;
  mostrarConfirmacion: boolean = false;

  errorMessage: string | null = null;
  loading: boolean = false;

  // Lógica de Inmuebles
  propiedades: InmuebleResponse[] = [];
  mostrarModalDetalle = false;
  detalleInmueble: InmuebleResponse | null = null;


  // Confirmación de eliminación (HEAD)
  mostrarConfirmacionEliminar: boolean = false;
  inmuebleAEliminar: InmuebleResponse | null = null;

  constructor(
    private authService: AuthService,
    private userService: UsersService,
    private fb: FormBuilder,
    private redireccionamiento: RedireccionService,
    protected inmuebleService: InmuebleServiceService,
    public idiomaService: IdiomaService
  ) {
    // Inicialización de traducciones
    this.t = idiomaService.t;

    // Carga de datos iniciales del usuario
    this.email = this.authService.getUserEmail() || '';
    this.nombre = this.authService.obtenerNombreUsuario() || '';
    this.apellido = this.authService.obtenerApellidoUsuario() || '';
    this.telefono = this.authService.obtenerTelefonoUsuario() || '';
    this.rol = this.authService.getRoles()[0] || 'USUARIO';
    this.documentoIdentidad = this.authService.obtenerDocumentoUsuario() || '';

    // Inicialización del formulario reactivo
    this.perfilForm = this.fb.group({
      nombreTemporal: [this.nombre, [Validators.required]],
      apellidoTemporal: [this.apellido, [Validators.required]],
      telefonoTemporal: [this.telefono, [Validators.required]],
      documentoIdentidadTemporal: [this.documentoIdentidad, [Validators.required]]
    });
  }

  ngOnInit(): void {
    // 1. Suscripción a cambios de idioma
    this.sub = this.idiomaService.traducciones$.subscribe(t => {
      this.t = t;
    });

    // 2. Carga de inmuebles vinculados al usuario
    this.cargarPropiedades();
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  cargarPropiedades() {
    const correoUsuario = localStorage.getItem('userEmail') || this.email;
    if (correoUsuario) {
      this.inmuebleService.obtenerListaInmueblesUsuario(correoUsuario).subscribe({
        next: (inmuebles) => {
          this.propiedades = inmuebles;
        },
        error: (err) => {
          console.error('Error al obtener propiedades:', err);
        }
      });
    }
  }

  activarEdicion() {
    this.editando = true;
    this.perfilForm.patchValue({
      nombreTemporal: this.nombre,
      apellidoTemporal: this.apellido,
      telefonoTemporal: this.telefono,
      documentoIdentidadTemporal: this.documentoIdentidad
    });
  }

  guardarCambios() {
    if (this.perfilForm.valid) {
      const { nombreTemporal, apellidoTemporal, telefonoTemporal, documentoIdentidadTemporal } = this.perfilForm.value;

      this.userService.actualizarDatosUsuario(
        this.email,
        nombreTemporal,
        apellidoTemporal,
        telefonoTemporal,
        documentoIdentidadTemporal
      ).subscribe({
        next: (response) => {
          this.nombre = nombreTemporal;
          this.apellido = apellidoTemporal;
          this.telefono = telefonoTemporal;
          this.documentoIdentidad = documentoIdentidadTemporal;
          this.editando = false;

          this.showAlert('success', this.t.perfil.actualizacionExitosa || 'Información actualizada.');
          this.authService.cambiarDatosToken(response);
          // Opcional: window.location.reload();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error desconocido';
          this.showAlert('error', 'Error: ' + this.errorMessage);
        }
      });
    } else {
      this.showAlert('error', "Ingrese todos los campos correctamente");
    }
  }

  cancelarEdicion() {
    this.editando = false;
  }

  // --- GESTIÓN DE EMPRESA ---
  desvincularEmpresa() {
    this.mostrarConfirmacion = true;
  }

  cancelarDesvinculacion() {
    this.mostrarConfirmacion = false;
  }

  confirmarDesvinculacion() {
    this.loading = true;
    this.mostrarConfirmacion = false;
    this.userService.desvincular(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.showAlert('success', 'Usuario desvinculado exitosamente.');
        this.authService.limpiarStorage();
        this.redireccionamiento.redirigirAHome();
      },
      error: () => {
        this.loading = false;
        this.showAlert('error', 'Error al desvincular usuario');
      }
    });
  }

  // --- GESTIÓN DE INMUEBLES (ELIMINACIÓN) ---
  preguntarEliminar(inmueble: InmuebleResponse) {
    this.inmuebleAEliminar = inmueble;
    this.mostrarConfirmacionEliminar = true;
  }

  cancelarEliminar() {
    this.mostrarConfirmacionEliminar = false;
    this.inmuebleAEliminar = null;
  }

  confirmarEliminar() {
    if (!this.inmuebleAEliminar) return;

    const id = this.inmuebleAEliminar.id;
    this.inmuebleService.eliminarInmueble(id).subscribe({
      next: () => {
        this.propiedades = this.propiedades.filter(p => p.id !== id);
        this.showAlert('success', 'Inmueble eliminado correctamente');
        this.mostrarConfirmacionEliminar = false;
        this.inmuebleAEliminar = null;
      },
      error: (err) => {
        console.error(err);
        this.showAlert('error', 'No se pudo eliminar el inmueble');
        this.mostrarConfirmacionEliminar = false;
      }
    });
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



  showAlert(type: 'success' | 'error', message: string): void {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} mt-3`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.padding = '15px';
    alertDiv.style.borderRadius = '5px';
    alertDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';

    if (type === 'success') {
      alertDiv.style.backgroundColor = '#d4edda';
      alertDiv.style.color = '#155724';
      alertDiv.style.borderColor = '#c3e6cb';
    } else {
      alertDiv.style.backgroundColor = '#f8d7da';
      alertDiv.style.color = '#721c24';
      alertDiv.style.borderColor = '#f5c6cb';
    }

    document.body.appendChild(alertDiv);

    // Eliminar la alerta después de 3 segundos
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 3000);
  }


  volver() {
    if(this.authService.getToken()==null)
    {
      this.redireccionamiento.redirigirAHome()
    }
    else
    {
      this.redireccionamiento.redirigirAHomeIngresado();
      console.log("Redirigiendo a home ingresado"+this.authService.getUserEmail() );
    }
  }

  abrirModalDetalles(inmueble: InmuebleResponse): void {
    this.detalleInmueble = inmueble;
    this.mostrarModalDetalle = true;
  }

  cerrarModalDetalles(): void {
    this.mostrarModalDetalle = false;
    this.detalleInmueble = null;
  }
  soloNumeros(event: KeyboardEvent): boolean {
    const charCode = event.charCode;
    return charCode >= 48 && charCode <= 57;
  }

}
