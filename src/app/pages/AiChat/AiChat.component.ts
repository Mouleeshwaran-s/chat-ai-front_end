import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <h2>AI Chatbot with Multiple Tools & Download Doc</h2>
      <div class="chat-box">
        <div *ngFor="let msg of messages" [ngClass]="msg.role">
          <strong>{{ msg.role === 'user' ? 'You' : 'AI' }}:</strong> {{ msg.content }}
        </div>
      </div>
      <input [(ngModel)]="userInput" placeholder="Type your message..." (keypress)="onKeyPress($event)" />
      <button [disabled]="loading" (click)="sendMessage()">{{ loading ? 'Sending...' : 'Send' }}</button>
    </div>
  `,
  styles: [`
    .chat-container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; }
    .chat-box { max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; }
    .user { text-align: right; margin: 5px 0; }
    .assistant { text-align: left; margin: 5px 0; }
    input { width: 100%; padding: 10px; margin-bottom: 10px; box-sizing: border-box; }
    button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; }
    button:disabled { background: #ccc; }
  `]
})
export class AiChatComponent {
  userInput = '';
  loading = false;
  messages: { role: string, content: string; }[] = [];

  tools = [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get current weather for a given city",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string", description: "City name (e.g., Paris)" }
          },
          required: ["location"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_time",
        description: "Get current local time in a given city",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string", description: "City name (e.g., Tokyo)" }
          },
          required: ["location"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "calculate_sum",
        description: "Calculate the sum of two numbers",
        parameters: {
          type: "object",
          properties: {
            a: { type: "number", description: "First number" },
            b: { type: "number", description: "Second number" }
          },
          required: ["a", "b"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "download_doc",
        description: "Download the last AI response as a Word document",
        parameters: {
          type: "object",
          properties: {}
        },
        required: []
      }
    }
  ];

  ngOnInit() {
    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    document.body.appendChild(script);
  }

  getWeather(location: string): string {
    const mockWeather: Record<string, string> = {
      'Paris': '22°C, Partly Cloudy',
      'London': '18°C, Rainy',
      'New York': '25°C, Sunny',
      'Tokyo': '28°C, Clear'
    };
    return mockWeather[location] || '20°C, Unknown';
  }

  getTime(location: string): string {
    const now = new Date();
    return `Current time in ${location} is ${now.toLocaleTimeString()}`;
  }

  calculateSum(a: number, b: number): string {
    return `The sum of ${a} and ${b} is ${a + b}`;
  }

  async downloadDoc(content: string) {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun(content)],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'AI-Response.docx');
  }

  async sendMessage() {
    if (!this.userInput) return;

    this.loading = true;
    const userMsg = this.userInput;
    this.messages.push({ role: 'user', content: userMsg });
    this.userInput = '';

    await this.waitForPuter();

    try {
      // @ts-ignore
      let aiResponse = await puter.ai.chat(this.messages.map(m => ({ role: m.role, content: m.content })), { tools: this.tools });

      if (aiResponse.message.tool_calls?.length > 0) {
        const toolCall = aiResponse.message.tool_calls[0];
        const toolName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        let toolResult = '';

        if (toolName === 'get_weather') {
          toolResult = this.getWeather(args.location);
        } else if (toolName === 'get_time') {
          toolResult = this.getTime(args.location);
        } else if (toolName === 'calculate_sum') {
          toolResult = this.calculateSum(args.a, args.b);
        } else if (toolName === 'download_doc') {
          const lastBotMsg = this.messages.filter(m => m.role === 'assistant').slice(-1)[0];
          if (lastBotMsg) {
            await this.downloadDoc(lastBotMsg.content);
            toolResult = '✅ The document has been downloaded.';
          } else {
            toolResult = '⚠️ No previous response found to download.';
          }
        } else {
          toolResult = 'Unknown function.';
        }

        // @ts-ignore
        aiResponse = await puter.ai.chat([
          ...this.messages.map(m => ({ role: m.role, content: m.content })),
          aiResponse.message,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult
          }
        ]);
      }

      this.messages.push({ role: 'assistant', content: aiResponse.message.content });
    } catch (err: any) {
      this.messages.push({ role: 'assistant', content: `Error: ${err.message}` });
    }

    this.loading = false;
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }

  waitForPuter(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        // @ts-ignore
        if (window.puter && window.puter.ai) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }
}
