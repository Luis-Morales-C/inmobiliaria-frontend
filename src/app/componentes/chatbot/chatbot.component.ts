import { Component, OnInit, OnDestroy  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatNewlinePipe } from './chat-newline.pipe';
import { PanelService} from '../../servicios/panel.service';
import {Subscription} from 'rxjs';


export interface ChatMessage {
  from: 'bot' | 'user';
  text: string;
}

export interface ChatOption {
  label: string;
  action: 'node' | 'redirect' | 'text';
  value: string;       // nodeId | ruta | texto extra
}

export interface ChatNode {
  id: string;
  botMessage: string;
  options?: ChatOption[];
}

// ─── Árbol de conversación ────────────────────────────────────────────────────
const TREE: Record<string, ChatNode> = {
  start: {
    id: 'start',
    botMessage: '¡Hola! Soy el asistente de EDÉN 🏡 ¿En qué puedo ayudarte hoy?',
    options: [
      { label: '¿Cómo funciona EDÉN?',      action: 'node',     value: 'howItWorks'   },
      { label: 'Quiero publicar mi inmueble', action: 'node',     value: 'publish'      },
      { label: 'Ver propiedades disponibles', action: 'node',     value: 'browse'       },
      { label: 'Hablar con un asesor',        action: 'redirect', value: '/contactenos' },
    ],
  },

  // ── ¿Cómo funciona? ──────────────────────────────────────────────────────────
  howItWorks: {
    id: 'howItWorks',
    botMessage:
      'EDÉN es una plataforma inmobiliaria donde propietarios publican sus inmuebles y compradores/arrendatarios los encuentran fácilmente.\n\n' +
      '¿Qué parte te gustaría conocer mejor?',
    options: [
      { label: 'Proceso de publicación',       action: 'node', value: 'processPublish' },
      { label: 'Proceso de verificación',      action: 'node', value: 'processVerify'  },
      { label: 'Tipos de negocio disponibles', action: 'node', value: 'businessTypes'  },
      { label: '← Volver al inicio',           action: 'node', value: 'start'          },
    ],
  },

  processPublish: {
    id: 'processPublish',
    botMessage:
      '📋 Para publicar un inmueble:\n\n' +
      '1. Crea una cuenta gratuita en EDÉN.\n' +
      '2. Completa el formulario con los datos del inmueble.\n' +
      '3. Adjunta los documentos requeridos (escritura, cédula, etc.).\n' +
      '4. Un asesor revisa tu solicitud.\n' +
      '5. Si todo está correcto, tu inmueble queda visible en la plataforma.',
    options: [
      { label: '¿Qué pasa si me rechazan?', action: 'node',     value: 'rejected'    },
      { label: 'Quiero publicar ahora',      action: 'redirect', value: '/registro'   },
      { label: '← Volver',                  action: 'node',     value: 'howItWorks'  },
    ],
  },

  processVerify: {
    id: 'processVerify',
    botMessage:
      '🔍 Proceso de verificación:\n\n' +
      'Un asesor de EDÉN revisa los documentos e información del inmueble. ' +
      'Si todo es correcto, el inmueble es aprobado y aparece en la plataforma.\n\n' +
      'En caso de rechazo, recibirás notificación con el motivo. ' +
      'Podrás corregir la información y reenviarla.',
    options: [
      { label: '¿Cuánto tarda la verificación?', action: 'node', value: 'verifyTime'   },
      { label: '← Volver',                        action: 'node', value: 'howItWorks'  },
    ],
  },

  verifyTime: {
    id: 'verifyTime',
    botMessage:
      '⏱️ El tiempo de verificación varía según el volumen de solicitudes. ' +
      'Normalmente nuestros asesores revisan en un plazo de 1 a 3 días hábiles.\n\n' +
      '¿Necesitas más información?',
    options: [
      { label: 'Contactar a un asesor', action: 'redirect', value: '/contactenos' },
      { label: '← Volver al inicio',   action: 'node',     value: 'start'         },
    ],
  },

  rejected: {
    id: 'rejected',
    botMessage:
      '❌ Si tu inmueble es rechazado:\n\n' +
      'Recibirás una notificación indicando el motivo del rechazo. ' +
      'Podrás corregir la información o documentos faltantes y volver a enviarlos para revisión.',
    options: [
      { label: 'Contactar a un asesor', action: 'redirect', value: '/contactenos' },
      { label: '← Volver al inicio',   action: 'node',     value: 'start'         },
    ],
  },

  businessTypes: {
    id: 'businessTypes',
    botMessage:
      '🏘️ En EDÉN puedes gestionar tres tipos de negocio:\n\n' +
      '• Venta — transferencia definitiva del inmueble.\n' +
      '• Alquiler — arrendamiento por período acordado.\n' +
      '• Permuta — intercambio de inmuebles entre partes.',
    options: [
      { label: '← Volver al inicio', action: 'node', value: 'start' },
    ],
  },

  // ── Publicar inmueble ────────────────────────────────────────────────────────
  publish: {
    id: 'publish',
    botMessage:
      '🏠 Para publicar tu inmueble necesitas una cuenta en EDÉN. ¿Ya tienes una?',
    options: [
      { label: 'No tengo cuenta, quiero registrarme', action: 'redirect', value: '/registro' },
      { label: 'Ya tengo cuenta, iniciar sesión',     action: 'redirect', value: '/login'    },
      { label: '¿Qué documentos necesito?',           action: 'node',     value: 'docs'      },
      { label: '← Volver al inicio',                  action: 'node',     value: 'start'     },
    ],
  },

  docs: {
    id: 'docs',
    botMessage:
      '📄 Documentos generalmente requeridos:\n\n' +
      '• Documento de identidad del propietario.\n' +
      '• Escritura pública o certificado de tradición y libertad.\n' +
      '• Paz y salvo de servicios públicos (si aplica).\n' +
      '• Fotografías del inmueble.\n\n' +
      'Nuestros asesores te guiarán si falta algo.',
    options: [
      { label: 'Quiero registrarme', action: 'redirect', value: '/registro'   },
      { label: 'Hablar con asesor',  action: 'redirect', value: '/contactenos' },
      { label: '← Volver',          action: 'node',     value: 'publish'      },
    ],
  },

  // ── Ver propiedades ──────────────────────────────────────────────────────────
  browse: {
    id: 'browse',
    botMessage:
      '🔎 Puedes explorar todas las propiedades disponibles en nuestra plataforma. ' +
      '¿Qué tipo de inmueble buscas?',
    options: [
      { label: 'Casa o apartamento',     action: 'node',     value: 'browseTypes'  },
      { label: 'Local, lote o finca',    action: 'node',     value: 'browseTypes'  },
      { label: 'Ir al catálogo completo', action: 'redirect', value: '/inicio'      },
      { label: '← Volver al inicio',     action: 'node',     value: 'start'        },
    ],
  },

  browseTypes: {
    id: 'browseTypes',
    botMessage:
      '¡Perfecto! Para ver todos los inmuebles disponibles y filtrarlos por tipo, ' +
      'precio, habitaciones y más, te recomendamos ir al catálogo completo.',
    options: [
      { label: 'Ir al catálogo',    action: 'redirect', value: '/inicio'    },
      { label: '← Volver al inicio', action: 'node',   value: 'start'      },
    ],
  },
};

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule,ChatNewlinePipe],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
})
export class ChatbotComponent implements OnInit, OnDestroy {
  isOpen = false;
  messages: ChatMessage[] = [];
  currentOptions: ChatOption[] = [];
  private sub!: Subscription;

  constructor(private router: Router,private panelService: PanelService) {
    this.loadNode('start');
  }

  ngOnInit() {
    this.sub = this.panelService.panel$.subscribe(panel => {
      this.isOpen = panel === 'chatbot';
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  toggle(): void {
    this.panelService.abrir('chatbot');
  }

  close(): void {
    this.panelService.cerrar();
  }

  selectOption(option: ChatOption): void {
    // Muestra la opción elegida como mensaje del usuario
    this.messages.push({ from: 'user', text: option.label });
    this.currentOptions = [];

    if (option.action === 'redirect') {
      this.messages.push({
        from: 'bot',
        text: `Te estoy redirigiendo a ${option.value}...`,
      });
      setTimeout(() => {
        this.router.navigate([option.value]);
        this.close();
      }, 800);
      return;
    }

    if (option.action === 'node') {
      setTimeout(() => this.loadNode(option.value), 300);
    }
  }

  private loadNode(nodeId: string): void {
    const node = TREE[nodeId];
    if (!node) return;

    this.messages.push({ from: 'bot', text: node.botMessage });
    this.currentOptions = node.options ?? [];
  }

  resetChat(): void {
    this.messages = [];
    this.currentOptions = [];
    this.loadNode('start');
  }
}
