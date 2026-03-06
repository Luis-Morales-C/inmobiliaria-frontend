import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import {Router, RouterLink} from '@angular/router';
import {NgIf} from '@angular/common';
import { IdiomaService } from '../../servicios/idioma.service';
import { ES } from '../../i18n/es';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink,NgIf],
  templateUrl: './recuperar-contrasena.component.html',
  styleUrls: ['./recuperar-contrasena.component.css']
})
export class RecuperarContrasenaComponent implements OnInit, OnDestroy {
  isSubmitting = false;
  form!: FormGroup;
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
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
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
