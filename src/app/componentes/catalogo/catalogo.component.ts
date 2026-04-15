import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {InmuebleResponse} from '../../dto/inmueble-response';
import {InmuebleServiceService} from '../../servicios/inmueble-service.service';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class CatalogoComponent implements OnInit {

  inmuebles: InmuebleResponse[] = [];
  cargando = false;
  totalPaginas = 0;
  paginaActual = 0;

  filtros = {
    ciudad: '',
    departamento: '',
    tipo: '',
    tipoNegocio: '',
    precioMin: null as number | null,
    precioMax: null as number | null,
    habitacionesMin: null as number | null,
    banosMin: null as number | null,
    estado: '',
  };

  tiposInmueble = ['CASA', 'APARTAMENTO', 'LOCAL', 'LOTE', 'FINCA'];
  tiposNegocio  = ['VENTA', 'ALQUILER', 'PERMUTA'];

  constructor(private inmuebleService: InmuebleServiceService) {}

  ngOnInit(): void {
    this.buscar();
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
      precioMin: null, precioMax: null, habitacionesMin: null, banosMin: null,estado: '',
    };
    this.buscar();
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i);
  }

  abrirDetalle(p: InmuebleResponse) {

  }
}
