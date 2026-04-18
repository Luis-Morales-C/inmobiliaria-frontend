// chat-flotante.component.ts
import {
  Component, OnInit, OnDestroy, AfterViewChecked,
  ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../servicios/chat.service';
import { AuthService } from '../../servicios/auth.service';
import { ConversacionDetalleDto, MensajeDto } from '../../dto/chat/chat.models';

@Component({
  selector: 'app-chat-flotante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-flotante.component.html',
  styleUrls: ['./chat-flotante.component.css']
})
export class ChatFlotanteComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  panelAbierto = false;
  conversacionActiva: ConversacionDetalleDto | null = null;
  totalNoLeidos = 0;
  textoMensaje = '';
  miId = 0;

  get conversaciones$() {
    return this.chatService.conversaciones$;
  }

  private subs = new Subscription();
  private debeScroll = false;
  private pollingConversacion: any = null;
  private pollingLista: any = null;

  constructor(
    public chatService: ChatService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.subs.add(this.chatService.panelAbierto$.subscribe(v => {
      this.panelAbierto = v;
      if (v) {
        this.iniciarPollingLista();
      } else {
        this.detenerPollingLista();
        this.detenerPollingConversacion();
      }
    }));

    this.subs.add(this.chatService.conversacionActiva$.subscribe(conv => {
      if (conv) {
        const idStr = this.authService.obtenerIdUsuario();
        this.miId = idStr ? parseInt(idStr, 10) : 0;
        this.iniciarPollingConversacion(conv.id);
      } else {
        this.detenerPollingConversacion();
      }
      this.conversacionActiva = conv;
      this.debeScroll = true;
    }));

    this.subs.add(this.chatService.mensajeNuevo$.subscribe((msg: MensajeDto) => {
      const activa = this.conversacionActiva;
      if (activa && msg.conversacionId === activa.id) {
        const yaExiste = activa.mensajes.some(m => m.id === msg.id && m.id !== -1);
        if (!yaExiste) {
          this.conversacionActiva = { ...activa, mensajes: [...activa.mensajes, msg] };
        }
      }
      this.debeScroll = true;
    }));

    this.subs.add(this.chatService.totalNoLeidos$.subscribe(n => this.totalNoLeidos = n));
  }

  private iniciarPollingConversacion(conversacionId: number): void {
    this.detenerPollingConversacion();
    this.pollingConversacion = setInterval(() => {
      if (this.conversacionActiva) {
        this.chatService.refrescarConversacionActiva(conversacionId);
      }
    }, 2000);
  }

  private detenerPollingConversacion(): void {
    if (this.pollingConversacion) {
      clearInterval(this.pollingConversacion);
      this.pollingConversacion = null;
    }
  }

  private iniciarPollingLista(): void {
    this.detenerPollingLista();
    this.pollingLista = setInterval(() => {
      this.chatService.refrescarLista();
    }, 5000);
  }

  private detenerPollingLista(): void {
    if (this.pollingLista) {
      clearInterval(this.pollingLista);
      this.pollingLista = null;
    }
  }

  ngAfterViewChecked(): void {
    if (this.debeScroll && this.scrollContainer) {
      try {
        const el = this.scrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      } catch {}
      this.debeScroll = false;
    }
  }

  esMio(msg: MensajeDto): boolean {
    return Number(msg.emisorId) === this.miId;
  }

  onEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (ke.key === 'Enter' && !ke.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  enviarMensaje(): void {
    const texto = this.textoMensaje.trim();
    if (!texto || !this.conversacionActiva) return;

    this.chatService.enviarMensaje({
      conversacionId: this.conversacionActiva.id,
      receptorId: this.conversacionActiva.otroUsuarioId,
      contenido: texto,
    });

    this.textoMensaje = '';
    this.debeScroll = true;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.detenerPollingConversacion();
    this.detenerPollingLista();
  }
}
