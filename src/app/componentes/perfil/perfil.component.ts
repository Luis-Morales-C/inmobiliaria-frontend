import {Component, OnInit} from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import {CommonModule, NgClass} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {UsersService} from '../../servicios/users.service';
import {Router} from '@angular/router';
import {RedireccionService} from '../../servicios/redireccion.service';
import {InmuebleServiceService} from '../../servicios/inmueble-service.service';

@Component({
  selector: 'app-perfil',
  imports: [
    NgClass,
    FormsModule,
    CommonModule,
    ReactiveFormsModule
  ],
  standalone: true,
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  perfilForm!: FormGroup;
  email = 'correoUsuario';
  nombre = 'Nombre Usuario';
  apellido = 'Apellido Usuario';
  documentoIdentidad = '12345678';
  telefono = '1234567890'
  rol = 'USUARIO';
  id = '1';
  editando = false;
  mostrarConfirmacion: boolean = false;

  nombreTemporal = '';
  emailTemporal = '';
  telefonoTemporal = '';
  apellidoTemporal = '';
  documentoIdentidadTemporal = '';

  errorMessage: string | null = null;
  loading: boolean = false;


  constructor(private authService: AuthService,private userService:UsersService, private fb: FormBuilder,private redireccionamiento: RedireccionService, protected inmuebleService: InmuebleServiceService) {
    this.email = this.authService.getUserEmail() || 'correoUsuario';
    this.nombre = this.authService.obtenerNombreUsuario() || 'Nombre Usuario';
    this.apellido = this.authService.obtenerApellidoUsuario() || 'Apellido Usuario';
    this.telefono = this.authService.obtenerTelefonoUsuario() || '1234567890';
    this.rol = this.authService.getRoles()[0] || 'USUARIO';
    this.documentoIdentidad = this.authService.obtenerDocumentoUsuario() || '12345678';

    this.perfilForm = this.fb.group({
      nombreTemporal: ['',[Validators.required]],
      apellidoTemporal: ['',[Validators.required]],
      telefonoTemporal: ['',[Validators.required]],
      documentoIdentidadTemporal: ['',[Validators.required]]

    })

    this.perfilForm.setValue({
      nombreTemporal: this.nombre,
      apellidoTemporal: this.apellido,
      telefonoTemporal: this.telefono,
      documentoIdentidadTemporal: this.documentoIdentidad
    });
  }

  propiedades: any[] = [];

  ngOnInit(): void {
    const correoUsuario = localStorage.getItem('userEmail') || '';

    this.inmuebleService.obtenerListaInmueblesUsuario(correoUsuario).subscribe({
      next: (inmuebles) => {
        this.propiedades = inmuebles;
        console.log('Propiedades del usuario cargadas:', inmuebles);
      },
      error: (err) => {
        console.error('Error al obtener propiedades del usuario:', err);
      }
    });
  }




  activarEdicion() {
    this.editando = true;
    this.nombreTemporal = this.nombre;
    this.apellidoTemporal = this.apellido;
    this.emailTemporal = this.email;
    this.telefonoTemporal = this.telefono;
    this.documentoIdentidadTemporal = this.documentoIdentidad;
  }

  guardarCambios() {
    if (this.perfilForm.valid)
    {
        const { nombreTemporal, apellidoTemporal, telefonoTemporal, documentoIdentidadTemporal } = this.perfilForm.value;
        this.nombre = nombreTemporal;
        this.apellido = apellidoTemporal;
        this.telefono = telefonoTemporal;
        this.documentoIdentidad = documentoIdentidadTemporal;
        this.editando = false;

        this.userService.actualizarDatosUsuario(this.email, this.nombre, this.apellido, this.telefono, this.documentoIdentidad).subscribe({
          next: (response) => {
            console.log('Respuesta del backend:', response);
            this.showAlert('success', 'Información actualizada exitosamente.');
            this.authService.cambiarDatosToken(response);
            console.log("el token cambio "+this.authService.obtenerNombreUsuario());
            window.location.reload();
          },
          error: (err) => {
            console.error('Error al actualizar datos del usuario:', err);
            this.errorMessage = err.message || 'Error desconocido';
            this.showAlert('error', 'Error al actualizar datos del usuario: ' + this.errorMessage);
          }
        });


      console.log('Información actualizada:', {
        nombre: this.nombre,
        apellido: this.apellido,
        correo: this.email,
        telefono: this.telefono,
        documento: this.documentoIdentidad
      });
    }
    else
    {
        this.showAlert('error',"Ingrese todos los campos correctamente");
    }

  }

  cancelarEdicion() {
    // Restaurar y salir del modo edición
    this.editando = false;
  }

  desvincularEmpresa() {
    this.mostrarConfirmacion=true;
  }

  cancelarDesvinculacion() {
    this.mostrarConfirmacion = false;
  }

  confirmarDesvinculacion() {
    this.loading=true;
    this.mostrarConfirmacion=false;
    this.userService.desvincular(this.email).subscribe({
        next: (response) => {
          console.log('Respuesta del backend:', response);
          this.loading = false;
          this.showAlert('success', 'Usuario desvinculado exitosamente. Serás redirigido a la página principal.');
          this.redireccionamiento.redirigirAHome();
          this.authService.limpiarStorage();
        },
        error: (err) => {
          console.error('Error al desvincular usuario:', err);
          this.loading = false;
          this.errorMessage = err.message || 'Error desconocido';
          this.showAlert('error', 'Error al desvincular usuario:');
        }
      }
    )
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


}
