import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnDestroy {
  responseText = '';
  eventSource: EventSource | null = null;

  constructor(private chatService: ChatService, private cdr: ChangeDetectorRef) { }

  startStreaming(prompt: string) {
    this.responseText = '';
    this.eventSource = this.chatService.streamChat(prompt);

    this.eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        this.eventSource?.close();
        return;
      }

      try {
        const parsed = JSON.parse(event.data);
        console.log('Received SSE data:', parsed);

        const content = parsed?.choices[0].delta.content;
        console.log('Parsed content:', content);

        if (content) {
          this.responseText += content;
          this.cdr.detectChanges(); // Trigger change detection to update the view
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('Streaming error:', error);
      this.eventSource?.close();
    };
  }

  ngOnDestroy(): void {
    this.eventSource?.close();
  }
}
