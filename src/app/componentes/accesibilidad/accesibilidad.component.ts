import { Component } from '@angular/core';
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
export class AccesibilidadComponent {
  menuVisible = false;
  zoom = 1;
  modoOscuro = false;
  altoContraste = false;

  constructor(private renderer: Renderer2, @Inject(DOCUMENT) private document: Document) {}

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
    } else {
      this.renderer.removeClass(this.document.body, 'dark-mode');
    }
  }

  MostrarMenu() {
    this.menuVisible = !this.menuVisible;
  }

  actualizarZoom() {
    this.renderer.setStyle(this.document.body, 'zoom', String(this.zoom));
  }
}
