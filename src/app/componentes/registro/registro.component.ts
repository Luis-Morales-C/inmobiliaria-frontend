import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { UsersService } from '../../servicios/users.service';
import { ErrorResponse } from '../../dto/error-response';
import { Router, RouterLink } from '@angular/router';
import { RedireccionService } from '../../servicios/redireccion.service';
import { RecaptchaModule, RECAPTCHA_SETTINGS, RecaptchaSettings } from 'ng-recaptcha';
import { environment } from '../../../environments/environment';
import { IdiomaService } from '../../servicios/idioma.service';
import { ES } from '../../i18n/es';
import { Subscription } from 'rxjs';

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
export class RegistroComponent implements OnInit, OnDestroy {
  registroForm!: FormGroup;
  result = '';
  classResult = 'success';
  verContra = false;
  verConfirmContra = false;

  // Lógica reCAPTCHA y Modo Oscuro (HEAD)
  captchaToken: string | null = null;
  captchaActivo = true;
  private observer: MutationObserver | null = null;

  // Lógica de Idioma (Accesibilidad)
  t: typeof ES;
  private sub!: Subscription;

  constructor(
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private router: Router,
    protected redireccionamiento: RedireccionService,
    private cdr: ChangeDetectorRef,
    public idiomaService: IdiomaService
  ) {
    this.t = idiomaService.t;
    this.crearFormulario();
  }

  ngOnInit(): void {
    // 1. Suscripción a idiomas
    this.sub = this.idiomaService.traducciones$.subscribe(t => {
      this.t = t;
    });

    // 2. Observador para cambios de tema (Dark Mode)
    this.observer = new MutationObserver(() => {
      this.recargarCaptcha();
    });

    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  ngOnDestroy(): void {
    // Limpieza de suscripciones y observadores
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

  onCaptchaResolved(token: string | null) {
    this.captchaToken = token;
  }

  onSubmit(): void {
    if (!this.captchaToken) {
      // Idealmente usar t.registro.errorCaptcha cuando esté disponible
      this.result = this.t.login?.errorCaptcha || 'Por favor, completa la verificación de seguridad (Captcha).';
      this.classResult = 'text-danger';
      return;
    }

    const newUser: any = {
      nombre: this.registroForm.get('nombre')?.value,
      apellido: this.registroForm.get('apellido')?.value,
      documentoIdentidad: this.registroForm.get('documentoIdentidad')?.value,
      telefono: this.registroForm.get('telefono')?.value,
      email: this.registroForm.get('email')?.value,
      contrasena: this.registroForm.get('contrasena')?.value,
      recaptchaToken: this.captchaToken
    };

    this.usersService.registrar(newUser).subscribe({
      next: (data) => {
        this.result = 'Usuario registrado correctamente. Redirigiendo a la activación de cuenta...';
        this.classResult = 'success';
        const userEmail = this.registroForm.get('email')?.value;
        localStorage.setItem('pendingActivationEmail', userEmail);
        setTimeout(() => {
          this.router.navigate(['/activar'], { state: { email: userEmail } });
        }, 2000);
      },
      error: (error) => {
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
    this.verConfirmContra = !this.verConfirmContra;
  }

  redirigirPoliticaDatosConLocalStorage() {
    localStorage.setItem('migaPan', 'registro');
    this.redireccionamiento.redirigirAPoliticaDatos();
  }

  get temaActual(): 'light' | 'dark' {
    return document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  }
}
