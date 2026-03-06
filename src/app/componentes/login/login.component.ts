import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../servicios/auth.service';
import { NgClass, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { RedireccionService } from '../../servicios/redireccion.service';
import { RecaptchaModule, RECAPTCHA_SETTINGS, RecaptchaSettings } from 'ng-recaptcha';
import { environment } from '../../../environments/environment';

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
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  loading: boolean = false;
  verContra = false;
  captchaToken: string | null = null;
  captchaActivo = true;

  // Guardamos el observador para poder desconectarlo al salir
  private observer: MutationObserver | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    protected redireccionamiento: RedireccionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      contrasena: ['', Validators.required],
    });
  }

  ngOnInit() {
    // ESTA ES LA MAGIA: Observamos cambios en las clases del BODY
    this.observer = new MutationObserver(() => {
      this.recargarCaptcha();
    });

    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  ngOnDestroy() {
    // Limpieza al salir del componente
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  recargarCaptcha() {
    // Solo recargamos si el tema visual realmente cambió
    this.captchaActivo = false;
    this.cdr.detectChanges();
    this.captchaActivo = true;
    this.cdr.detectChanges();
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
        next: () => {
          this.loading = false;
          this.showAlert('success', 'Inicio de sesión exitoso');
          this.router.navigate(['/inicio']);
        },
        error: (err: any) => {
          this.loading = false;
          this.captchaToken = null;
          this.showAlert('error', err.error?.message || 'Error al iniciar sesión');
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
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
  }

  mostrarContrasenia() {
    this.verContra = !this.verContra;
  }

  get temaActual(): 'light' | 'dark' {
    return document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  }
}
