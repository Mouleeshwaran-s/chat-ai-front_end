import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../core/modules/material/material.module';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
// import { ChatAiService } from './service/chat-ai.service';
import { Router } from '@angular/router';
import { SharedService } from '../../core/service/shared.service';
import { models } from '../../core/models/ai-models';
import { SnowflakeIdGenerator } from '../../core/service/snowflake-id-generator';
import { Location } from '@angular/common';
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isText: boolean;
  isImage: boolean;
  isAttachment: boolean;
  filesData?: {
    data: any[];
    totalCount: number;
    otherFileData: any[];
  };
  isCompleted: boolean;
}
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
export interface MessagePayload {
  session_id: string;
  request_id: string;
  uuid: string;
  role: string;
  content: string;
  isText: boolean;
  isFile: boolean;
  date_time: string;
}
import { RagService } from './service/rag.service';

@Component({
  selector: 'app-rag-agent',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    MarkdownModule,
    FormsModule,
  ],
  templateUrl: './rag-agent.component.html',
  styleUrl: './rag-agent.component.css'
})
export class RagAgentComponent implements AfterViewInit, OnInit, AfterViewChecked, OnDestroy {
  // ViewChilds
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  @ViewChild('autoTextarea') autoTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('uploadBox') uploadBox!: ElementRef<HTMLDivElement>;

  // Outputs
  @Output() sidebarToggle = new EventEmitter<void>();

  // UI State
  isRagInitialState = true;
  isSidebarVisible = true;
  isUserAtBottom = true;
  isProgress = false;
  isTyping = false;
  isDragOver = false;

  // Data
  private snowflake: SnowflakeIdGenerator;
  selectedModel = new FormControl('gpt-4o', [Validators.required]);
  selectedType = new FormControl('chat', [Validators.required]);
  models = models;
  prompt = '';
  messages: Message[] = [];
  filesData: any[] = [];
  payLoadMessages: MessagePayload = this.initPayload();
  user: any;
  path = '';
  sessionId: any;
  response: string = '';
  imageValue: any = '';
  docValue: any = '';
  pdfValue = '';
  isTileSaved: boolean = false;
  copiedMessageIndex: number | null = null;
  eventSource: EventSource | null = null;

  constructor(
    private ragService: RagService,
    private router: Router,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef,
    private location: Location // <-- injected for URL updates without reload
  ) {
    this.snowflake = new SnowflakeIdGenerator(1n, 1n);
  }

  private initPayload(): MessagePayload {
    return {
      session_id: '',
      request_id: '',
      uuid: '',
      role: '',
      content: '',
      isText: false,
      isFile: false,
      date_time: ''
    };
  }

