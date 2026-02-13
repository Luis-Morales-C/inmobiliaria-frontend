import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {NgClass, NgIf} from '@angular/common';
import { UserRegistrationRequest } from '../../dto/user-registration-request';
import { UsersService } from '../../servicios/users.service';
import { ErrorResponse } from '../../dto/error-response';
import { Router, RouterLink } from '@angular/router';
import {RedireccionService} from '../../servicios/redireccion.service';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, NgIf, RouterLink, NgClass],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  registroForm!: FormGroup;
  result = '';
  classResult = 'success';
  verContra = false;
  verConfirmContra = false;

  constructor(
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private router: Router,
    protected redireccionamiento: RedireccionService
  ) {
    this.crearFormulario();
  }

  private crearFormulario() {
    this.registroForm = this.formBuilder.group({
        nombre: ['', [Validators.required, Validators.maxLength(50)]],
        apellido: ['', [Validators.required, Validators.maxLength(50)]],
        documentoIdentidad: ['', [Validators.required, Validators.maxLength(20)]],
        telefono: ['', [Validators.required, Validators.maxLength(20)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
        contrasena: ['', [Validators.required, Validators.minLength(8)]],
        confirmcontrasena: ['', [Validators.required, Validators.minLength(8)]],
        aceptaPolitica: [false, Validators.requiredTrue]
      },
      {
        validators: this.passwordMatchValidator
      });
  }

  onSubmit(): void {
    // Crear objeto con los campos requeridos por el backend
    const newUser: UserRegistrationRequest = {
      nombre: this.registroForm.get('nombre')?.value,
      apellido: this.registroForm.get('apellido')?.value,
      documentoIdentidad: this.registroForm.get('documentoIdentidad')?.value,
      telefono: this.registroForm.get('telefono')?.value,
      email: this.registroForm.get('email')?.value,
      contrasena: this.registroForm.get('contrasena')?.value
    };

    this.usersService.registrar(newUser).subscribe({
      next: (data) => {
        console.log('El usuario ha sido registrado correctamente: ', data);
        this.result = 'Usuario registrado correctamente. Redirigiendo a la activación de cuenta...';
        this.classResult = 'success';

        // Guardar el email en localStorage y redirigir a la página de activación
        const userEmail = this.registroForm.get('email')?.value;
        localStorage.setItem('pendingActivationEmail', userEmail);

        // Redirigir a la página de activación de cuenta después de un breve retraso
        setTimeout(() => {
          this.router.navigate(['/activar'], { state: { email: userEmail } });
        }, 2000);
      },
      error: (error) => {
        console.log('Se presentó un problema al registrar el usuario: ', error);
        // Manejar correctamente el error cuando error.error es null
        if (error.error && error.error instanceof Array) {
          this.result = error.error.map((item: ErrorResponse) => item.message).join(', ');
        } else if (error.error && error.error.message) {
          this.result = error.error.message;
        } else {
          // Mensaje de error por defecto cuando no hay detalles específicos
          this.result = 'Error al registrar el usuario. Por favor, inténtelo más tarde.';
        }
        this.classResult = 'text-danger';
      }
    });
  }

  passwordMatchValidator(formGroup: FormGroup): any {
    const password = formGroup.get('contrasena')?.value;
    const confirmPassword = formGroup.get('confirmcontrasena')?.value;
    // Si las contraseñas no coinciden, devuelve un error, de lo contrario, null
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  mostrarContrasenia() {
    this.verContra = !this.verContra;
  }

  mostrarConfirmContrasenia() {
    this.verConfirmContra=!this.verConfirmContra;
  }

  redirigirPoliticaDatosConLocalStorage() {
    localStorage.setItem('migaPan','registro');
    this.redireccionamiento.redirigirAPoliticaDatos();
  }


}
