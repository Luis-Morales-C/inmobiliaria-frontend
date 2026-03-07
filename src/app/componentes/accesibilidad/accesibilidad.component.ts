import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-accesibilidad',
  imports: [CommonModule, FormsModule],
  templateUrl: './accesibilidad.component.html',
  styleUrl: './accesibilidad.component.css'
})
export class AccesibilidadComponent implements OnInit {
  menuVisible = false;
  zoom = 1;
  modoOscuro = false;
  altoContraste = false;

  constructor(private renderer: Renderer2, @Inject(DOCUMENT) private document: Document) {}

  ngOnInit() {
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
}
