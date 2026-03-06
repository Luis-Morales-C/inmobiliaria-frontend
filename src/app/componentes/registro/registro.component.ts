import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { UserRegistrationRequest } from '../../dto/user-registration-request';
import { UsersService } from '../../servicios/users.service';
import { ErrorResponse } from '../../dto/error-response';
import { Router, RouterLink } from '@angular/router';
import { RedireccionService } from '../../servicios/redireccion.service';
import { RecaptchaModule, RECAPTCHA_SETTINGS, RecaptchaSettings } from 'ng-recaptcha';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink, NgClass, RecaptchaModule],
  providers: [
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: {
        siteKey: environment.recaptcha.siteKey,
      } as RecaptchaSettings,
    },
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  registroForm!: FormGroup;
  result = '';
  classResult = 'success';
  verContra = false;
  verConfirmContra = false;
  captchaToken: string | null = null; // Variable para almacenar el token de Google

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
        contrasena: ['', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/)
        ]],
        confirmcontrasena: ['', [Validators.required, Validators.minLength(8)]],
        aceptaPolitica: [false, Validators.requiredTrue]
      },
      {
        validators: this.passwordMatchValidator
      });
  }

  // Metodo que se dispara cuando el usuario resuelve el captcha
  onCaptchaResolved(token: string | null) {
    this.captchaToken = token;
  }

  onSubmit(): void {
    // Validación extra: Si no hay token de captcha, no enviamos nada
    if (!this.captchaToken) {
      this.result = 'Por favor, completa la verificación de seguridad (Captcha).';
      this.classResult = 'text-danger';
      return;
    }

    // Crear objeto con los campos requeridos por el backend, incluyendo el token
    // Usamos 'any' o actualiza tu interfaz UserRegistrationRequest para incluir recaptchaToken
    const newUser: any = {
      nombre: this.registroForm.get('nombre')?.value,
      apellido: this.registroForm.get('apellido')?.value,
      documentoIdentidad: this.registroForm.get('documentoIdentidad')?.value,
      telefono: this.registroForm.get('telefono')?.value,
      email: this.registroForm.get('email')?.value,
      contrasena: this.registroForm.get('contrasena')?.value,
      recaptchaToken: this.captchaToken // <--- Token enviado al backend
    };

    this.usersService.registrar(newUser).subscribe({
      next: (data) => {
        console.log('El usuario ha sido registrado correctamente: ', data);
        this.result = 'Usuario registrado correctamente. Redirigiendo a la activación de cuenta...';
        this.classResult = 'success';

        const userEmail = this.registroForm.get('email')?.value;
        localStorage.setItem('pendingActivationEmail', userEmail);

        setTimeout(() => {
          this.router.navigate(['/activar'], { state: { email: userEmail } });
        }, 2000);
      },
      error: (error) => {
        console.log('Se presentó un problema al registrar el usuario: ', error);

        // Resetear captcha en caso de error para que el usuario deba marcarlo de nuevo
        this.captchaToken = null;

        if (error.error && error.error instanceof Array) {
          this.result = error.error.map((item: ErrorResponse) => item.message).join(', ');
        } else if (error.error && error.error.message) {
          this.result = error.error.message;
        } else {
          this.result = 'Error al registrar el usuario. Por favor, inténtelo más tarde.';
        }
        this.classResult = 'text-danger';
      }
    });
  }

  passwordMatchValidator(formGroup: FormGroup): any {
    const password = formGroup.get('contrasena')?.value;
    const confirmPassword = formGroup.get('confirmcontrasena')?.value;
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
