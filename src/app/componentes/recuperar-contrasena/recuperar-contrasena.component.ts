import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // Añadidos OnDestroy y ChangeDetectorRef
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
export class RecuperarContrasenaComponent implements OnInit, OnDestroy {
  isSubmitting = false;
  form!: FormGroup;
  captchaToken: string | null = null;
  mostrarAlerta = false;

  // Propiedades para el refresco dinámico del tema
  captchaActivo = true;
  private observer: MutationObserver | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef // Inyectado para forzar la actualización visual
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // CONFIGURACIÓN DEL OBSERVADOR: Detecta cambios en la clase 'dark-mode' del body
    this.observer = new MutationObserver(() => {
      this.recargarCaptcha();
    });

    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  ngOnDestroy(): void {
    // Es vital desconectar el observador al destruir el componente para evitar fugas de memoria
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  recargarCaptcha() {
    this.captchaActivo = false;
    this.cdr.detectChanges(); // Elimina el captcha viejo
    this.captchaActivo = true;
    this.cdr.detectChanges(); // Crea el captcha nuevo con el tema actualizado
  }

  get email() {
    return this.form.get('email');
  }

  // Getter para detectar el tema actual del body
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
          this.captchaToken = null; // Resetear token por seguridad
        }
      });
  }
}
