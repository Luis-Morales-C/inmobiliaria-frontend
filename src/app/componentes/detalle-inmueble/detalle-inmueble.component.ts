import { Component, Input, Output, EventEmitter, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InmuebleResponse } from '../../dto/inmueble-response';
import { AgenteResponse } from '../../dto/AgenteResponse';
import { MapaService } from '../../mapa.service';

@Component({
  selector: 'app-detalle-inmueble',
  templateUrl: './detalle-inmueble.component.html',
  styleUrls: ['./detalle-inmueble.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class DetalleInmuebleComponent implements AfterViewInit, OnDestroy {
  @Input() inmueble!: InmuebleResponse;
  @Output() cerrar = new EventEmitter<void>();

  imagenActual = 0;

  constructor(private mapaService: MapaService) {}

  ngAfterViewInit(): void {
    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
      if (this.inmueble?.latitud && this.inmueble?.longitud) {
        this.mapaService.mostrarInmuebleEnMapa(
          'mapa-detalle',
          this.inmueble.latitud,
          this.inmueble.longitud,
          `${this.inmueble.tipo} · ${this.inmueble.ciudad}`
        );
      }
    }, 200);
  }

  ngOnDestroy(): void {
    this.mapaService.destruirMapaDetalle();
  }

  anteriorImagen(): void {
    if (this.imagenActual > 0) this.imagenActual--;
  }

  siguienteImagen(): void {
    if (this.imagenActual < this.inmueble.imagenes.length - 1) this.imagenActual++;
  }

  cerrarDetalle(): void {
    this.cerrar.emit();
  }

  contactarAgente(agente: AgenteResponse): void {
    // lógica de chat posterior
  }
}
