import {
  Component, Input, OnChanges, OnDestroy,
  ElementRef, ViewChild, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-grafica-metrica',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card shadow-sm h-100">
      <div class="card-body">
        <h6 class="card-subtitle mb-3 text-muted">{{ titulo }}</h6>
        <div *ngIf="sinDatos" class="text-center text-muted py-4">
          <small>Sin datos suficientes aún</small>
        </div>
        <canvas #chartCanvas [style.display]="sinDatos ? 'none' : 'block'" height="120"></canvas>
      </div>
    </div>
  `
})
export class GraficaMetricaComponent implements OnChanges, OnDestroy {
  @Input() titulo: string = '';
  @Input() datos: any = null;
  @Input() etiqueta: string = '';
  @Input() color: string = '#0d6efd';
  @Input() unidad: string = '';

  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  sinDatos = true;

  ngOnChanges(): void {
    if (this.datos) {
      // Esperar a que el canvas esté disponible en el DOM
      setTimeout(() => this.renderizar(), 50);
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private renderizar(): void {
    if (!this.canvasRef?.nativeElement) return;

    const result = this.datos?.data?.result?.[0]?.values;
    if (!result || result.length === 0) {
      this.sinDatos = true;
      return;
    }

    this.sinDatos = false;

    const labels = result.map((v: any[]) => {
      const d = new Date(v[0] * 1000);
      return d.getHours().toString().padStart(2, '0') + ':' +
        d.getMinutes().toString().padStart(2, '0');
    });

    const valores = result.map((v: any[]) => {
      const n = parseFloat(v[1]);
      if (isNaN(n)) return 0;
      return this.unidad === 'ms' ? +(n * 1000).toFixed(0) : +n.toFixed(2);
    });

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `${this.etiqueta} (${this.unidad})`,
          data: valores,
          borderColor: this.color,
          backgroundColor: this.color + '22',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} ${this.unidad}`
            }
          }
        },
        scales: {
          x: {
            ticks: { maxTicksLimit: 8, font: { size: 10 } },
            grid: { display: false }
          },
          y: { ticks: { font: { size: 10 } } }
        }
      }
    };

    this.chart?.destroy();
    this.chart = new Chart(this.canvasRef.nativeElement, config);
  }
}
