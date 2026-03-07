import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '../../servicios/users.service';
import { Router } from '@angular/router';
import { RedireccionService } from '../../servicios/redireccion.service';
import { InmuebleServiceService } from '../../servicios/inmueble-service.service';
import { InmuebleResponse } from '../../dto/inmueble-response'; // Fusionado de HEAD
import { IdiomaService } from '../../servicios/idioma.service'; // Fusionado de accesibilidad
import { ES } from '../../i18n/es';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-perfil',
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule
  ],
  standalone: true,
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit, OnDestroy {
  // Lógica de Idioma (Accesibilidad)
  t: typeof ES;
  private sub!: Subscription;

  // Propiedades del perfil
  perfilForm!: FormGroup;
  email = 'correoUsuario';
  nombre = 'Nombre Usuario';
  apellido = 'Apellido Usuario';
  documentoIdentidad = '12345678';
  telefono = '1234567890';
  rol = 'USUARIO';
  id = '1';
  editando = false;
  mostrarConfirmacion: boolean = false;

  // Temporales para edición
  nombreTemporal = '';
  emailTemporal = '';
  telefonoTemporal = '';
  apellidoTemporal = '';
  documentoIdentidadTemporal = '';

  errorMessage: string | null = null;
  loading: boolean = false;

  // Lógica de Inmuebles (HEAD)
  propiedades: InmuebleResponse[] = [];
  mostrarModalDetalle = false;
  detalleInmueble: InmuebleResponse | null = null;
  currentImageIndex: number = 0;
  currentDocIndex: number = 0;

  constructor(
    private authService: AuthService,
    private userService: UsersService,
    private fb: FormBuilder,
    private redireccionamiento: RedireccionService,
    protected inmuebleService: InmuebleServiceService,
    public idiomaService: IdiomaService
  ) {
    this.t = idiomaService.t;
    this.email = this.authService.getUserEmail() || 'correoUsuario';
    this.nombre = this.authService.obtenerNombreUsuario() || 'Nombre Usuario';
    this.apellido = this.authService.obtenerApellidoUsuario() || 'Apellido Usuario';
    this.telefono = this.authService.obtenerTelefonoUsuario() || '1234567890';
    this.rol = this.authService.getRoles()[0] || 'USUARIO';
    this.documentoIdentidad = this.authService.obtenerDocumentoUsuario() || '12345678';

    this.perfilForm = this.fb.group({
      nombreTemporal: ['', [Validators.required]],
      apellidoTemporal: ['', [Validators.required]],
      telefonoTemporal: ['', [Validators.required]],
      documentoIdentidadTemporal: ['', [Validators.required]]
    });

    this.perfilForm.setValue({
      nombreTemporal: this.nombre,
      apellidoTemporal: this.apellido,
      telefonoTemporal: this.telefono,
      documentoIdentidadTemporal: this.documentoIdentidad
    });
  }

  ngOnInit(): void {
    // 1. Suscripción a traducciones
    this.sub = this.idiomaService.traducciones$.subscribe(t => {
      this.t = t;
    });

    // 2. Carga de inmuebles del usuario (HEAD)
    const correoUsuario = localStorage.getItem('userEmail') || '';
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

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
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

          this.showAlert('success', this.t.perfil.actualizacionExitosa || 'Información actualizada exitosamente.');
          this.authService.cambiarDatosToken(response);
          window.location.reload();
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
      error: (err) => {
        this.loading = false;
        this.showAlert('error', 'Error al desvincular usuario');
      }
    });
  }

  // Métodos de Modal (HEAD)
  abrirModalDetalles(inmueble: InmuebleResponse): void {
    this.detalleInmueble = inmueble;
    this.currentImageIndex = 0;
    this.currentDocIndex = 0;
    this.mostrarModalDetalle = true;
  }

  cerrarModalDetalles(): void {
    this.mostrarModalDetalle = false;
    this.detalleInmueble = null;
  }

  getFileNameFromUrl(url: string | undefined | null): string {
    if (!url) return '';
    try {
      const u = new URL(url);
      let filename = u.pathname.split('/').pop() || '';
      return decodeURIComponent(filename.split('?')[0]);
    } catch {
      return url.split('/').pop()?.split('?')[0] || '';
    }
  }

  abrirDocumento(url: string): void {
    if (url) window.open(url, '_blank');
  }



  showAlert(type: 'success' | 'error', message: string): void {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-fixed`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
  }

  volver() {
    if (this.authService.getToken() == null) {
      this.redireccionamiento.redirigirAHome();
    } else {
      this.redireccionamiento.redirigirAHomeIngresado();
    }
  }
  // Busca esto en tu código:
  get detalleDocumentos(): string[] {
    return this.detalleInmueble?.documentosImportantes || [];
  }

  // AÑADE ESTO JUSTO DEBAJO:
  get detalleDocumentosIndices(): number[] {
    const docs = this.detalleDocumentos;
    return docs.length > 0 ? docs.map((_, i) => i) : [];
  }
}
