import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import {Router, RouterLink} from '@angular/router';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink,NgIf],
  templateUrl: './recuperar-contrasena.component.html',
  styleUrls: ['./recuperar-contrasena.component.css']
})
export class RecuperarContrasenaComponent implements OnInit {
  isSubmitting = false;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.form.get('email');
  }

  mostrarAlerta = false;

  solicitarCodigo() {
    this.mostrarAlerta = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mostrarAlerta = true;
      return;
    }

    this.isSubmitting = true;
    this.mostrarAlerta = false;

    const email = this.form.value.email!;
    this.authService.enviarCodigoRecuperacion(email)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          localStorage.setItem('recoveryEmail', email);
          this.router.navigate(['/cambiar-contrasena']);
        },
        error: () => this.isSubmitting = false
      });
  }
}
