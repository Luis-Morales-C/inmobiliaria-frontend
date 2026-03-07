import { Component, OnDestroy, OnInit } from '@angular/core';
import { MapaService } from '../../mapa.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '../../servicios/users.service';
import { RouterLink } from '@angular/router';
import { RedireccionService } from '../../servicios/redireccion.service';
import { CommonModule } from '@angular/common';
import { CaptacionInmuebleDTO } from '../../dto/captacion-inmueble-dto';
import { InmuebleServiceService } from '../../servicios/inmueble-service.service';
import { IdiomaService } from '../../servicios/idioma.service';
import { ES } from '../../i18n/es';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-registro-inmueble',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CommonModule
  ],
  templateUrl: './registro-inmueble.component.html',
  styleUrl: './registro-inmueble.component.css'
})
export class RegistroInmuebleComponent implements OnInit, OnDestroy {
  registroInmuebleForm!: FormGroup;

  // Lógica de archivos y estados (HEAD)
  imagenes: File[] = [];
  imagenesPreview: string[] = [];
  pdfArchivos: File[] = [];
  imagenesError: boolean = false;
  pdfError: boolean = false;
  isLoading: boolean = false;

  // Lógica de Idioma (Accesibilidad)
  t: typeof ES;
  private idiomasSub!: Subscription;

  constructor(
    private formBuilder: FormBuilder,
    private mapaService: MapaService,
    protected redireccionamiento: RedireccionService,
    private inmuebleService: InmuebleServiceService,
    public idiomaService: IdiomaService
  ) {
    this.t = idiomaService.t;
    this.crearFormularioTexto();
  }

  ngOnInit(): void {
    // 1. Suscripción de idioma
    this.idiomasSub = this.idiomaService.traducciones$.subscribe(t => {
      this.t = t;
    });

    // 2. Inicialización del Mapa
    this.mapaService.crearMapa();
    this.mapaService['mapa'].on('click', (event: any) => {
      const { lng, lat } = event.lngLat;
      this.mapaService.agregarMarcador();
      this.registroInmuebleForm.get('latitud')?.setValue(lat);
      this.registroInmuebleForm.get('longitud')?.setValue(lng);
    });
  }

  ngOnDestroy(): void {
    // Limpieza total para evitar fugas de memoria
    this.idiomasSub?.unsubscribe();
    this.imagenes = [];
    this.imagenesPreview = [];
    this.pdfArchivos = [];

    const inputImagenes = document.getElementById('inputImagenes') as HTMLInputElement;
    const inputPDFs = document.getElementById('inputPDFs') as HTMLInputElement;
    if (inputImagenes) inputImagenes.value = '';
    if (inputPDFs) inputPDFs.value = '';
  }

  // --- GESTIÓN DE IMÁGENES ---
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.procesarArchivos(input.files);
  }

  procesarArchivos(files: FileList): void {
    const nuevosArchivos = Array.from(files);
    for (let file of nuevosArchivos) {
      if (this.imagenes.length >= 10) break;
      if (file.type === 'image/jpeg' || file.type === 'image/png') {
        this.imagenes.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagenesPreview.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
    this.imagenesError = false;
  }

  eliminarImagen(index: number): void {
    this.imagenes.splice(index, 1);
    this.imagenesPreview.splice(index, 1);
  }

  // --- GESTIÓN DE PDFS ---
  onPDFSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.procesarPDFs(input.files);
  }

  procesarPDFs(files: FileList): void {
    const nuevosArchivos = Array.from(files);
    for (let file of nuevosArchivos) {
      if (this.pdfArchivos.length >= 5) break;
      if (file.type === 'application/pdf') {
        this.pdfArchivos.push(file);
      }
    }
    this.pdfError = false;
  }

  eliminarPDF(index: number): void {
    this.pdfArchivos.splice(index, 1);
  }

  // --- FORMULARIO Y ENVÍO ---
  private crearFormularioTexto() {
    this.registroInmuebleForm = this.formBuilder.group({
      tipoNegocio: ['', Validators.required],
      tipo: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]],
      estado: ['', Validators.required],
      habitaciones: ['', [Validators.required, Validators.min(1)]],
      banos: ['', [Validators.required, Validators.min(1)]],
      cantidadParqueaderos: ['', [Validators.required, Validators.min(0)]],
      medidas: ['', [Validators.required, Validators.min(1)]],
      descripcion: ['', [Validators.required, Validators.maxLength(255)]],
      nombreContacto: ['', [Validators.required, Validators.minLength(3)]],
      telefonoContacto: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
      correoContacto: ['', [Validators.required, Validators.email]],
      latitud: ['', Validators.required],
      longitud: ['', Validators.required],
    });
  }

  onSubmit(): void {
    this.imagenesError = this.imagenes.length === 0;
    this.pdfError = this.pdfArchivos.length === 0;

    if (this.registroInmuebleForm.invalid || this.imagenesError || this.pdfError) {
      return;
    }

    this.isLoading = true;
    const dto: CaptacionInmuebleDTO = this.registroInmuebleForm.value;

    const formData = new FormData();
    Object.entries(dto).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    formData.append('correoUsuario', localStorage.getItem('userEmail') || '');
    this.imagenes.forEach(img => formData.append('imagenes', img));
    this.pdfArchivos.forEach(pdf => formData.append('documentosImportantes', pdf));

    this.inmuebleService.registrarInmueble(formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.showAlert('success', this.t.registroInmueble.exito || 'Inmueble registrado exitosamente');
        this.redireccionamiento.redirigirAPerfil();
      },
      error: () => {
        this.isLoading = false;
        this.showAlert('error', this.t.registroInmueble.error || 'Ocurrió un error al registrar el inmueble');
      }
    });
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

    document.body.appendChild(alertDiv); // Faltaba esta línea para mostrar la alerta
    setTimeout(() => alertDiv.remove(), 3000);
  }
  // --- MÉTODOS DE ARRASTRAR Y SOLTAR (DRAG & DROP) ---

  // Previene el comportamiento por defecto para permitir soltar las imágenes
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  // Maneja el evento cuando se sueltan las imágenes
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files) {
      this.procesarArchivos(files);
    }
  }

  // Previene el comportamiento por defecto para permitir soltar los PDFs
  onDragOverPDF(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  // Maneja el evento cuando se sueltan los PDFs
  onDropPDF(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files) {
      this.procesarPDFs(files);
    }
  }
}
