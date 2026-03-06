import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { RecaptchaModule, RECAPTCHA_SETTINGS, RecaptchaSettings } from 'ng-recaptcha';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf, RecaptchaModule],
  providers: [
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: {
        siteKey: environment.recaptcha.siteKey,
      } as RecaptchaSettings,
    },
  ],
  templateUrl: './recuperar-contrasena.component.html',
  styleUrls: ['./recuperar-contrasena.component.css']
})
export class RecuperarContrasenaComponent implements OnInit {
  isSubmitting = false;
  form!: FormGroup;
  captchaToken: string | null = null; // Almacena el token de Google

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.form.get('email');
  }

  mostrarAlerta = false;

  // Metodo para capturar el token cuando el usuario resuelve el captcha
  onCaptchaResolved(token: string | null) {
    this.captchaToken = token;
  }

  solicitarCodigo() {
    this.mostrarAlerta = false;

    // Validación: Formulario inválido o Captcha no resuelto
    if (this.form.invalid || !this.captchaToken) {
      this.form.markAllAsTouched();
      this.mostrarAlerta = true;
      return;
    }

    this.isSubmitting = true;
    this.mostrarAlerta = false;

    const email = this.form.value.email!;

    // Ahora enviamos el email Y el token al servicio
    this.authService.enviarCodigoRecuperacion(email, this.captchaToken)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          localStorage.setItem('recoveryEmail', email);
          this.router.navigate(['/cambiar-contrasena']);
        },
        error: () => {
          this.isSubmitting = false;
          this.captchaToken = null; // Opcional: resetear token si falla
        }
      });
  }
}
