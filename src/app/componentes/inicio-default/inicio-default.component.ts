import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RedireccionService } from '../../servicios/redireccion.service';
import { InmuebleServiceService } from '../../servicios/inmueble-service.service';
import { InmuebleResponse } from '../../dto/inmueble-response';
import { IdiomaService } from '../../servicios/idioma.service';
import { ES } from '../../i18n/es';
import { Subscription } from 'rxjs';
import { ChatbotComponent } from '../chatbot/chatbot.component';
import {DetalleInmuebleComponent} from '../detalle-inmueble/detalle-inmueble.component';

@Component({
  selector: 'app-inicio-default',
  standalone: true,
  imports: [CommonModule, ChatbotComponent, DetalleInmuebleComponent],
  templateUrl: './inicio-default.component.html',
  styleUrls: ['./inicio-default.component.css']
})
export class InicioDefaultComponent implements OnInit, OnDestroy {
  propiedadesDestacadas: InmuebleResponse[] = [];
  t: typeof ES;
  private sub!: Subscription;

  constructor(
    protected redireccionamiento: RedireccionService,
    protected inmuebleService: InmuebleServiceService,
    public idiomaService: IdiomaService
  ) {
    this.t = idiomaService.t;
  }

  ngOnInit(): void {
    this.sub = this.idiomaService.traducciones$.subscribe(t => {
      this.t = t;
    });

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

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
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
