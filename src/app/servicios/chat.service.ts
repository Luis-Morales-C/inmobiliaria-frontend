// src/app/servicios/chat.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from './auth.service';
import {
  ConversacionDto,
  ConversacionDetalleDto,
  MensajeDto,
  EnviarMensajeRequest,
  NotificacionDto,
} from '../dto/chat/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private readonly API = 'http://localhost:8080/api/chat';
  private readonly WS_URL = 'http://localhost:8080/ws-chat';

  // ─── Estado del panel de chat ──────────────────────────────────────────
  private _panelAbierto = new BehaviorSubject<boolean>(false);
  panelAbierto$ = this._panelAbierto.asObservable();

  // Lista lateral de conversaciones
  private _conversaciones = new BehaviorSubject<ConversacionDto[]>([]);
  conversaciones$ = this._conversaciones.asObservable();

  // Conversación activa
  private _conversacionActiva = new BehaviorSubject<ConversacionDetalleDto | null>(null);
  conversacionActiva$ = this._conversacionActiva.asObservable();

  // Mensajes nuevos que llegan por WebSocket
  private _mensajeNuevo = new Subject<MensajeDto>();
  mensajeNuevo$ = this._mensajeNuevo.asObservable();

  // Notificaciones (badge, toasts)
  private _notificacion = new Subject<NotificacionDto>();
  notificacion$ = this._notificacion.asObservable();

  // Total de mensajes no leídos (para el botón flotante)
  private _totalNoLeidos = new BehaviorSubject<number>(0);
  totalNoLeidos$ = this._totalNoLeidos.asObservable();

  // ─── WebSocket ────────────────────────────────────────────────────────
  private stompClient: Client | null = null;
  private conectado = false;
  private subMensajes: StompSubscription | null = null;
  private subNotificaciones: StompSubscription | null = null;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ─── Conexión WebSocket (llamar al hacer login) ───────────────────────
  conectarWebSocket(): void {
    console.log('=== conectarWebSocket llamado ===');
    console.log('Token:', this.authService.getToken() ? 'existe' : 'NO existe');
    console.log('Ya conectado:', this.conectado);
    const token = this.authService.getToken();
    if (!token || this.conectado) return;

    this.stompClient = new Client({
      webSocketFactory: () => new WebSocket('ws://localhost:8080/ws-chat'), // ← así
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        this.conectado = true;
        const userId = this.authService.obtenerIdUsuario();
        if (!userId) return;

        // Suscripción a mensajes personales
        this.subMensajes = this.stompClient!.subscribe(
          `/user/${userId}/queue/mensajes`,
          (msg: IMessage) => {
            const mensaje: MensajeDto = JSON.parse(msg.body);
            this._mensajeNuevo.next(mensaje);

            // Si el panel está abierto en esa conversación, agregar el mensaje
            const activa = this._conversacionActiva.getValue();
            if (activa && activa.id === mensaje.conversacionId) {
              this._conversacionActiva.next({
                ...activa,
                mensajes: [...activa.mensajes, mensaje],
              });
              // Marcar como leído inmediatamente
              this.marcarLeidos(mensaje.conversacionId);
            }

            // Actualizar la lista de conversaciones
            this.refrescarConversaciones();
          }
        );

        // Suscripción a notificaciones
        this.subNotificaciones = this.stompClient!.subscribe(
          `/user/${userId}/queue/notificaciones`,
          (msg: IMessage) => {
            const noti: NotificacionDto = JSON.parse(msg.body);
            this._notificacion.next(noti);
            this._totalNoLeidos.next(noti.totalNoLeidos);
          }
        );

        // Cargar conversaciones iniciales
        this.refrescarConversaciones();
      },
      onDisconnect: () => {
        this.conectado = false;
      },
    });

    this.stompClient.activate();
  }

  desconectarWebSocket(): void {
    this.subMensajes?.unsubscribe();
    this.subNotificaciones?.unsubscribe();
    this.stompClient?.deactivate();
    this.conectado = false;
  }

  // ─── Panel ────────────────────────────────────────────────────────────
  abrirPanel(): void {
    this._panelAbierto.next(true);
    this.refrescarConversaciones();
  }

  cerrarPanel(): void {
    this._panelAbierto.next(false);
    this._conversacionActiva.next(null);
  }

  togglePanel(): void {
    if (this._panelAbierto.getValue()) {
      this.cerrarPanel();
    } else {
      this.abrirPanel();
    }
  }

  // ─── Abrir conversación con un usuario específico (desde "Contactar") ─
  abrirConversacionCon(otroUsuarioId: number): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.http
      .post<ConversacionDetalleDto>(
        `${this.API}/conversaciones/iniciar`,
        { otroUsuarioId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .subscribe({
        next: (detalle) => {
          this._conversacionActiva.next(detalle);
          this._panelAbierto.next(true);
          this.refrescarConversaciones();
        },
        error: (err) => console.error('Error al iniciar conversación:', err),
      });
  }

  // ─── Seleccionar una conversación de la lista ─────────────────────────
  seleccionarConversacion(conversacionId: number): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.http
      .get<ConversacionDetalleDto>(
        `${this.API}/conversaciones/${conversacionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .subscribe({
        next: (detalle) => {
          this._conversacionActiva.next(detalle);
          this.marcarLeidos(conversacionId);
          this.refrescarConversaciones();
        },
        error: (err) => console.error('Error al cargar conversación:', err),
      });
  }

  // ─── Enviar mensaje por WebSocket ─────────────────────────────────────
  enviarMensaje(request: EnviarMensajeRequest): void {
    if (!this.stompClient?.connected) {
      console.warn('WebSocket no conectado');
      return;
    }
    this.stompClient.publish({
      destination: '/app/chat.enviar',
      body: JSON.stringify(request),
    });

    // Agregar optimistamente el mensaje al estado local
    const yo = this.authService.obtenerIdUsuario();
    const nombre = this.authService.obtenerNombreUsuario() ?? '';
    const apellido = this.authService.obtenerApellidoUsuario() ?? '';
    const activa = this._conversacionActiva.getValue();

    if (activa && yo) {
      const mensajeOptimista: MensajeDto = {
        id: -1, // Temporal
        conversacionId: activa.id,
        emisorId: Number(yo),
        emisorNombre: nombre,
        emisorApellido: apellido,
        receptorId: request.receptorId,
        contenido: request.contenido,
        enviadoEn: new Date().toISOString(),
        leido: false,
      };
      this._conversacionActiva.next({
        ...activa,
        mensajes: [...activa.mensajes, mensajeOptimista],
      });
    }
  }

  // ─── Volver a la lista desde una conversación ─────────────────────────
  volverALista(): void {
    this._conversacionActiva.next(null);
    this.refrescarConversaciones();
  }

  // ─── Helpers REST ─────────────────────────────────────────────────────
  private refrescarConversaciones(): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.http
      .get<ConversacionDto[]>(`${this.API}/conversaciones`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (lista) => {
          this._conversaciones.next(lista);
          const total = lista.reduce((acc, c) => acc + c.noLeidosPorMi, 0);
          this._totalNoLeidos.next(total);
        },
        error: (err) => console.error('Error al cargar conversaciones:', err),
      });
  }

  private marcarLeidos(conversacionId: number): void {
    const token = this.authService.getToken();
    if (!token) return;

    // WebSocket
    this.stompClient?.publish({
      destination: '/app/chat.leidos',
      body: JSON.stringify(conversacionId),
    });

    // REST como backup
    this.http
      .put(`${this.API}/conversaciones/${conversacionId}/leidos`, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe();
  }

  ngOnDestroy(): void {
    this.desconectarWebSocket();
  }

  // Agregar estos dos métodos en chat.service.ts

  refrescarConversacionActiva(conversacionId: number): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.http
      .get<ConversacionDetalleDto>(
        `${this.API}/conversaciones/${conversacionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .subscribe({
        next: (detalle) => {
          const actual = this._conversacionActiva.getValue();
          // Solo actualizar si hay mensajes nuevos
          if (actual && detalle.mensajes.length !== actual.mensajes.length) {
            this._conversacionActiva.next(detalle);
          }
        },
        error: () => {}
      });
  }

  refrescarLista(): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.http
      .get<ConversacionDto[]>(`${this.API}/conversaciones`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (lista) => {
          this._conversaciones.next(lista);
          const total = lista.reduce((acc, c) => acc + c.noLeidosPorMi, 0);
          this._totalNoLeidos.next(total);
        },
        error: () => {}
      });
  }
}
