import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core'; // Importado ChangeDetectorRef, OnInit, OnDestroy
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
export class RegistroComponent implements OnInit, OnDestroy { // Implementamos OnInit y OnDestroy
  registroForm!: FormGroup;
  result = '';
  classResult = 'success';
  verContra = false;
  verConfirmContra = false;
  captchaToken: string | null = null;

  // Control para el re-renderizado del captcha
  captchaActivo = true;
  private observer: MutationObserver | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private router: Router,
    protected redireccionamiento: RedireccionService,
    private cdr: ChangeDetectorRef // Inyectamos ChangeDetectorRef
  ) {
    this.crearFormulario();
  }

  ngOnInit() {
    // Configuramos el observador para detectar cambios en las clases del body (Modo Oscuro)
    this.observer = new MutationObserver(() => {
      this.recargarCaptcha();
    });

    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  ngOnDestroy() {
    // Limpiamos el observador al destruir el componente
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
      this.result = 'Por favor, completa la verificación de seguridad (Captcha).';
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
    this.verConfirmContra=!this.verConfirmContra;
  }

  redirigirPoliticaDatosConLocalStorage() {
    localStorage.setItem('migaPan','registro');
    this.redireccionamiento.redirigirAPoliticaDatos();
  }

  // Getter para pasar el tema al componente re-captcha
  get temaActual(): 'light' | 'dark' {
    return document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  }
}
