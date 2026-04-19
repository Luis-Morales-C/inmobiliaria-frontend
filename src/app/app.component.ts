import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HeaderComponent} from './componentes/header/header.component';
import {FooterComponent} from './componentes/footer/footer.component';
import {AccesibilidadComponent} from './componentes/accesibilidad/accesibilidad.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {ChatbotComponent} from './componentes/chatbot/chatbot.component';
import {ChatFlotanteComponent} from './componentes/chat-flotante/chat-flotante.component';
import {AuthService} from './servicios/auth.service';
import {ChatService} from './servicios/chat.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [HeaderComponent, FooterComponent, RouterOutlet, AccesibilidadComponent, ChatbotComponent, ChatFlotanteComponent]
})
export class AppComponent {
  title = 'Inmobiliaria Edén';
  footer = 'Universidad del Quindío';

  isMobile = false;


  constructor(private breakpointObserver: BreakpointObserver,private authService: AuthService, private chatService: ChatService) {

  }

  ngOnInit() {

    console.log('AppComponent iniciado');
    console.log('Autenticado:', this.authService.isAuthenticated());

    if (this.authService.isAuthenticated()) {
      this.chatService.conectarWebSocket();
    }


    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }
}
