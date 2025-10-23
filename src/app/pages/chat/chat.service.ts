// chat.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  streamChat(prompt: string): EventSource {
    return new EventSource(`http://localhost:8082/api/chat/stream?prompt=${encodeURIComponent(prompt)}`);
  }
}
