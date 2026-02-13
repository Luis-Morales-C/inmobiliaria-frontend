import {Component, OnDestroy, OnInit} from '@angular/core';
import {MapaService} from '../../mapa.service';
import {FormBuilder, FormGroup, isFormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {UsersService} from '../../servicios/users.service';
import {RegistroInmuebleRequest} from '../../dto/registro-inmueble-request';
import {RouterLink} from '@angular/router';
import {RedireccionService} from '../../servicios/redireccion.service';
import {CommonModule} from '@angular/common';
import {CaptacionInmuebleDTO} from '../../dto/captacion-inmueble-dto';
import {InmuebleServiceService} from '../../servicios/inmueble-service.service';

@Component({
  selector: 'app-registro-inmueble',
  standalone:true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CommonModule
  ],
  templateUrl: './registro-inmueble.component.html',
  styleUrl: './registro-inmueble.component.css'
})
export class RegistroInmuebleComponent implements OnInit, OnDestroy{
  registroInmuebleForm!: FormGroup;
  imagenes: File[] = [];
  imagenesPreview: string[] = [];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    this.procesarArchivos(input.files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files) {
      console.log('archivos soltados:', event.dataTransfer.files);
      this.procesarArchivos(event.dataTransfer.files);
    }
  }

  procesarArchivos(files: FileList): void {
    const nuevosArchivos = Array.from(files);
    for (let file of nuevosArchivos) {
      if (this.imagenes.length >= 10) break;
      if (file.type === 'image/jpeg' || file.type === 'image/png') {
        this.imagenes.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          console.log('Imagen cargada:', e.target.result);
          console.log('Previsualización actual:', this.imagenesPreview);
          this.imagenesPreview.push(e.target.result);
        };

        reader.readAsDataURL(file);
      }
    }
  }

  eliminarImagen(index: number): void {
    this.imagenes.splice(index, 1);
    this.imagenesPreview.splice(index, 1);
  }

  pdfArchivos: File[] = [];

  onPDFSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    this.procesarPDFs(input.files);
  }

  onDragOverPDF(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDropPDF(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files) {
      this.procesarPDFs(event.dataTransfer.files);
    }
  }

  procesarPDFs(files: FileList): void {
    const nuevosArchivos = Array.from(files);
    for (let file of nuevosArchivos) {
      if (this.pdfArchivos.length >= 5) break;
      if (file.type === 'application/pdf') {
        this.pdfArchivos.push(file);
      }
    }
  }

  eliminarPDF(index: number): void {
    this.pdfArchivos.splice(index, 1);
  }


  constructor(private formBuilder: FormBuilder, private mapaService: MapaService,protected redireccionamiento: RedireccionService,private inmuebleService: InmuebleServiceService) {
    this.crearFormularioTexto();
  }

  ngOnDestroy(): void {
    this.imagenes = [];
    this.imagenesPreview = [];
    this.pdfArchivos = [];

    const inputImagenes = document.getElementById('inputImagenes') as HTMLInputElement;
    const inputPDFs = document.getElementById('inputPDFs') as HTMLInputElement;
    if (inputImagenes) inputImagenes.value = '';
    if (inputPDFs) inputPDFs.value = '';

  }


  ngOnInit(): void {
    this.mapaService.crearMapa();

    this.mapaService['mapa'].on('click', (event: any) => {
      const { lng, lat } = event.lngLat;

      // Agrega el marcador donde se hace clic
      this.mapaService.agregarMarcador();

      // Guarda los valores en campos separados
      this.registroInmuebleForm.get('latitud')?.setValue(lat);
      console.log('latitud', lat);
      console.log('longitud', lng);
      this.registroInmuebleForm.get('longitud')?.setValue(lng);
    });
  }

  //Modificar despues xd
  private crearFormularioTexto() {
    this.registroInmuebleForm = this.formBuilder.group({
      tipoNegocio: ['', [Validators.required]],
      tipo: ['', [Validators.required]],
      precio: ['', [Validators.required]],
      estado: ['', [Validators.required]],
      habitaciones: ['', [Validators.required]],
      banos: ['', [Validators.required]],
      cantidadParqueaderos: ['', [Validators.required]],
      medidas: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      nombreContacto: ['', [Validators.required]],
      telefonoContacto: ['', [Validators.required]],
      correoContacto: ['', [Validators.required, Validators.email]],
      latitud: ['', [Validators.required]],
      longitud: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.registroInmuebleForm.valid) {
      // 1. Obtener los datos del formulario
      const datosFormulario = this.registroInmuebleForm.value;

      // 2. Crear el DTO sin archivos
      const dto: CaptacionInmuebleDTO = {
        latitud: datosFormulario.latitud,
        longitud: datosFormulario.longitud,
        tipoNegocio: datosFormulario.tipoNegocio,
        tipo: datosFormulario.tipo,
        medidas: datosFormulario.medidas,
        habitaciones: datosFormulario.habitaciones,
        banos: datosFormulario.banos,
        descripcion: datosFormulario.descripcion,
        precio: datosFormulario.precio,
        cantidadParqueaderos: datosFormulario.cantidadParqueaderos,
        telefonoContacto: datosFormulario.telefonoContacto,
        nombreContacto: datosFormulario.nombreContacto,
        correoContacto: datosFormulario.correoContacto,
        estado: datosFormulario.estado
      };

      // 3. Crear FormData para archivos
      const formData = new FormData();

      // Agregar el DTO como JSON
      Object.entries(dto).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      formData.append('correoUsuario', localStorage.getItem('userEmail') || '');



      this.imagenes.forEach((img) => {
        formData.append('imagenes', img); // mismo nombre para todos
      });

      this.pdfArchivos.forEach((pdf) => {
        formData.append('documentosImportantes' + '', pdf);
      });

      console.log("=== DTO listo para enviar ===");
      console.log(dto);


      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      // 4. Enviar DTO y archivos
      this.inmuebleService.registrarInmueble(formData).subscribe({
        next: () => {
          console.log('Captación registrada correctamente');
          this.showAlert('success', 'Inmueble registrado exitosamente');
          this.redireccionamiento.redirigirAPerfil();

          // 🔄 Limpiar formulario y archivos
          this.registroInmuebleForm.reset();
          this.imagenes = [];
          this.imagenesPreview = [];
          this.pdfArchivos = [];

          const inputImagenes = document.getElementById('inputImagenes') as HTMLInputElement;
          const inputPDFs = document.getElementById('inputPDFs') as HTMLInputElement;
          if (inputImagenes) inputImagenes.value = '';
          if (inputPDFs) inputPDFs.value = '';
        }
      });
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
  }

}



