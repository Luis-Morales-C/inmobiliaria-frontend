import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private stompClient: Client;
  private conectado = false;

  constructor() {
    this.stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      debug: (str) => console.log('STOMP: ' + str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
  }

  isConnected(): boolean {
    return this.conectado && this.stompClient.connected;
  }

  connect(token: string, userEmail: string, onMessageReceived: (msg: any) => void) {
    // ✅ Evita doble conexión al recargar
    if (this.isConnected()) {
      console.log('⚡ WebSocket ya conectado, reutilizando sesión');
      return;
    }

    this.stompClient.connectHeaders = {
      Authorization: `Bearer ${token}`
    };

    this.stompClient.onConnect = () => {
      console.log('✅ Conectado al WebSocket');
      this.conectado = true;

      this.stompClient.subscribe(
        `/user/${userEmail}/queue/messages`,
        (message: Message) => {
          if (message.body) {
            onMessageReceived(JSON.parse(message.body));
          }
        }
      );
    };

    this.stompClient.onDisconnect = () => {
      this.conectado = false;
      console.log('🔌 WebSocket desconectado');
    };

    this.stompClient.onStompError = (frame) => {
      this.conectado = false;
      console.error('❌ Error STOMP:', frame.headers['message']);
    };

    this.stompClient.activate();
  }

  sendMessage(mensajeDTO: any) {
    if (this.isConnected()) {
      this.stompClient.publish({
        destination: '/app/chat',
        body: JSON.stringify(mensajeDTO)
      });
    } else {
      console.error('⚠️ Sin conexión WebSocket');
    }
  }

  disconnect() {
    this.stompClient?.deactivate();
    this.conectado = false;
  }
}
