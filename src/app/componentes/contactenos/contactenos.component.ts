import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { RecaptchaModule, RECAPTCHA_SETTINGS, RecaptchaSettings } from 'ng-recaptcha';
import { environment } from '../../../environments/environment';
import { IdiomaService } from '../../servicios/idioma.service';
import { ES } from '../../i18n/es';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-contactenos',
  standalone: true,
  templateUrl: './contactenos.component.html',
  styleUrls: ['./contactenos.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
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
})
export class ContactenosComponent implements OnInit, OnDestroy {

  contactoForm: FormGroup;
  captchaToken: string | null = null;

  // Lógica de Traducción
  t: typeof ES;
  private sub!: Subscription;

  // Lógica de reCAPTCHA y Modo Oscuro
  captchaActivo = true;
  private observer: MutationObserver | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    public idiomaService: IdiomaService
  ) {
    this.t = idiomaService.t;
    this.contactoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      asunto: ['', Validators.required],
      mensaje: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    // 1. Suscripción a traducciones (Rama accesibilidad)
    this.sub = this.idiomaService.traducciones$.subscribe(t => {
      this.t = t;
    });

    // 2. Observador para Modo Oscuro (Rama HEAD)
    this.observer = new MutationObserver(() => {
      this.recargarCaptcha();
    });

    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  ngOnDestroy(): void {
    // Limpieza de suscripciones y observadores para evitar fugas de memoria
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

  get temaActual(): 'light' | 'dark' {
    return document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  }

  resolved(token: string | null) {
    this.captchaToken = token;
  }

  onSubmit() {
    if (this.contactoForm.invalid) {
      this.contactoForm.markAllAsTouched();
      return;
    }

    if (!this.captchaToken) {
      alert('Por favor, confirma que no eres un robot.');
      return;
    }

    const datosEnvio = {
      ...this.contactoForm.value,
      recaptchaToken: this.captchaToken
    };

    this.authService.enviarContacto(datosEnvio)
      .subscribe({
        next: () => {
          this.contactoForm.reset();
          this.captchaToken = null;
          this.recargarCaptcha();
          alert('Mensaje enviado con éxito');
        },
        error: (err) => {
          console.error('Error al enviar:', err);
          this.captchaToken = null;
          this.recargarCaptcha();
        }
      });
  }
}
