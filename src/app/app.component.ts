import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HeaderComponent} from './componentes/header/header.component';
import {FooterComponent} from './componentes/footer/footer.component';
import {AccesibilidadComponent} from './componentes/accesibilidad/accesibilidad.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {ChatbotComponent} from './componentes/chatbot/chatbot.component';
import {ChatbotIaComponent} from './componentes/chatbot-ia/chatbot-ia.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [HeaderComponent, FooterComponent, RouterOutlet, AccesibilidadComponent, ChatbotComponent, ChatbotIaComponent]
})
export class AppComponent {
  title = 'Inmobiliaria Edén';
  footer = 'Universidad del Quindío';

  isMobile = false;


  constructor(private breakpointObserver: BreakpointObserver) {

  }

  ngOnInit() {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }
}
