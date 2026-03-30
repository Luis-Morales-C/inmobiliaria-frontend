import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricasService } from '../../servicios/metricas.service';

@Component({
  selector: 'app-metricas-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metricas-admin.component.html',
  styleUrls: ['./metricas-admin.component.css']
})
export class MetricasAdminComponent implements OnInit {

  tiempoRespuestaLogin: number = 0;
  tasaExitoLogin: number = 0;
  tiempoRespuestaRegistroUsuario: number = 0;
  tasaErroresRegistroUsuario: number = 0;
  tiempoRespuestaRegistroInmueble: number = 0;
  tasaExitoActualizacionEstado: number = 0;
  cargando: boolean = true;

  constructor(private metricasService: MetricasService) {}

  ngOnInit(): void {
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.cargando = true;
    this.metricasService.getTodasLasMetricas().subscribe({
      next: (data) => {
        this.tiempoRespuestaLogin = data.tiempoRespuestaLogin;
        this.tasaExitoLogin = data.tasaExitoLogin;
        this.tiempoRespuestaRegistroUsuario = data.tiempoRespuestaRegistroUsuario;
        this.tasaErroresRegistroUsuario = data.tasaErroresRegistroUsuario;
        this.tiempoRespuestaRegistroInmueble = data.tiempoRespuestaRegistroInmueble;
        this.tasaExitoActualizacionEstado = data.tasaExitoActualizacionEstado;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando métricas', err);
        this.cargando = false;
      }
    });
  }
}
