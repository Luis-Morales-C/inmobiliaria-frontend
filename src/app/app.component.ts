import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HeaderComponent} from './componentes/header/header.component';
import {FooterComponent} from './componentes/footer/footer.component';
import {AccesibilidadComponent} from './componentes/accesibilidad/accesibilidad.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [HeaderComponent, FooterComponent, RouterOutlet, AccesibilidadComponent]
})
export class AppComponent {
  title = 'Inmobiliaria Edén';
  footer = 'Universidad del Quindío';
}
