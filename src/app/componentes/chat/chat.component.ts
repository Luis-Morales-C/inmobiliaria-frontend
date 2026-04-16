import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Contacto } from '../../dto/contacto';
import { AuthService } from '../../servicios/auth.service';
import {ContactoService} from '../../servicios/ContactoService';
import {WebSocketService} from '../../servicios/webSocketService';

interface MensajeDTO {
  emisor: string;
  receptor: string;
  contenido: string;
  fechaMensaje?: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('mensajesContainer') mensajesContainer!: ElementRef;

  panelAbierto = false;
  contactoSeleccionado: Contacto | null = null;
  contactos: Contacto[] = [];
  mensajes: MensajeDTO[] = [];
  nuevoMensaje = '';
  userEmail: string = '';
  private debeScrollear = false;

  constructor(
    private contactoService: ContactoService,
    private wsService: WebSocketService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.userEmail = this.authService.getUserEmail() || '';

    const token = this.authService.getToken();
    if (token && this.userEmail) {
      this.wsService.connect(token, this.userEmail, (msg: MensajeDTO) => {
        // Solo agrega si el mensaje es de la conversación activa
        if (
          this.contactoSeleccionado &&
          (msg.emisor === this.contactoSeleccionado.email ||
            msg.receptor === this.contactoSeleccionado.email)
        ) {
          this.mensajes.push(msg);
          this.debeScrollear = true;
        }
      });
    }

    this.contactoService.getContactos().subscribe({
      next: (data) => this.contactos = data,
      error: (err) => console.error('Error cargando contactos', err)
    });
  }

  ngAfterViewChecked() {
    if (this.debeScrollear) {
      this.scrollAlFinal();
      this.debeScrollear = false;
    }
  }

  ngOnDestroy() {
    this.wsService.disconnect();
  }

  togglePanel() {
    this.panelAbierto = !this.panelAbierto;
    if (!this.panelAbierto) {
      this.contactoSeleccionado = null;
      this.mensajes = [];
    }
  }

  abrirChat(contacto: Contacto) {
    this.contactoSeleccionado = contacto;
    this.mensajes = [];

    this.http.get<MensajeDTO[]>(
      `http://localhost:8080/api/chat/${contacto.email}`
    ).subscribe({
      next: (historial) => {
        this.mensajes = historial;
        this.debeScrollear = true;
      },
      error: (err) => console.error('Error cargando historial', err)
    });
  }

  volverAContactos() {
    this.contactoSeleccionado = null;
    this.mensajes = [];
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.contactoSeleccionado) return;

    const dto: MensajeDTO = {
      emisor: this.userEmail,
      receptor: this.contactoSeleccionado.email,
      contenido: this.nuevoMensaje.trim()
    };

    this.wsService.sendMessage(dto);

    // Agrega el mensaje propio inmediatamente en la UI
    this.mensajes.push({ ...dto, fechaMensaje: new Date().toISOString() });
    this.nuevoMensaje = '';
    this.debeScrollear = true;
  }

  esMio(msg: MensajeDTO): boolean {
    return msg.emisor === this.userEmail;
  }

  private scrollAlFinal() {
    try {
      const el = this.mensajesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
