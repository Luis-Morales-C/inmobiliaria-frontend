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
  accion?: 'node' | 'ia' | 'redirect';
  value?: string;
}

const WEBHOOK_URL = 'https://d1ohhrz57h5ohv.cloudfront.net/webhook/chat';

// ─── Árbol de respuestas predefinidas ────────────────────────────────────────
interface ChatNode {
  id: string;
  botMessage: string;
  opciones?: OpcionRapida[];
}

const TREE: Record<string, ChatNode> = {
  start: {
    id: 'start',
    botMessage: '¡Hola! Soy Edén 🏡, el asistente de EDEN Inmobiliaria.\n¿En qué puedo ayudarte?',
    opciones: [
      { label: '🔎 Buscar propiedades',      mensaje: 'buscar',       accion: 'ia'       },
      { label: '📋 Publicar mi inmueble',    mensaje: 'publish',      accion: 'node'     },
      { label: '❓ ¿Cómo funciona EDÉN?',   mensaje: 'howItWorks',   accion: 'node'     },
      { label: '👤 Hablar con un asesor',    mensaje: '/contactenos', accion: 'redirect' },
    ],
  },

  howItWorks: {
    id: 'howItWorks',
    botMessage: 'EDÉN es una plataforma inmobiliaria donde propietarios publican sus inmuebles y compradores/arrendatarios los encuentran fácilmente.\n\n¿Qué parte te gustaría conocer mejor?',
    opciones: [
      { label: 'Proceso de publicación',       mensaje: 'processPublish', accion: 'node' },
      { label: 'Proceso de verificación',      mensaje: 'processVerify',  accion: 'node' },
      { label: 'Tipos de negocio disponibles', mensaje: 'businessTypes',  accion: 'node' },
      { label: '← Volver al inicio',           mensaje: 'start',          accion: 'node' },
    ],
  },

  processPublish: {
    id: 'processPublish',
    botMessage: '📋 Para publicar un inmueble:\n\n1. Crea una cuenta gratuita.\n2. Completa el formulario con los datos.\n3. Adjunta los documentos requeridos.\n4. Un asesor revisa tu solicitud.\n5. Si todo está correcto, queda visible en la plataforma.',
    opciones: [
      { label: '¿Qué pasa si me rechazan?', mensaje: 'rejected',     accion: 'node'     },
      { label: 'Quiero publicar ahora',      mensaje: '/registro',    accion: 'redirect' },
      { label: '← Volver',                  mensaje: 'howItWorks',   accion: 'node'     },
    ],
  },

  processVerify: {
    id: 'processVerify',
    botMessage: '🔍 Un asesor revisa los documentos. Si todo es correcto, el inmueble se aprueba.\n\nEn caso de rechazo recibirás notificación con el motivo y podrás corregir y reenviar.',
    opciones: [
      { label: '¿Cuánto tarda?',      mensaje: 'verifyTime',  accion: 'node' },
      { label: '← Volver',            mensaje: 'howItWorks',  accion: 'node' },
    ],
  },

  verifyTime: {
    id: 'verifyTime',
    botMessage: '⏱️ Normalmente nuestros asesores revisan en un plazo de 1 a 3 días hábiles.',
    opciones: [
      { label: 'Contactar un asesor', mensaje: '/contactenos', accion: 'redirect' },
      { label: '← Volver al inicio',  mensaje: 'start',        accion: 'node'     },
    ],
  },

  rejected: {
    id: 'rejected',
    botMessage: '❌ Si tu inmueble es rechazado, recibirás una notificación con el motivo. Podrás corregir la información y volver a enviarla.',
    opciones: [
      { label: 'Contactar un asesor', mensaje: '/contactenos', accion: 'redirect' },
      { label: '← Volver al inicio',  mensaje: 'start',        accion: 'node'     },
    ],
  },

  businessTypes: {
    id: 'businessTypes',
    botMessage: '🏘️ En EDÉN puedes gestionar tres tipos de negocio:\n\n• Venta — transferencia definitiva.\n• Alquiler — arrendamiento por período acordado.\n• Permuta — intercambio entre partes.',
    opciones: [
      { label: '← Volver al inicio', mensaje: 'start', accion: 'node' },
    ],
  },

  publish: {
    id: 'publish',
    botMessage: '🏠 Para publicar tu inmueble necesitas una cuenta en EDÉN. ¿Ya tienes una?',
    opciones: [
      { label: 'Quiero registrarme',        mensaje: '/registro',    accion: 'redirect' },
      { label: 'Ya tengo cuenta',           mensaje: '/login',       accion: 'redirect' },
      { label: '¿Qué documentos necesito?', mensaje: 'docs',         accion: 'node'     },
      { label: '← Volver al inicio',        mensaje: 'start',        accion: 'node'     },
    ],
  },

  docs: {
    id: 'docs',
    botMessage: '📄 Documentos generalmente requeridos:\n\n• Documento de identidad del propietario.\n• Escritura pública o certificado de tradición.\n• Paz y salvo de servicios públicos (si aplica).\n• Fotografías del inmueble.',
    opciones: [
      { label: 'Quiero registrarme', mensaje: '/registro',    accion: 'redirect' },
      { label: 'Hablar con asesor',  mensaje: '/contactenos', accion: 'redirect' },
      { label: '← Volver',          mensaje: 'publish',       accion: 'node'     },
    ],
  },
};
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

  constructor(
    private router: Router,
    private panelService: PanelService,
    private chatbotEstado: ChatbotEstadoService
  ) {}

  ngOnInit(): void {
    this.sub = this.panelService.panel$.subscribe(panel => {
      this.isOpen = panel === 'chatbot-ia';
    });
    this.loadNode('start');
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggle(): void { this.panelService.abrir('chatbot-ia'); }
  close():  void { this.panelService.cerrar(); }

  // ── Navegar por el árbol o delegar a IA ──────────────────────────────────
  handleOpcion(op: OpcionRapida): void {
    this.messages.push({ from: 'user', text: op.label });
    this.scrollToBottom();

    switch (op.accion) {
      case 'node':
        setTimeout(() => this.loadNode(op.mensaje), 200);
        break;

      case 'redirect':
        this.messages.push({ from: 'bot', text: `Te estoy redirigiendo...` });
        setTimeout(() => { this.router.navigate([op.mensaje]); this.close(); }, 700);
        break;

      case 'ia':
        // El botón "Buscar propiedades" abre input libre con placeholder sugerido
        this.messages.push({
          from: 'bot',
          text: '¡Claro! Dime qué tipo de inmueble buscas. Por ejemplo: "Apartamento en Pereira con 2 habitaciones"',
          opciones: [{ label: '← Volver al inicio', mensaje: 'start', accion: 'node' }],
        });
        break;

      default:
        // Si no tiene accion definida, se trata como texto libre para la IA
        this.userInput = op.label;
        this.sendMessage();
    }
  }

  // ── Texto libre → IA ─────────────────────────────────────────────────────
  async sendMessage(): Promise<void> {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    this.userInput = '';
    this.messages.push({ from: 'user', text });
    this.isLoading = true;
    this.scrollToBottom();

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: this.getSessionId() }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = await res.json();
      console.log('[Chatbot] RAW:', raw);

      let data: {
        mensaje: string;
        accion?: string;
        filtros?: any;
        filtrosAplicados?: any;
        url?: string;
      };

      if (raw.output !== undefined) {
        data = typeof raw.output === 'string' ? JSON.parse(raw.output) : raw.output;
      } else if (raw.mensaje !== undefined) {
        data = raw;
      } else {
        throw new Error('Respuesta inesperada');
      }

      console.log('[Chatbot] DATA:', data);

      const botMsg: ChatMessage = {
        from: 'bot',
        text: data.mensaje ?? 'No se pudo obtener una respuesta.',
      };

      if (data.accion === 'VER_CATALOGO') {
        const filtros = data.filtros ?? data.filtrosAplicados ?? {};
        this.chatbotEstado.aplicarFiltros(filtros);
        botMsg.opciones = [
          { label: '🔍 Ver resultados en el catálogo', mensaje: '/catalogo', accion: 'redirect' },
          { label: '← Volver al inicio',               mensaje: 'start',     accion: 'node'     },
        ];
      } else if (data.accion === 'REDIRIGIR' && data.url) {
        botMsg.opciones = [
          { label: `Ir a ${data.url}`, mensaje: data.url, accion: 'redirect' },
          { label: '← Volver al inicio', mensaje: 'start', accion: 'node'   },
        ];
      } else {
        // Respuesta genérica de IA → ofrecer volver
        botMsg.opciones = [
          { label: '← Volver al inicio', mensaje: 'start', accion: 'node' },
        ];
      }

      this.messages.push(botMsg);

    } catch (err) {
      console.error('[Chatbot] Error:', err);
      this.messages.push({
        from: 'bot',
        text: 'Ocurrió un error al conectar con el asistente. Intenta de nuevo.',
        opciones: [{ label: '← Volver al inicio', mensaje: 'start', accion: 'node' }],
      });
    } finally {
      this.isLoading = false;
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  // ── Árbol: cargar nodo ────────────────────────────────────────────────────
  private loadNode(nodeId: string): void {
    const node = TREE[nodeId];
    if (!node) return;
    this.messages.push({ from: 'bot', text: node.botMessage, opciones: node.opciones });
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try { this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' }); } catch {}
  }

  private getSessionId(): string {
    let id = sessionStorage.getItem('chatbot_ia_session');
    if (!id) { id = 'session_' + Date.now(); sessionStorage.setItem('chatbot_ia_session', id); }
    return id;
  }

  resetChat(): void {
    this.messages = [];
    this.loadNode('start');
  }
}
