import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InmuebleResponse } from '../../dto/inmueble-response';
import { InmuebleServiceService } from '../../servicios/inmueble-service.service';
import { UbicacionService } from '../../servicios/ubicacion.service'; //  agregar
import {DetalleInmuebleComponent} from '../detalle-inmueble/detalle-inmueble.component';
import {RedireccionService} from "../../servicios/redireccion.service";
import {AuthService} from "../../servicios/auth.service";
import { ChatbotEstadoService } from '../../servicios/chatbot-estado.service';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule,DetalleInmuebleComponent]
})
export class CatalogoComponent implements OnInit {

  inmuebles: InmuebleResponse[] = [];
  cargando = false;
  totalPaginas = 0;
  paginaActual = 0;

  mostrarDetalle = false;
  inmuebleSeleccionado: InmuebleResponse | null = null;


  // Agregar estas tres propiedades
  departamentos: string[] = [];
  ciudadesFiltradas: string[] = [];
  private ubicacionData: Record<string, string[]> = {};

  filtros = {
    ciudad: '',
    departamento: '',
    tipo: '',
    tipoNegocio: '',
    precioMin: null as number | null,
    precioMax: null as number | null,
    habitacionesMin: null as number | null,
    banosMin: null as number | null,
    parqueaderosMin: null as number | null,
    estado: '',
  };

  tiposInmueble = ['CASA', 'APARTAMENTO', 'LOCAL', 'LOTE', 'FINCA'];
  tiposNegocio = ['VENTA', 'ALQUILER', 'PERMUTA'];

  constructor(
    private inmuebleService: InmuebleServiceService,
    private ubicacionService: UbicacionService ,//  inyectar
    private redireccionamiento: RedireccionService,
    private authService: AuthService,
    private chatbotEstado: ChatbotEstadoService
  ) {
  }

  ngOnInit(): void {
    //  Cargar departamentos al iniciar
    this.ubicacionService.getDepartamentosCiudades().subscribe(data => {
      this.ubicacionData = data;
      this.departamentos = Object.keys(data).sort();
    });

    // ← Agregar este bloque:
    const filtrosChatbot = this.chatbotEstado.consumirFiltros();
    if (filtrosChatbot) {
      this.filtros.ciudad       = filtrosChatbot.ciudad       ?? '';
      this.filtros.departamento = filtrosChatbot.departamento ?? '';
      this.filtros.tipo         = filtrosChatbot.tipo         ?? '';
      this.filtros.tipoNegocio  = filtrosChatbot.tipoNegocio  ?? '';
      this.filtros.precioMin    = filtrosChatbot.precioMin    ?? null;
      this.filtros.precioMax    = filtrosChatbot.precioMax    ?? null;
      this.filtros.habitacionesMin = filtrosChatbot.habitacionesMin ?? null;
      this.filtros.banosMin     = filtrosChatbot.banosMin     ?? null;
    }

    this.buscar();
  }

  //  Agregar este metodo
  onDepartamentoChange(event: Event): void {
    const depto = (event.target as HTMLSelectElement).value;
    this.ciudadesFiltradas = this.ubicacionData[depto] ?? [];
    this.filtros.ciudad = ''; // limpiar ciudad al cambiar departamento
  }

  buscar(pagina: number = 0): void {
    this.cargando = true;
    this.paginaActual = pagina;
    this.inmuebleService.buscarCatalogo(this.filtros, pagina).subscribe({
      next: (data) => {
        this.inmuebles = data.content;
        this.totalPaginas = data.totalPages;
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      ciudad: '', departamento: '', tipo: '', tipoNegocio: '',
      precioMin: null, precioMax: null, habitacionesMin: null, banosMin: null, estado: '', parqueaderosMin: null,
    };
    this.ciudadesFiltradas = []; //  limpiar también las ciudades
    this.buscar();
  }

  get paginas(): number[] {
    return Array.from({length: this.totalPaginas}, (_, i) => i);
  }


  abrirDetalle(p: InmuebleResponse): void {
    this.inmuebleSeleccionado = p;
    this.mostrarDetalle = true;
  }
  volverInicio(): void {
    // Verificamos si hay una sesión activa para saber a qué Home enviarlo
    if (this.authService.getToken() == null) {
      this.redireccionamiento.redirigirAHome();
    } else {
      this.redireccionamiento.redirigirAHomeIngresado();
    }
  }
}
