import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgClass, NgForOf, NgIf} from '@angular/common';
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
  imports: [ReactiveFormsModule, NgIf, RouterLink, NgClass, RecaptchaModule, FormsModule, NgForOf],
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

  // Nueva variable para controlar el estado del botón
  cargando = false;

  // Lógica reCAPTCHA y Modo Oscuro
  captchaToken: string | null = null;
  captchaActivo = true;
  private observer: MutationObserver | null = null;

  // Lógica de Idioma
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
    this.sub = this.idiomaService.traducciones$.subscribe(t => {
      this.t = t;
    });

    this.observer = new MutationObserver(() => {
      this.recargarCaptcha();
    });

    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  recargarCaptcha() {
    this.captchaActivo = false;
    this.captchaToken = null; // Limpiar token al recargar
    this.cdr.detectChanges();
    this.captchaActivo = true;
    this.cdr.detectChanges();
  }

  prefijoTelefono = '+57';

  paises = [
    { codigo: '+57', nombre: '🇨🇴 Colombia' },
    { codigo: '+1',  nombre: '🇺🇸 EE.UU / CA' },
    { codigo: '+52', nombre: '🇲🇽 México' },
    { codigo: '+34', nombre: '🇪🇸 España' },
    { codigo: '+54', nombre: '🇦🇷 Argentina' },
    { codigo: '+56', nombre: '🇨🇱 Chile' },
    { codigo: '+51', nombre: '🇵🇪 Perú' },
    { codigo: '+58', nombre: '🇻🇪 Venezuela' },
  ];

  private crearFormulario() {
    this.registroForm = this.formBuilder.group({
        nombre: ['', [Validators.required, Validators.maxLength(50)]],
        apellido: ['', [Validators.required, Validators.maxLength(50)]],
        documentoIdentidad: ['', [Validators.required, Validators.maxLength(20)]],
        telefono: ['', [
          Validators.required,
          Validators.maxLength(15),
          Validators.pattern(/^\d+$/)  // solo números
        ]],
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
    // Restaurar datos guardados
    const guardado = sessionStorage.getItem('registroFormData');
    if (guardado) {
      this.registroForm.patchValue(JSON.parse(guardado));
    }

    // Guardar en cada cambio
    this.registroForm.valueChanges.subscribe(values => {
      // No guardar la contraseña por seguridad
      const { contrasena, confirmcontrasena, ...resto } = values;
      sessionStorage.setItem('registroFormData', JSON.stringify(resto));
    });

  }

  onCaptchaResolved(token: string | null) {
    this.captchaToken = token;
  }

  onSubmit(): void {
    // 1. Validar si el captcha está resuelto
    if (!this.captchaToken) {
      this.result = this.t.login?.errorCaptcha || 'Por favor, completa la verificación (Captcha).';
      this.classResult = 'text-danger text-center fw-bold';
      return;
    }

    // 2. Bloquear botón y limpiar mensajes anteriores
    this.cargando = true;
    this.result = '';

    const newUser: any = {
      ...this.registroForm.value,
      telefono: this.prefijoTelefono + this.registroForm.value.telefono,
      recaptchaToken: this.captchaToken
    };



    this.usersService.registrar(newUser).subscribe({
      next: (data) => {
        this.cargando = false;
        sessionStorage.removeItem('registroFormData');
        this.result = 'Usuario registrado correctamente. Redirigiendo...';
        this.classResult = 'text-success text-center fw-bold';

        const userEmail = this.registroForm.get('email')?.value;
        localStorage.setItem('pendingActivationEmail', userEmail);

        setTimeout(() => {
          this.router.navigate(['/activar'], { state: { email: userEmail } });
        }, 2000);
      },
      error: (error) => {
        // --- LIBERAR BLOQUEO ---
        this.cargando = false;
        this.recargarCaptcha(); // El token ya no sirve si el backend dio error

        this.classResult = 'text-danger text-center fw-bold';

        // Capturar el mensaje real de ValueConflictException o error genérico
        if (error.error && error.error.message) {
          this.result = error.error.message;
        } else if (error.error && error.error instanceof Array) {
          this.result = error.error.map((item: ErrorResponse) => item.message).join(', ');
        } else if (typeof error.error === 'string') {
          this.result = error.error;
        } else {
          this.result = 'Error al registrar el usuario. El correo o cédula ya podrían estar en uso.';
        }

        this.cdr.detectChanges();
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

  soloNumeros(event: KeyboardEvent): boolean {
    const charCode = event.charCode;
    return charCode >= 48 && charCode <= 57; // solo el input de número, el + va en el select
  }
}
