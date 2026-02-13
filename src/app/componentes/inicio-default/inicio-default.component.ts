import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RedireccionService } from '../../servicios/redireccion.service';
import { InmuebleServiceService } from '../../servicios/inmueble-service.service';
import { InmuebleResponse } from '../../dto/inmueble-response';

@Component({
  selector: 'app-inicio-default',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio-default.component.html',
  styleUrl: './inicio-default.component.css'
})
export class InicioDefaultComponent implements OnInit {
  propiedadesDestacadas: InmuebleResponse[] = [];

  constructor(
    private router: Router,
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
}
