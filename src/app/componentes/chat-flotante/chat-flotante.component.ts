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
import {PanelService} from '../../servicios/panel.service';

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
  modalAbierto = false;

  get conversaciones$() {
    return this.chatService.conversaciones$;
  }

  private subs = new Subscription();
  private debeScroll = false;

  constructor(
    public chatService: ChatService,
    public authService: AuthService,
    public panelService: PanelService
  ) {}

  ngOnInit(): void {
    this.subs.add(this.chatService.panelAbierto$.subscribe(v => {
      this.panelAbierto = v;
    }));

    this.subs.add(this.chatService.conversacionActiva$.subscribe(conv => {
      if (conv) {
        const idStr = this.authService.obtenerIdUsuario();
        this.miId = idStr ? parseInt(idStr, 10) : 0;
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

    this.subs.add(this.panelService.modal$.subscribe(abierto => {
      this.modalAbierto = abierto;
      if (abierto) this.chatService.cerrarPanel();
    }));

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
  }
}
