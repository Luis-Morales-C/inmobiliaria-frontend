import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricasService} from '../../servicios/metricas.service';

@Component({
  selector: 'app-metricas-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metricas-admin.component.html',
  styleUrls: ['./metricas-admin.component.css']
})
export class MetricasAdminComponent implements OnInit {

  tiempoRespuesta: number = 0;
  tasaExito: number = 0;
  tasaErrores: number = 0;
  cargando: boolean = true;

  constructor(private metricasService: MetricasService) {}

  ngOnInit(): void {
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.cargando = true;
    this.metricasService.getTodasLasMetricas().subscribe({
      next: (data) => {
        this.tiempoRespuesta = data.tiempoRespuesta;
        this.tasaExito = data.tasaExito;
        this.tasaErrores = data.tasaErrores;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando métricas', err);
        this.cargando = false;
      }
    });
  }
}