  ngOnInit(): void {
    console.log("ngOnInit called");

    // const storedId = sessionStorage.getItem('generated_id');
    // get id from path url
    const pathSegments = this.router.url.split('/');
    console.log('Path Segments:', pathSegments);
    // get last index
    const lastSegment = pathSegments[pathSegments.length - 1];
    console.log('Last Segment:', lastSegment);

    const chatIdSegment = pathSegments.find(segment => segment.startsWith('rag'));
    console.log('Chat ID Segment:', chatIdSegment);

    if (lastSegment != 'rag') {
      this.path = `/rag/${lastSegment}`;
      this.sessionId = lastSegment;
    } else {
      const generatedId = this.generateId();
      sessionStorage.setItem('generated_id', generatedId);
      this.sessionId = generatedId;
      this.path = `/rag/${generatedId}`;

    }
    console.log('Chat path:', this.path);

    this.getUserChatHistory();


    this.payLoadMessages = {
      session_id: this.sessionId,
      request_id: this.snowflake.nextId().toString(),
      uuid: 'user-uuid',
      role: 'user',
      content: "",
      isText: true,
      isFile: false,
      date_time: new Date().toISOString()
    };
    this.isSidebarVisible = JSON.parse(localStorage.getItem('sidebarClosed') || 'false');
    console.log("isSidebarVisible", this.isSidebarVisible);

    this.prompt = sessionStorage.getItem('prompt') || '';
    this.sharedService.sidebarToggleSide$?.subscribe(() => {
      setTimeout(() => this.isSidebarVisible = !this.isSidebarVisible, 100);
    });
    this.sharedService.createNewChat$?.subscribe(() => {
      if (this.messages.length > 0) {
        this.location.go('/rag');

        this.messages = [];
        this.prompt = '';
        this.isUserAtBottom = true;
        this.isTileSaved = false;
        this.scrollToBottom();

        this.sessionId = this.generateId();
        this.path = `/rag/${this.sessionId}`;
        sessionStorage.setItem('generated_id', this.sessionId);

        this.payLoadMessages = {
          session_id: this.sessionId,
          request_id: this.snowflake.nextId().toString(),
          uuid: 'user-uuid',
          role: 'user',
          content: "",
          isText: true,
          isFile: false,
          date_time: new Date().toISOString()
        };
      }

    });
    this.sharedService.sessionSelected$.subscribe(sessionId => {
      this.setPathFromSidebar(`/rag/${sessionId}`);
    });
  }
  ngAfterViewInit(): void {
    if (this.autoTextarea?.nativeElement) {
      this.autoResizeTextarea(this.autoTextarea.nativeElement);
    }
    setTimeout(() => this.onResize({ target: window }), 100);
  }
  ngAfterViewChecked(): void {
    console.log("IS User At Bottom:", this.isUserAtBottom);

    if (this.isUserAtBottom) {
      this.scrollToBottom();
      this.onResize({ target: window });
    }
  }
  ngOnDestroy(): void {
    this.eventSource?.close();
  }
  setPathFromSidebar(path: string): void {
    this.path = path;
    this.sessionId = this.path.substring(6);
    this.payLoadMessages.session_id = this.sessionId;
    if (window.innerWidth < 768) {
      this.isSidebarVisible = !this.isSidebarVisible;
    }
    this.getUserChatHistory();
  }
  getChatHistoryBySessionId(): void {

  }
  getUserChatHistory() {
    console.log("Session Id: ",this.sessionId);

    // this.ragService.getUserChatHistory(this.sessionId.split('/').pop()).then(chatHistory => {
    //   console.log("Fetched chat history:", chatHistory);
    //   this.messages = [];
    //   if (chatHistory.history && Array.isArray(chatHistory.history)) {
    //     chatHistory.history.forEach((message: any) => {
    //       this.messages.push({
    //         role: message.role,
    //         content: message.content.replace(/\\n/g, '\n'),
    //         isText: true,
    //         isImage: false,
    //         isAttachment: false,
    //         filesData: {
    //           data: [],
    //           totalCount: 0,
    //           otherFileData: []
    //         },
    //         isCompleted: message.role === 'user' ? false : true
    //       });
    //       // this.payLoadMessages.messages.push({ role: message.role, content: message.content });
    //     });
    //     console.log("Messages Size:", this.messages.length);

    //     this.isTileSaved = chatHistory.history.length >= 4;
    //     console.log("Is Title Saved:", this.isTileSaved);

    //   }
    // });
  }
  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    this.isUserAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 1;
  }
  scrollToBottom(): void {
    try {
      if (this.chatContainer?.nativeElement) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error(err);
    }
  }
  async saveTitle(title: any): Promise<void> {
    const chatHistory = {
      session_id: this.path.substring(6),
      uuid: this.user?.uuid || '',
      title: title
    };
  }
  async askGPT(): Promise<void> {
    const trimmedPrompt = this.prompt.trim();
    const hasPrompt = !!trimmedPrompt;
    console.log("Has Prompt: ", hasPrompt);
    
    const hasFiles = this.filesData.length > 0;
    console.log("Has Files: ", hasFiles);
    console.log("Files Data: ", this.filesData);
    
    if (!hasPrompt && !hasFiles) {
      console.warn("No prompt or files provided");
      return;
    }

    // Prepare the message payload
    this.payLoadMessages.content = trimmedPrompt;
    this.payLoadMessages.request_id = this.snowflake.nextId().toString();
    this.payLoadMessages.isText = hasPrompt;
    this.payLoadMessages.isFile = hasFiles;
    
    console.log('Payload Messages:', this.payLoadMessages);
    
    // Create FormData for multipart/form-data request
    const payloadData = new FormData();
    
    // Add message as JSON string (backend expects this)
    payloadData.append('message', JSON.stringify(this.payLoadMessages));
    
    // Add file if present (backend expects exactly one file)
    if (hasFiles && this.filesData.length > 0) {
      const fileData = this.filesData[0]; // Take first file for now
      if (fileData.file instanceof File) {
        payloadData.append('file', fileData.file, fileData.file.name);
        console.log('Appended file:', fileData.file.name, 'Type:', fileData.file.type, 'Size:', fileData.file.size);
      } else {
        console.error('Invalid file data:', fileData);
      }
    }
    
    // Create user message for UI
    const userMessage: Message = {
      role: 'user',
      content: hasFiles ? trimmedPrompt : trimmedPrompt,
      isText: true,
      isImage: false,
      isAttachment: hasFiles,
      filesData: {
        data: [],
        totalCount: 0,
        otherFileData: []
      },
      isCompleted: false
    };

    if (hasFiles) {
      const processed = this.processFilesData(this.filesData);
      userMessage.filesData = {
        data: processed.filesData.data,
        totalCount: processed.totalCount,
        otherFileData: processed.otherFileData
      };
    }

    this.messages.push(userMessage);
    
    this.isProgress = true;
    console.log('%c[askGPT] Sending request with FormData', 'color: blue;');
    
    // Clear input fields
    this.prompt = '';
    this.filesData = [];

    // Add assistant message placeholder
    this.messages.push({
      role: 'assistant',
      content: '',
      isText: true,
      isImage: false,
      isAttachment: false,
      filesData: {
        data: [],
        totalCount: 0,
        otherFileData: []
      },
      isCompleted: false
    });
    try {
      this.isProgress = true;
      this.isTyping = true;
      this.ragService.streamRagChat(
        payloadData,
        (chunk) => {
          this.isRagInitialState = false;
          // Hide typing indicator once we start receiving content
          this.isTyping = false;
          // Append chunk to last assistant message
          const lastMessage = this.messages[this.messages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content += chunk;
            this.cdr.detectChanges();
          }
        },
        (err) => {
          console.error('[askGPT] Stream error:', err);
          this.isProgress = false;
          this.isTyping = false;
        },
        () => {
          console.log('[askGPT] Stream completed');
          const lastMessage = this.messages[this.messages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.isCompleted = true;
          }
          this.isProgress = false;
          this.isTyping = false;
          this.cdr.detectChanges();

          // Save title if needed (after first user-assistant exchange)
          if (!this.isTileSaved && this.messages.length >= 2) {
            const chatHistory = this.messages.map(msg => ({
              role: msg.role,
              content: msg.content
            }));
            const payload = {
              sessionId: this.sessionId,
              messages: chatHistory
            };
            console.log("Payload ", payload);

            this.ragService.saveChatHistory(payload).subscribe(
              (res: any) => {
                if (res.success == "true") {
                  this.isTileSaved = true;
                  if (res.title && res.title !== 'already_exists') {
                    const render = '/rag/' + this.sessionId;
                    console.log("Render Path:", render);
                    this.location.go(render);
                    this.sharedService.triggerSidebarChatHistoryUpdate();
                  }
                } else {
                  this.isTileSaved = false;
                }
              },
              (error) => {
                console.error('Error saving chat history:', error);
              }
            );
          }
        }
      );



      console.log('Streaming started with payload:', this.messages);

    } catch (error) {
      console.error('[askGPT] Chat stream error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, something went wrong.',
        isText: true,
        isImage: false,
        isAttachment: false,
        filesData: {
          data: [],
          totalCount: 0,
          otherFileData: []
        },
        isCompleted: true
      };
      this.messages.push(errorMessage);
    } finally {
      this.isProgress = false;
    }
  }
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }
  convertFileToBase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = error => reject(error);
    });
  }
  async removeFile(file: any) {
    const index = this.filesData.indexOf(file);
    if (index > -1) {
      this.filesData.splice(index, 1);
    }
    console.log(this.filesData);
    this.autoResizeTextarea(this.autoTextarea.nativeElement);
  }
  async onFileSelected(event: any) {
    const files: FileList = event.target.files;
    this.autoResizeTextarea(this.autoTextarea.nativeElement);
    if (files && files.length > 0) {
      await this.handleFileSelection(files);
    }
  }
  async handleSubmit(): Promise<void> {
    if (this.isProgress) return;
    this.autoTextarea.nativeElement.style.height = 'auto';
    const type = this.selectedType.value;
    if (type === 'chat') {
      await this.askGPT();
    } else if (type === 'txt-img') {
    }
    this.prompt = '';
    sessionStorage.setItem('prompt', this.prompt);
  }

  async downloadMessageAsDocx(): Promise<void> {
    try {
      const body = {
        "input": "Sure! Here’s a comprehensive Markdown example that covers most common Markdown styles and elements, with explanations inline as comments (using HTML comments so they don’t show in rendered Markdown):\n\n# Heading 1\n## Heading 2\n### Heading 3\n#### Heading 4\n##### Heading 5\n###### Heading 6\n\n---\n\n**Bold text**  \n*Italic text*  \n***Bold and italic text***  \n~~Strikethrough~~\n\n> This is a blockquote.  \n> It can span multiple lines.\n\n---\n\n### Lists\n\n**Unordered list:**\n\n- Item 1  \n- Item 2  \n  - Nested item 2a  \n  - Nested item 2b  \n\n**Ordered list:**\n\n1. First item  \n2. Second item  \n   1. Nested item 2.1  \n   2. Nested item 2.2  \n\n---\n\n### Code\n\nInline code: `console.log('Hello, world!')`\n\nCode block (with syntax highlighting for JavaScript):\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet('Alice'));\n````\n\n---\n\n### Links and Images\n\n[OpenAI website](https://www.openai.com)\n\n![OpenAI Logo](https://upload.wikimedia.org/wikipedia/commons/6/6e/OpenAI_Logo.svg \"OpenAI Logo\")\n\n---\n\n### Tables\n\n| Syntax   | Description         | Example |\n| -------- | ------------------- | ------- |\n| Header   | Title of the column | Content |\n| **Bold** | *Italic* text       | `Code`  |\n\n---\n\n### Horizontal Rule\n\n---\n\n### Task List\n\n* [x] Write Markdown example\n* [ ] Add more examples\n* [ ] Review formatting\n\n---\n\n### Emoji\n\nHere is a smiley 🙂 and a thumbs up 👍\n\n---\n\n### Footnotes\n\nHere is a sentence with a footnote.[^1]\n\n[^1]: This is the footnote text.\n\n---\n\n### Definition List (not supported in all Markdown flavors)\n\nTerm 1\n: Definition 1\n\nTerm 2\n: Definition 2\n\n---\n\n### HTML inside Markdown\n\nYou can also use **HTML** tags like this:\n\n<div style=\"color: red;\">This text is red</div>\n\n---\n\n### Escaping characters\n\nUse a backslash to escape special characters: \\*not italic\\* and # not a heading\n\n```\n\nIf you want me to customize or add anything else, just ask!\n```"
      };
      // const blob = await this.ragService.convertMarkdownToDocx(body.input);
      // saveAs(blob, `chat-message-${Date.now()}.docx`);
    } catch (error) {
      console.error('Error downloading DOCX:', error);
      // Handle error (show toast, etc.)
    }
  }

  // Update the existing doc() method to be more useful
  doc() {
    // // Get the last assistant message content
    // const lastAssistantMessage = this.messages
    //   .filter(msg => msg.role === 'assistant')
    //   .pop();

    // if (lastAssistantMessage?.content) {
    this.downloadMessageAsDocx();
    // } else {
    //   console.warn('No assistant message content to convert');
    // }
  }
  // ...existing code...
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
    } else if (event.shiftKey && event.key === 'Enter') {
      console.log('Shift + Enter pressed', this.prompt);
    } else if (event.key === 'Enter') {
      this.handleSubmit();
      console.log("Enter pressed", this.prompt);
      event.preventDefault();
    } else if (event.key === 'Escape') {
      this.prompt = '';
      event.preventDefault();
    } else if (event.ctrlKey && event.key === 'Backspace') {
      this.prompt = this.prompt.trimEnd().replace(/\s+\S*$/, '');
      event.preventDefault();
    }
  }
  generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const rand = (Math.random() * 16) | 0;
      const val = char === 'x' ? rand : (rand & 0x3) | 0x8;
      return val.toString(16);
    });
  }
  decodeHTMLEntities(text: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }
  toggleSidebar() {
    this.sharedService.triggerSidebarToggle();
  }
  autoResizeTextarea(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    console.log("Text Scroll height",textarea.clientHeight, textarea.scrollHeight);
    
    const newHeight = Math.min(textarea.scrollHeight, 150);
    textarea.style.height = newHeight + 'px';
    textarea.style.overflowY = textarea.scrollHeight > 150 ? 'auto' : 'hidden';
  };
  getPromptToStore() {
    console.log(this.prompt);
    sessionStorage.setItem('prompt', this.prompt);
  }
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    const windowWidth = event.target.innerWidth;
    const scroller = document.getElementsByClassName('scroller')[0];
    if (scroller) {
      const preTags = scroller.querySelectorAll('pre');
      preTags.forEach((preTag: Element) => {
        preTag.setAttribute('style', `width: ${scroller.clientWidth}px; max-width: 100%; box-sizing: border-box;`);
      });
    }
  }

  processFilesData(filesData: any[]) {
    const fileTypeOrder = ['image', 'doc', 'pdf'];
    const typeMap: { [key: string]: string; } = {
      'image/jpeg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
      'application/msword': 'doc'
    };
    const result: any = {
      filesData: {
        data: [],
        totalCount: 0,
        otherFileData: []
      },
      totalCount: filesData.length,
      otherFileData: []
    };
    const seenTypes = new Set<string>();
    for (const file of filesData) {
      const typeKey = typeMap[file.type];
      if (typeKey && !seenTypes.has(typeKey)) {
        result.filesData.data.push(file);
        seenTypes.add(typeKey);
      } else {
        result.otherFileData.push(file);
      }
    }
    result.filesData.data.sort((a: any, b: any) => {
      const typeA = typeMap[a.type];
      const typeB = typeMap[b.type];
      return fileTypeOrder.indexOf(typeA) - fileTypeOrder.indexOf(typeB);
    });
    return result;
  }
  copyToClipboard(content: string, index: number): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content).then(() => {
        console.log('Copied to clipboard');
        this.copiedMessageIndex = index;
        setTimeout(() => {
          this.copiedMessageIndex = null;
        }, 3000);
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        console.log('Copied to clipboard');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      document.body.removeChild(textarea);
    }
  }

  // Drag and Drop functionality
  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files);
    }
  }

  private async handleFileSelection(files: FileList): Promise<void> {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        file: file,
        value: '',
        previewUrl: ''
      };
      if (file.type.startsWith('image/')) {
        fileData.previewUrl = URL.createObjectURL(file);
      }

      try {
        fileData.value = await this.convertFileToBase64(file);
        this.filesData.push(fileData);
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }
    this.autoResizeTextarea(this.autoTextarea.nativeElement);
  }
}
