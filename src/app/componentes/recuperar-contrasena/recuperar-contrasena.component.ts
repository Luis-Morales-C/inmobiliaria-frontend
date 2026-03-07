import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { RecaptchaModule, RECAPTCHA_SETTINGS, RecaptchaSettings } from 'ng-recaptcha';
import { environment } from '../../../environments/environment';
import { IdiomaService } from '../../servicios/idioma.service';
import { ES } from '../../i18n/es';
import { Subscription } from 'rxjs';

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
export class RecuperarContrasenaComponent implements OnInit, OnDestroy {
  isSubmitting = false;
  form!: FormGroup;

  // Lógica de Captcha y Seguridad (HEAD)
  captchaToken: string | null = null;
  mostrarAlerta = false;
  captchaActivo = true;
  private observer: MutationObserver | null = null;

  // Lógica de Idioma (Accesibilidad)
  t: typeof ES;
  private sub!: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public idiomaService: IdiomaService
  ) {
    this.t = idiomaService.t;
  }

  ngOnInit(): void {
    // 1. Suscripción a traducciones
    this.sub = this.idiomaService.traducciones$.subscribe(t => {
      this.t = t;
    });

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // 2. CONFIGURACIÓN DEL OBSERVADOR para tema (dark-mode)
    this.observer = new MutationObserver(() => {
      this.recargarCaptcha();
    });

    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  ngOnDestroy(): void {
    // Fusión: Limpiamos ambas suscripciones en un solo método
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

  get email() {
    return this.form.get('email');
  }

  get temaActual(): 'light' | 'dark' {
    return document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  }

  onCaptchaResolved(token: string | null) {
    this.captchaToken = token;
  }

  solicitarCodigo() {
    this.mostrarAlerta = false;

    if (this.form.invalid || !this.captchaToken) {
      this.form.markAllAsTouched();
      this.mostrarAlerta = true;
      return;
    }

    this.isSubmitting = true;
    const email = this.form.value.email!;

    this.authService.enviarCodigoRecuperacion(email, this.captchaToken)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          localStorage.setItem('recoveryEmail', email);
          this.router.navigate(['/cambiar-contrasena']);
        },
        error: () => {
          this.isSubmitting = false;
          this.captchaToken = null; // Resetear por seguridad
        }
      });
  }
}
