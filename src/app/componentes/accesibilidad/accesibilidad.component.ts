import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';
import { IdiomaService, Idioma } from '../../servicios/idioma.service';
import { ES } from '../../i18n/es';

@Component({
  selector: 'app-accesibilidad',
  imports: [CommonModule, FormsModule],
  templateUrl: './accesibilidad.component.html',
  styleUrl: './accesibilidad.component.css'
})
export class AccesibilidadComponent implements OnInit, OnDestroy {
  menuVisible = false;
  zoom = 1;
  modoOscuro = false;
  altoContraste = false;
  idiomaSeleccionado: Idioma = 'es';
  t: typeof ES;

  private sub!: Subscription;

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    public idiomaService: IdiomaService
  ) {
    this.t = idiomaService.t;
  }

  ngOnInit() {
    this.sub = this.idiomaService.traducciones$.subscribe(t => {
      this.t = t;
    });

    this.idiomaSeleccionado = this.idiomaService.idioma;

    // Recuperar preferencias guardadas en localStorage
    const modoOscuroGuardado = localStorage.getItem('modoOscuro');
    if (modoOscuroGuardado === 'true') {
      this.modoOscuro = true;
      this.renderer.addClass(this.document.body, 'dark-mode');
    }

    const zoomGuardado = localStorage.getItem('zoom');
    if (zoomGuardado) {
      this.zoom = parseFloat(zoomGuardado);
      this.renderer.setStyle(this.document.body, 'zoom', String(this.zoom));
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  CambiarContraste() {
    if (this.altoContraste) {
      this.renderer.addClass(this.document.body, 'high-contrast');
    } else {
      this.renderer.removeClass(this.document.body, 'high-contrast');
    }
  }

  CambiarModoOscuro() {
    if (this.modoOscuro) {
      this.renderer.addClass(this.document.body, 'dark-mode');
      localStorage.setItem('modoOscuro', 'true');
    } else {
      this.renderer.removeClass(this.document.body, 'dark-mode');
      localStorage.setItem('modoOscuro', 'false');
    }
  }

  MostrarMenu() {
    this.menuVisible = !this.menuVisible;
  }

  actualizarZoom() {
    this.renderer.setStyle(this.document.body, 'zoom', String(this.zoom));
    localStorage.setItem('zoom', String(this.zoom));
  }

  cambiarIdioma() {
    this.idiomaService.cambiarIdioma(this.idiomaSeleccionado);
  }
}
