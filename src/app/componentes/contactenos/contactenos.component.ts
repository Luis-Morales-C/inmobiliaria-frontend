import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
// IMPORTACIONES PARA RECAPTCHA
import { RecaptchaModule, RECAPTCHA_SETTINGS, RecaptchaSettings } from 'ng-recaptcha';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contactenos',
  standalone: true,
  templateUrl: './contactenos.component.html',
  styleUrls: ['./contactenos.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    RecaptchaModule // <--- Añadido a imports
  ],
  providers: [
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: {
        siteKey: environment.recaptcha.siteKey,
      } as RecaptchaSettings,
    },
  ],
})
export class ContactenosComponent {

  contactoForm: FormGroup;
  captchaToken: string | null = null; // Variable para el token

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.contactoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      asunto: ['', Validators.required],
      mensaje: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  // Método para capturar el token cuando se resuelve el captcha
  resolved(token: string | null) {
    this.captchaToken = token;
  }

  onSubmit() {
    if (this.contactoForm.invalid) {
      this.contactoForm.markAllAsTouched();
      return;
    }

    // Validación de seguridad local
    if (!this.captchaToken) {
      alert('Por favor, confirma que no eres un robot.');
      return;
    }

    // Preparamos el objeto incluyendo el token
    const datosEnvio = {
      ...this.contactoForm.value,
      recaptchaToken: this.captchaToken
    };

    this.authService.enviarContacto(datosEnvio)
      .subscribe({
        next: () => {
          this.contactoForm.reset();
          this.captchaToken = null; // Resetear token tras éxito
          // Nota: El widget se limpia visualmente si usas un ngIf o recargas
        },
        error: (err) => {
          console.error('Error al enviar:', err);
          this.captchaToken = null; // Resetear token para obligar a re-verificar
        }
      });
  }
}
