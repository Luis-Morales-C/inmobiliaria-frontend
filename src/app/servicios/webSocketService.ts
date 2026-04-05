import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})

export class WebSocketService {

  private client!: Client;

  connect(token: string, onMessage: (msg: any) => void) {
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => console.log(str),
      reconnectDelay: 5000
    });

    this.client.onConnect = () => {
      console.log("Conectado");

      this.client.subscribe('/user/queue/messages', message => {
        onMessage(JSON.parse(message.body));
      });
    };

    this.client.activate();
  }

  sendMessage(message: any) {
    this.client.publish({
      destination: '/app/chat',
      body: JSON.stringify(message)
    });
  }
}


