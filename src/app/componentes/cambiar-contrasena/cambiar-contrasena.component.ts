import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { NgIf, NgClass } from '@angular/common';
import { IdiomaService } from '../../servicios/idioma.service';
import { ES } from '../../i18n/es';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cambiar-contrasena',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf, NgClass],
  templateUrl: './cambiar-contrasena.component.html',
  styleUrls: ['./cambiar-contrasena.component.css']
})
export class CambiarContrasenaComponent implements OnInit, OnDestroy {

  form!: FormGroup;
  isSubmitting = false;
  submitAttempted = false;

  result = '';
  classResult = 'success';

  verContra = false;
  verConfirmContra = false;
  t: typeof ES;
  private sub!: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public idiomaService: IdiomaService
  ) {
    this.t = idiomaService.t;
  }

  ngOnInit(): void {
    this.sub = this.idiomaService.traducciones$.subscribe(t => {
      this.t = t;
    });

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

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
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
