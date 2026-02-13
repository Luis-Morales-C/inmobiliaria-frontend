import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import {AuthService} from '../../servicios/auth.service';
import {NgClass, NgIf} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {RedireccionService} from '../../servicios/redireccion.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, MessageModule, NgIf, RouterLink, NgClass],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  loading: boolean = false;
  verContra = false;

  constructor(private fb: FormBuilder, private authService: AuthService, protected redireccionamiento: RedireccionService,private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      contrasena: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      const { email, contrasena } = this.loginForm.value;

      this.authService.login(email, contrasena).subscribe({
        next: (response) => {
          this.loading = false;
          // Mensaje de éxito usando showAlert
          this.showAlert('success', 'Inicio de sesión exitoso');
          const primerRol = this.authService.getPrimerRol();
          if (primerRol === 'AGENTE')
          {
            this.router.navigate(['/ventanaAgente']);
          }
          else if (primerRol === 'CLIENTE')
          {
            this.router.navigate(['/inicio']);
          }
        },
        error: (err: any) => {
          this.loading = false;

          // Tomar el mensaje enviado por el backend
          const mensajeBackend = err.error?.message;

          // Decidir el mensaje a mostrar según el contenido
          let mensajeAMostrar = mensajeBackend || 'Error desconocido';

          switch (mensajeBackend) {
            case 'Usuario no encontrado':
              mensajeAMostrar = 'El email ingresado no está registrado';
              break;
            case 'Contraseña incorrecta':
              mensajeAMostrar = 'La contraseña es incorrecta';
              break;
            case 'Usuario bloqueado':
              mensajeAMostrar = 'Tu cuenta está bloqueada, contacta al soporte';
              break;
            // Puedes agregar más casos según los mensajes que devuelva tu backend
          }

          // Mostrar el mensaje con showAlert
          this.showAlert('error', mensajeAMostrar);
        }
      });
    } else {
      console.warn('Formulario inválido:', this.loginForm);
      this.showAlert('error', 'Por favor completa todos los campos correctamente');
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
  }

  mostrarContrasenia() {
    this.verContra = !this.verContra;
  }

}
