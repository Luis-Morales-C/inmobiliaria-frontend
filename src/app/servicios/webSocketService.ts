import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client;

  constructor() {
    this.stompClient = new Client({
      // 1. IMPORTANTE: Con WebSockets nativos usamos ws:// o wss:// en lugar de http://
      brokerURL: 'ws://localhost:8080/ws', // Ajusta el puerto si tu Spring Boot usa otro

      // Muestra logs en la consola para ayudarte a ver si se conecta bien (puedes quitarlo en producción)
      debug: (str) => {
        console.log('STOMP: ' + str);
      },

      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
  }

  // Tu ChatComponent ya llama a este método exactamente así
  connect(token: string, onMessageReceived: (msg: any) => void) {

    // Pasamos el JWT por los headers para que Spring Boot lo valide
    this.stompClient.connectHeaders = {
      Authorization: `Bearer ${token}`
    };

    this.stompClient.onConnect = (frame) => {
      console.log('✅ ¡Conectado al servidor WebSocket!', frame);

      // 2. IMPORTANTE: Ajusta '/topic/mensajes' a la ruta que tengas configurada en tu Spring Boot
      this.stompClient.subscribe('/topic/mensajes', (message: Message) => {
        if (message.body) {
          const mensajeParseado = JSON.parse(message.body);
          onMessageReceived(mensajeParseado); // Enviamos el mensaje al componente
        }
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('❌ Error de STOMP:', frame.headers['message']);
      console.error('Detalles adicionales:', frame.body);
    };

    // Iniciamos la conexión
    this.stompClient.activate();
  }

  // Tu ChatComponent llama a este método para enviar mensajes
  sendMessage(mensajeDTO: any) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        // 3. IMPORTANTE: Ajusta '/app/chat' al @MessageMapping que tengas en tu Spring Boot
        destination: '/app/chat',
        body: JSON.stringify(mensajeDTO)
      });
    } else {
      console.error('⚠️ No se pudo enviar el mensaje, no hay conexión al servidor.');
    }
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      console.log('🔌 Desconectado del servidor WebSocket');
    }
  }
}
