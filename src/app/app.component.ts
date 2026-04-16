import { Component, OnInit } from '@angular/core'; // Añadí OnInit que faltaba en tus imports
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './componentes/header/header.component';
import { FooterComponent } from './componentes/footer/footer.component';
import { AccesibilidadComponent } from './componentes/accesibilidad/accesibilidad.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChatComponent } from './componentes/chat/chat.component';
import { AuthService } from './servicios/auth.service';
import { CommonModule } from '@angular/common';
import {ChatbotComponent} from './componentes/chatbot/chatbot.component';

@Component({
  selector: 'app-root',
  standalone: true, // 🚀 AÑADE ESTA LÍNEA
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  // Quité FormsModule de aquí porque el AppComponent no tiene formularios
  imports: [HeaderComponent, FooterComponent, RouterOutlet, AccesibilidadComponent, ChatComponent, CommonModule, ChatbotComponent]
})
export class AppComponent implements OnInit { // 🚀 Asegúrate de implementar OnInit
  title = 'Inmobiliaria Edén';
  footer = 'Universidad del Quindío';
  isMobile = false;

  constructor(private breakpointObserver: BreakpointObserver, public authService: AuthService) {}

  ngOnInit() {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }
}
