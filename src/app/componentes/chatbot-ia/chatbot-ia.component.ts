import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PanelService } from '../../servicios/panel.service';
import { ChatbotEstadoService } from '../../servicios/chatbot-estado.service';
import { Subscription } from 'rxjs';

export interface ChatMessage {
  from: 'bot' | 'user';
  text: string;
  opciones?: OpcionRapida[];
}

export interface OpcionRapida {
  label: string;
  mensaje: string;
}

// ─── CAMBIA ESTA CONSTANTE SEGÚN EL ENTORNO ───────────────────────────────────
// Desarrollo  → usa la URL directa a n8n (evita problemas de proxy)
// Producción  → cambia a '/webhook/chat' (con proxy o nginx)
const WEBHOOK_URL = 'http://localhost:5678/webhook-test/chat';
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-chatbot-ia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot-ia.component.html',
  styleUrls: ['./chatbot-ia.component.css'],
})
export class ChatbotIaComponent implements OnInit, OnDestroy {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  isOpen = false;
  messages: ChatMessage[] = [];
  userInput = '';
  isLoading = false;
  private sub!: Subscription;

  opcionesIniciales: OpcionRapida[] = [
    { label: '🏠 Ver propiedades',  mensaje: 'Quiero ver propiedades disponibles' },
    { label: '📋 Publicar inmueble', mensaje: '¿Cómo publico mi inmueble?' },
    { label: '📝 Registrarme',       mensaje: '¿Cómo me registro?' },
    { label: '👤 Hablar con asesor', mensaje: 'Quiero hablar con un asesor' },
  ];

  constructor(
    private router: Router,
    private panelService: PanelService,
    private chatbotEstado: ChatbotEstadoService
  ) {}

  ngOnInit(): void {
    this.sub = this.panelService.panel$.subscribe(panel => {
      this.isOpen = panel === 'chatbot-ia';
    });
    this.messages.push({
      from: 'bot',
      text: '¡Hola! Soy Edén 🏡, el asistente de EDEN Inmobiliaria.\n¿En qué puedo ayudarte?',
      opciones: this.opcionesIniciales,
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggle(): void { this.panelService.abrir('chatbot-ia'); }
  close():  void { this.panelService.cerrar(); }

  handleOpcion(opcion: OpcionRapida): void {
    if (opcion.mensaje === '__ir_catalogo__') {
      this.router.navigate(['/catalogo']);
      this.close();
    } else if (opcion.mensaje.startsWith('__redirigir__')) {
      const url = opcion.mensaje.replace('__redirigir__', '');
      this.router.navigate([url]);
      this.close();
    } else {
      this.userInput = opcion.mensaje;
      this.sendMessage();
    }
  }

  async sendMessage(): Promise<void> {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    this.userInput = '';
    this.messages.push({ from: 'user', text });
    this.isLoading = true;
    this.scrollToBottom();

    try {
      // ── 1. Llamada al webhook ──────────────────────────────────────────────
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: this.getSessionId() }),
      });

      // ── 2. Verificar que la respuesta HTTP sea exitosa ─────────────────────
      if (!res.ok) {
        const errorBody = await res.text();
        console.error(`[Chatbot] HTTP ${res.status}:`, errorBody);
        throw new Error(`HTTP ${res.status}`);
      }

      // ── 3. Parsear el body ─────────────────────────────────────────────────
      const raw = await res.json();
      console.log('[Chatbot] RAW response:', raw);

      // n8n puede devolver la respuesta de varias formas:
      //   A) { output: "{\"mensaje\":\"...\",\"accion\":\"...\"}" }  ← string escapado
      //   B) { output: { mensaje: "...", accion: "..." } }          ← objeto directo
      //   C) { mensaje: "...", accion: "..." }                      ← sin wrapper
      let data: { mensaje: string; accion?: string; filtros?: any; url?: string };

      if (raw.output !== undefined) {
        data = typeof raw.output === 'string' ? JSON.parse(raw.output) : raw.output;
      } else if (raw.mensaje !== undefined) {
        data = raw;
      } else {
        console.error('[Chatbot] Estructura desconocida:', raw);
        throw new Error('Respuesta inesperada del servidor');
      }

      console.log('[Chatbot] DATA parseada:', data);

      // ── 4. Construir el mensaje del bot ────────────────────────────────────
      const botMsg: ChatMessage = {
        from: 'bot',
        text: data.mensaje ?? 'No se pudo obtener una respuesta.',
      };

      if (data.accion === 'VER_CATALOGO' && data.filtros) {
        this.chatbotEstado.aplicarFiltros(data.filtros);
        botMsg.opciones = [{
          label: '🔍 Ver resultados en el catálogo',
          mensaje: '__ir_catalogo__',
        }];
      } else if (data.accion === 'REDIRIGIR' && data.url) {
        botMsg.opciones = [{
          label: `Ir a ${data.url}`,
          mensaje: `__redirigir__${data.url}`,
        }];
      } else {
        botMsg.opciones = this.opcionesIniciales;
      }

      this.messages.push(botMsg);

    } catch (err) {
      console.error('[Chatbot] Error:', err);
      this.messages.push({
        from: 'bot',
        text: 'Ocurrió un error al conectar con el asistente. Intenta de nuevo.',
        opciones: this.opcionesIniciales,
      });
    } finally {
      this.isLoading = false;
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }

  private getSessionId(): string {
    let id = sessionStorage.getItem('chatbot_ia_session');
    if (!id) {
      id = 'session_' + Date.now();
      sessionStorage.setItem('chatbot_ia_session', id);
    }
    return id;
  }

  resetChat(): void {
    this.messages = [];
    this.messages.push({
      from: 'bot',
      text: '¡Hola de nuevo! ¿En qué puedo ayudarte?',
      opciones: this.opcionesIniciales,
    });
  }
}
