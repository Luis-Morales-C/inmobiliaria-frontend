import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../servicios/auth.service';
import { NgClass, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { RedireccionService } from '../../servicios/redireccion.service';
import { RecaptchaModule, RECAPTCHA_SETTINGS, RecaptchaSettings } from 'ng-recaptcha'; // Actualizado para incluir settings
import { environment } from '../../../environments/environment'; // Importado para usar la clave centralizada

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    NgIf,
    RouterLink,
    NgClass,
    RecaptchaModule
  ],
  // AGREGADO: Igual que en tu registro para que tome la clave del environment
  providers: [
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: {
        siteKey: environment.recaptcha.siteKey,
      } as RecaptchaSettings,
    },
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  loading: boolean = false;
  verContra = false;
  captchaToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    protected redireccionamiento: RedireccionService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      contrasena: ['', Validators.required],
    });
  }

  resolved(token: string | null) {
    this.captchaToken = token;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      if (!this.captchaToken) {
        this.showAlert('error', 'Por favor, completa la verificación reCAPTCHA');
        return;
      }

      this.loading = true;
      const { email, contrasena } = this.loginForm.value;

      this.authService.login(email, contrasena, this.captchaToken).subscribe({
        next: (response) => {
          this.loading = false;
          this.showAlert('success', 'Inicio de sesión exitoso');
          this.router.navigate(['/inicio']);
        },
        error: (err: any) => {
          this.loading = false;
          this.captchaToken = null;

          const mensajeBackend = err.error?.message || err.message;
          let mensajeAMostrar = mensajeBackend || 'Error desconocido';

          switch (mensajeBackend) {
            case 'Usuario no encontrado':
              mensajeAMostrar = 'El email ingresado no está registrado';
              break;
            case 'Contraseña incorrecta':
              mensajeAMostrar = 'La contraseña es incorrecta';
              break;
            case 'Usuario bloqueado':
              mensajeAMostrar = 'Tu cuenta está bloqueada, contacta al soporte';
              break;
            case 'Validación de seguridad fallida (Captcha inválido).':
              mensajeAMostrar = 'El reCAPTCHA ha expirado, inténtalo de nuevo';
              break;
          }

          this.showAlert('error', mensajeAMostrar);
        }
      });
    } else {
      this.showAlert('error', 'Por favor completa todos los campos correctamente');
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
    setTimeout(() => alertDiv.remove(), 3000);
  }

  mostrarContrasenia() {
    this.verContra = !this.verContra;
  }
}
