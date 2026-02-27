import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RedireccionService } from '../../servicios/redireccion.service';
import { InmuebleServiceService } from '../../servicios/inmueble-service.service';
import { InmuebleResponse } from '../../dto/inmueble-response';

@Component({
  selector: 'app-inicio-default',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio-default.component.html',
  styleUrls: ['./inicio-default.component.css']
})
export class InicioDefaultComponent implements OnInit {
  propiedadesDestacadas: InmuebleResponse[] = [];

  constructor(
    protected redireccionamiento: RedireccionService,
    protected inmuebleService: InmuebleServiceService
  ) {}

  ngOnInit(): void {
    this.inmuebleService.obtenerListaDeInmuebles().subscribe({
      next: (inmuebles) => {
        this.propiedadesDestacadas = inmuebles;
        console.log('Propiedades destacadas cargadas:', inmuebles);
      },
      error: (err) => {
        console.error('Error al obtener inmuebles', err);
      }
    });
  }

  mostrarModalDetalle = false;
  detalleInmueble: InmuebleResponse | null = null;

  // 🔹 Método para abrir el modal de detalles
  abrirModalDetalles(inmueble: InmuebleResponse): void {
    this.detalleInmueble = inmueble;
    this.mostrarModalDetalle = true;
  }

  // 🔹 Método para cerrar el modal de detalles
  cerrarModalDetalles(): void {
    this.mostrarModalDetalle = false;
    this.detalleInmueble = null;
  }
}
