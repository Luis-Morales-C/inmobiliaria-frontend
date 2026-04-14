import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricasService } from '../../servicios/metricas.service';
import { GraficaMetricaComponent} from '../grafica-metrica/grafica-metrica.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-metricas-admin',
  standalone: true,
  imports: [CommonModule, GraficaMetricaComponent], // ← reemplaza GrafanaPanelComponent
  templateUrl: './metricas-admin.component.html',
  styleUrls: ['./metricas-admin.component.css']
})
export class MetricasAdminComponent implements OnInit {

  // Valores actuales — tarjetas
  tiempoRespuestaLogin = 0;
  tasaExitoLogin = 0;
  tiempoRespuestaRegistroUsuario = 0;
  tasaErroresRegistroUsuario = 0;
  tiempoRespuestaRegistroInmueble = 0;
  tasaExitoActualizacionEstado = 0;
  cargando = true;

  // Datos históricos — gráficas
  historicoTiempoLogin: any = null;
  historicoTasaExito: any = null;
  historicoErroresRegistro: any = null;
  historicoTiempoInmueble: any = null;
  cargandoGraficas = true;

  constructor(private metricasService: MetricasService) {}

  ngOnInit(): void {
    this.cargarMetricas();
    this.cargarGraficas();
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

  cargarGraficas(): void {
    this.cargandoGraficas = true;
    forkJoin({
      tiempoLogin: this.metricasService.getHistoricoTiempoLogin(),
      tasaExito: this.metricasService.getHistoricoTasaExitoLogin(),
      erroresRegistro: this.metricasService.getHistoricoErroresRegistro(),
      tiempoInmueble: this.metricasService.getHistoricoTiempoInmueble()
    }).subscribe({
      next: (data) => {
        this.historicoTiempoLogin = data.tiempoLogin;
        this.historicoTasaExito = data.tasaExito;
        this.historicoErroresRegistro = data.erroresRegistro;
        this.historicoTiempoInmueble = data.tiempoInmueble;
        this.cargandoGraficas = false;
      },
      error: () => { this.cargandoGraficas = false; }
    });
  }
}
