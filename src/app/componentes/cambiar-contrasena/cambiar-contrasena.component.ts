import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-cambiar-contrasena',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf, NgClass],
  templateUrl: './cambiar-contrasena.component.html',
  styleUrls: ['./cambiar-contrasena.component.css']
})
export class CambiarContrasenaComponent implements OnInit {

  form!: FormGroup;
  isSubmitting = false;
  submitAttempted = false;

  result = '';
  classResult = 'success';

  verContra = false;
  verConfirmContra = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      codigo: ['', Validators.required],
      nuevaContrasena: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)
      ]],
      confirmarContrasena: ['', Validators.required]
    }, { validators: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(form: AbstractControl) {
    const pass = form.get('nuevaContrasena')?.value;
    const confirm = form.get('confirmarContrasena')?.value;
    return pass === confirm ? null : { passwordsMismatch: true };
  }

  cambiarContrasena() {
    this.submitAttempted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = localStorage.getItem('recoveryEmail');
    if (!email) {
      this.result = 'No se encontró el correo';
      this.classResult = 'text-danger';
      return;
    }

    this.isSubmitting = true;
    this.result = '';
    this.authService.cambiarContrasenaConCodigo(email, this.form.value.codigo, this.form.value.nuevaContrasena)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          localStorage.removeItem('recoveryEmail');
          this.result = 'Contraseña cambiada correctamente. Redirigiendo al login...';
          this.classResult = 'success';

          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.result = error?.error?.message || 'Error al cambiar la contraseña';
          this.classResult = 'text-danger';
        }
      });
  }

  mostrarContrasenia() { this.verContra = !this.verContra; }
  mostrarConfirmContrasenia() { this.verConfirmContra = !this.verConfirmContra; }
}
