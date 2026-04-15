import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from '../../servicios/webSocketService';
import { AuthService } from '../../servicios/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass, DatePipe } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  imports: [
    FormsModule,
    NgClass,
    CommonModule,
    DatePipe
  ]
})
export class ChatComponent implements OnInit, OnDestroy {

  // Estados de la UI
  isOpen = false;
  activeContact: any = null;
  loadingContacts = false;

  // Datos
  currentUserEmail = '';
  contactos: any[] = []; // Se llena desde el backend
  mensajes: any[] = [];
  nuevoMensaje = '';

  constructor(
    private webSocketService: WebSocketService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const email = this.authService.getUserEmail();
      const token = this.authService.getToken();

      if (email && token) {
        this.currentUserEmail = email;
        this.cargarContactos(); // Petición inicial

        this.webSocketService.connect(token, (mensajeRecibido) => {
          this.manejarMensajeEntrante(mensajeRecibido);
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.webSocketService.disconnect();
  }

  // --- PETICIONES API ---

  cargarContactos() {
    this.loadingContacts = true;
    // URL ajustada a tu backend
    const url = `http://localhost:8080/api/users/${this.currentUserEmail}/contacts`;

    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        this.contactos = res;
        this.loadingContacts = false;
      },
      error: (err) => {
        console.error('Error cargando contactos', err);
        this.loadingContacts = false;
        // Solo mostrar alerta si el error no es un 404 (que podría significar lista vacía)
        if (err.status !== 404) {
          this.authService.showAlert('error', 'Error al sincronizar contactos');
        }
      }
    });
  }

  // --- MÉTODOS DE LA UI ---

  toggleChatPanel() {
    if (!this.authService.isAuthenticated()) {
      this.authService.showAlert('error', 'Debes iniciar sesión para usar el chat');
      return;
    }
    this.isOpen = !this.isOpen;
    if (!this.isOpen) this.activeContact = null;
  }

  abrirChat(contacto: any) {
    this.activeContact = contacto;
    contacto.unread = 0;

    const urlHistorial = `http://localhost:8080/api/messages/${this.currentUserEmail}/${contacto.email}`;
    this.http.get<any[]>(urlHistorial).subscribe({
      next: (historial) => {
        this.mensajes = historial;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Error cargando historial', err);
        this.mensajes = [];
      }
    });
  }

  volverAContactos() {
    this.activeContact = null;
  }

  // --- LÓGICA DE MENSAJERÍA ---

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.activeContact) return;

    const mensajeDTO = {
      receptor: this.activeContact.email,
      contenido: this.nuevoMensaje
    };

    this.webSocketService.sendMessage(mensajeDTO);

    this.mensajes.push({
      emisor: this.currentUserEmail,
      receptor: this.activeContact.email,
      contenido: this.nuevoMensaje,
      fechaMensaje: new Date()
    });

    this.nuevoMensaje = '';
    this.scrollToBottom();
  }

  private manejarMensajeEntrante(mensajeRecibido: any) {
    if (this.activeContact && mensajeRecibido.emisor === this.activeContact.email) {
      this.mensajes.push(mensajeRecibido);
      this.scrollToBottom();
    } else {
      const contacto = this.contactos.find(c => c.email === mensajeRecibido.emisor);
      if (contacto) {
        contacto.unread++;
      }
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      const chatBody = document.getElementById('chat-body');
      if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
    }, 100);
  }
}
