import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivarCuentaService, ActivationResponse, ResendCodeResponse } from '../../servicios/activar-cuenta.service';

@Component({
  selector: 'app-activar',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './activar.component.html',
  styleUrls: ['./activar.component.css']
})
export class ActivarComponent implements OnInit {
  // Formulario reactivo para la activación
  activationForm: FormGroup;
  // Variables para controlar la UI
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  // Almacenar el email del usuario
  userEmail: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private activarCuentaService: ActivarCuentaService
  ) {
    // Inicializar el formulario con 6 campos para el código de activación
    this.activationForm = this.formBuilder.group({
      digit1: ['', [Validators.required, Validators.pattern('[a-zA-Z0-9]')]],
      digit2: ['', [Validators.required, Validators.pattern('[a-zA-Z0-9]')]],
      digit3: ['', [Validators.required, Validators.pattern('[a-zA-Z0-9]')]],
      digit4: ['', [Validators.required, Validators.pattern('[a-zA-Z0-9]')]],
      digit5: ['', [Validators.required, Validators.pattern('[a-zA-Z0-9]')]],
      digit6: ['', [Validators.required, Validators.pattern('[a-zA-Z0-9]')]]
    });
  }

  ngOnInit(): void {
    // Intentar obtener el email del usuario del localStorage o de parámetros de la ruta
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['email']) {
      this.userEmail = navigation.extras.state['email'];
      // Guardar en localStorage para uso posterior
      localStorage.setItem('pendingActivationEmail', this.userEmail);
    } else {
      // Recuperar del localStorage si existe
      this.userEmail = localStorage.getItem('pendingActivationEmail') || '';
    }
  }

  /**
   * Maneja el evento de envío del formulario de activación
   */
  onSubmit(): void {
    // Verificar que el formulario sea válido
    if (this.activationForm.invalid) {
      // Verificar si hay errores reales en los campos
      const values = this.activationForm.value;
      const isEmpty = !values.digit1 && !values.digit2 && !values.digit3 &&
                      !values.digit4 && !values.digit5 && !values.digit6;

      if (isEmpty) {
        this.errorMessage = 'Por favor, completa todos los campos del código.';
        this.showAlert('error', 'Por favor, completa todos los campos del código.');
        return;
      }

      // Verificar si hay campos con errores de validación
      let hasErrors = false;
      for (let i = 1; i <= 6; i++) {
        const control = this.activationForm.get(`digit${i}`);
        if (control && (control.errors?.['required'] || control.errors?.['pattern'])) {
          hasErrors = true;
          break;
        }
      }

      if (hasErrors) {
        this.errorMessage = 'Por favor, completa todos los campos del código con dígitos válidos.';
        this.showAlert('error', 'Por favor, completa todos los campos del código con dígitos válidos.');
        return;
      }
    }

    // Marcar que se está procesando la solicitud
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Obtener el código de activación del formulario ej : cf5bb2
    const activationCode = this.getActivationCode();

    // Verificar el código con el backend
    this.activarCuentaService.activateAccount(activationCode).subscribe({
      next: (response: string) => {
        this.successMessage = response || 'Usuario verificado correctamente';
        this.showAlert('success', this.successMessage);
        // Limpiar el email almacenado
        localStorage.removeItem('pendingActivationEmail');
        // Redirigir al login después de activar la cuenta
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error al activar la cuenta:', error);
        if (error.status === 0) {
          this.errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet.';
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else if (error.status >= 500) {
          this.errorMessage = 'Error en el servidor. Por favor, inténtalo más tarde.';
        } else {
          this.errorMessage = 'Código incorrecto o ha expirado. Por favor, inténtalo nuevamente.';
        }
        this.showAlert('error', this.errorMessage);
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Muestra una alerta visual del resultado de la operación
   * @param type Tipo de alerta (success o error)
   * @param message Mensaje a mostrar
   */
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
    alertDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';

    if (type === 'success') {
      alertDiv.style.backgroundColor = '#d4edda';
      alertDiv.style.color = '#155724';
      alertDiv.style.borderColor = '#c3e6cb';
    } else {
      alertDiv.style.backgroundColor = '#f8d7da';
      alertDiv.style.color = '#721c24';
      alertDiv.style.borderColor = '#f5c6cb';
    }

    document.body.appendChild(alertDiv);

    // Eliminar la alerta después de 3 segundos
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 3000);
  }

  /**
   * Obtiene el código de activación completo del formulario
   * @returns El código de activación de 6 dígitos
   */
  private getActivationCode(): string {
    const values = this.activationForm.value;
    return `${values.digit1}${values.digit2}${values.digit3}${values.digit4}${values.digit5}${values.digit6}`;
  }

  /**
   * Maneja el reenvío del código de activación
   */
  resendCode(): void {
    // Solicitar un nuevo código al backend
    if (!this.userEmail) {
      // Si no tenemos el email, mostrar un mensaje de error
      this.showAlert('error', 'No se pudo encontrar el correo electrónico del usuario. Por favor, regístrate nuevamente.');
      return;
    }

    this.activarCuentaService.resendActivationCode(this.userEmail).subscribe({
      next: (response: ResendCodeResponse) => {
        this.showAlert('success', response.message || 'Se ha enviado un nuevo código a tu correo electrónico.');
      },
      error: (error) => {
        console.error('Error al reenviar el código:', error);
        let errorMessage = '';
        if (error.status === 0) {
          errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet.';
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else {
          errorMessage = 'Error al reenviar el código. Por favor, inténtalo más tarde.';
        }
        this.showAlert('error', errorMessage);
      }
    });
  }

  /**
   * Maneja la navegación entre campos de entrada del código
   * @param event Evento del teclado
   * @param currentIndex Índice del campo actual
   */
  onKeyDown(event: KeyboardEvent, currentIndex: number): void {
    const input = event.target as HTMLInputElement;

    // Si se presiona "Backspace" y el campo está vacío, moverse al campo anterior
    if (event.key === 'Backspace' && input.value === '' && currentIndex > 1) {
      const previousInput = document.getElementById(`digit${currentIndex - 1}`) as HTMLInputElement;
      if (previousInput) {
        previousInput.focus();
      }
    }
  }

  /**
   * Maneja el evento de entrada en los campos del código
   * @param event Evento de entrada
   * @param currentIndex Índice del campo actual
   */
  onInput(event: Event, currentIndex: number): void {
    const input = event.target as HTMLInputElement;

    // Limpiar mensajes de error cuando el usuario empieza a escribir
    this.errorMessage = '';

    // Si se ingresa un dígito, moverse al siguiente campo
    if (input.value.length === 1 && currentIndex < 6) {
      const nextInput = document.getElementById(`digit${currentIndex + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }
}
