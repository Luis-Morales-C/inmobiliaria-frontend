import { Component } from '@angular/core';
import {WebSocketService} from '../../servicios/webSocketService';

@Component({
  selector: 'app-chat',
  imports: [],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  messages: any[] = [];
  receiver = "correo@destino.com";

  constructor(private ws: WebSocketService) {}

  ngOnInit() {
    const token = localStorage.getItem("token")!;

    this.ws.connect(token, (msg) => {
      this.messages.push(msg);
    });
  }

  send(content: string) {
    this.ws.sendMessage({
      receiver: this.receiver,
      content: content
    });
  }
}
