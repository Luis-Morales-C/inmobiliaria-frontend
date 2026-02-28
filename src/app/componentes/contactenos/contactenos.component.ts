import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contactenos',
  standalone: true,
  templateUrl: './contactenos.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  styleUrls: ['./contactenos.component.css']
})
export class ContactenosComponent {

  contactoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.contactoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      asunto: ['', Validators.required],
      mensaje: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  onSubmit() {
    if (this.contactoForm.invalid) {
      this.contactoForm.markAllAsTouched();
      return;
    }

    this.authService.enviarContacto(this.contactoForm.value)
      .subscribe({
        next: () => {
          this.contactoForm.reset();
        }
      });
  }
}
