import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // Añadidos ChangeDetectorRef, OnInit, OnDestroy
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
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
export class ContactenosComponent implements OnInit, OnDestroy { // Implementamos interfaces

  contactoForm: FormGroup;
  captchaToken: string | null = null;

  // Control para el refresco del captcha
  captchaActivo = true;
  private observer: MutationObserver | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef // Inyectado para forzar renderizado
  ) {
    this.contactoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      asunto: ['', Validators.required],
      mensaje: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    // Configuramos el observador para detectar cambios de clase en el body
    this.observer = new MutationObserver(() => {
      this.recargarCaptcha();
    });

    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  ngOnDestroy(): void {
    // Desconectamos para evitar fugas de memoria
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

  // Getter para obtener el tema actual
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
          // Forzamos un refresco tras el envío exitoso para limpiar el widget
          this.recargarCaptcha();
          alert('Mensaje enviado con éxito');
        },
        error: (err) => {
          console.error('Error al enviar:', err);
          this.captchaToken = null;
          this.recargarCaptcha(); // Resetear visualmente ante error
        }
      });
  }
}
