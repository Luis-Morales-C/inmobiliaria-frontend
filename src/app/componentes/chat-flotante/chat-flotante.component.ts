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
import { ConversacionDetalleDto } from '../../dto/chat/chat.models';

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

  constructor(
    public chatService: ChatService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.miId = Number(this.authService.obtenerIdUsuario() ?? 0);

    this.subs.add(this.chatService.panelAbierto$.subscribe(v => this.panelAbierto = v));
    this.subs.add(this.chatService.conversacionActiva$.subscribe(conv => {
      this.conversacionActiva = conv;
      this.debeScroll = true;
    }));
    this.subs.add(this.chatService.totalNoLeidos$.subscribe(n => this.totalNoLeidos = n));
    this.subs.add(this.chatService.mensajeNuevo$.subscribe(() => this.debeScroll = true));
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
