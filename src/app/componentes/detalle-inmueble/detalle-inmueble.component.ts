import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InmuebleResponse } from '../../dto/inmueble-response';

@Component({
  selector: 'app-detalle-inmueble',
  templateUrl: './detalle-inmueble.component.html',
  styleUrls: ['./detalle-inmueble.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class DetalleInmuebleComponent {
  @Input() inmueble!: InmuebleResponse;
  @Output() cerrar = new EventEmitter<void>();

  imagenActual = 0;

  anteriorImagen(): void {
    if (this.imagenActual > 0) this.imagenActual--;
  }

  siguienteImagen(): void {
    if (this.imagenActual < this.inmueble.imagenes.length - 1) this.imagenActual++;
  }

  cerrarDetalle(): void {
    this.cerrar.emit();
  }
}
