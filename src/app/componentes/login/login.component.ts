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
import { IdiomaService } from '../../servicios/idioma.service';
import { ES } from '../../i18n/es';
import { Subscription } from 'rxjs';
import {ChatService} from '../../servicios/chat.service';

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

  // Lógica de reCAPTCHA y Modo Oscuro (HEAD)
  captchaToken: string | null = null;
  captchaActivo = true;
  private observer: MutationObserver | null = null;

  // Lógica de Idioma (Accesibilidad)
  t: typeof ES;
  private sub!: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    protected redireccionamiento: RedireccionService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public idiomaService: IdiomaService,
    public chatService: ChatService
  ) {
    this.t = idiomaService.t;
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      contrasena: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // 1. Suscripción a traducciones (Rama accesibilidad)
    this.sub = this.idiomaService.traducciones$.subscribe(t => {
      this.t = t;
    });

    // 2. Configuración del observador para Modo Oscuro (Rama HEAD)
    this.observer = new MutationObserver(() => {
      this.recargarCaptcha();
    });

    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  ngOnDestroy(): void {
    // Limpieza total: Desuscripción y desconexión del observador
    this.sub?.unsubscribe();
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  recargarCaptcha() {
    this.captchaActivo = false;
    this.cdr.detectChanges();
    this.captchaActivo = true;
    this.cdr.detectChanges();
  }
  captchaError: string | null = null;
  resolved(token: string | null) {
    this.captchaToken = token;
    this.captchaError = null;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      // 1. Validación del Captcha con traducción
      if (!this.captchaToken) {
        this.captchaError = this.t.login.errorCaptcha || 'Por favor, completa el reCAPTCHA';
        return;
      }
      this.captchaError = null;

      this.loading = true;
      const { email, contrasena } = this.loginForm.value;

      this.authService.login(email, contrasena, this.captchaToken).subscribe({
        next: () => {
          this.loading = false;
          this.chatService.conectarWebSocket();
          this.router.navigate(['/inicio']);
        },
        error: () => {
          this.loading = false;
          this.captchaToken = null;
          this.recargarCaptcha(); // Reset visual del captcha tras error
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
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
