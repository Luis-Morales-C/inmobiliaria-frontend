import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private stompClient: Client;

  constructor() {
    this.stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      debug: (str) => console.log('STOMP: ' + str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
  }

  connect(token: string, userEmail: string, onMessageReceived: (msg: any) => void) {
    this.stompClient.connectHeaders = {
      Authorization: `Bearer ${token}`
    };

    this.stompClient.onConnect = () => {
      console.log('✅ Conectado al WebSocket');

      // ✅ Ruta corregida — coincide con convertAndSendToUser del backend
      this.stompClient.subscribe(
        `/user/${userEmail}/queue/messages`,
        (message: Message) => {
          if (message.body) {
            onMessageReceived(JSON.parse(message.body));
          }
        }
      );
    };

    this.stompClient.onStompError = (frame) => {
      console.error('❌ Error STOMP:', frame.headers['message']);
    };

    this.stompClient.activate();
  }

  sendMessage(mensajeDTO: any) {
    if (this.stompClient?.connected) {
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
  }
}
