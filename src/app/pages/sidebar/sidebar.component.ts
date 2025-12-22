import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SharedService } from '../../core/service/shared.service';
import { SidebarService } from './service/sidebar.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/service/auth.service';

// Interface for chat history items
interface ChatHistoryTitle {
  sessionId: string;
  title: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  imports: [
    CommonModule,
    RouterModule,
  ],
})
export class SidebarComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  title = 'chatAI';
  userName: string = '';
  sidebarClosed = false; // Tracks sidebar open/close state
  showSidebarContent = true; // Controls sidebar content visibility (with delay)
  chatHistory: ChatHistoryTitle[] = []; // Stores chat history titles
  activeSessionId: string = ''; // Currently active chat session
  isOverlay: boolean = false; // Determines if sidebar is in overlay mode
  isMobileView: boolean = false; // Tracks if the view is mobile-sized
  isChatActive: boolean = true; // Tracks if chat is currently active
  lastSegment: string = '';
  private subscriptions: Subscription = new Subscription();

  constructor(
    private service: SidebarService,
    private sharedService: SharedService,
    private router: Router,
    private ctr: ChangeDetectorRef,
    private authService: AuthService
  ) { }
  ngAfterViewChecked(): void {
    // if (window.innerWidth < 768) {
    //   this.isOverlay = !this.isOverlay;
    // } else {
    //   this.isOverlay = false;
    // }
    // this.ctr.detectChanges();
    const pathSegments = this.router.url.split('/');
    console.log('Path Segments:', pathSegments);
    // get last index
    this.lastSegment = pathSegments[pathSegments.length - 1];
    console.log("last Segment", this.lastSegment);

  }

  /**
   * Lifecycle hook: Initializes sidebar state and subscriptions.
   */
  ngOnInit(): void {
    // Restore sidebar state from localStorage
    this.sidebarClosed = JSON.parse(localStorage.getItem('sidebarClosed') || 'false');
    this.showSidebarContent = !this.sidebarClosed;
    this.updateOverlayMode();
    this.getCurrentUsername();

    // Subscribe to sidebar toggle events
    this.subscriptions.add(
      this.sharedService.sidebarToggle$.subscribe(() => this.toggleSidebar())
    );

    // Subscribe to chat history update events
    this.subscriptions.add(
      this.sharedService.sidebarChatHistoryUpdate$.subscribe(() => this.getAllChatHistoryTitle())
    );

    // Subscribe to component switch events to keep isChatActive in sync
    this.subscriptions.add(
      this.sharedService.componentSwitch$.subscribe((isChatActive: boolean) => {
        this.isChatActive = isChatActive;
        this.ctr.detectChanges();
      })
    );

    // Initial fetch of chat history
    this.getAllChatHistoryTitle();

    // Set initial state based on current route
    this.updateChatActiveBasedOnRoute();

    this.isMobileView = window.innerWidth < 768;
  }

  ngAfterViewInit(): void {
    // Ensure overlay mode is correct after view initializes
    this.updateOverlayMode();
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions to prevent memory leaks
    this.subscriptions.unsubscribe();
  }

  /**
   * Listen to window resize events and update overlay mode accordingly.
   */
  @HostListener('window:resize')
  onResize() {
    this.updateOverlayMode();
  }

  /**
   * Updates the sidebar overlay mode based on current window width.
   * Overlay is enabled for screens < 768px.
   */
  private updateOverlayMode(): void {
    this.isOverlay = window.innerWidth < 768;
  }

  /**
   * Updates the isChatActive property based on the current route.
   */
  private updateChatActiveBasedOnRoute(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/rag')) {
      this.isChatActive = false;
    } else if (currentUrl.includes('/chat')) {
      this.isChatActive = true;
    }
  }

  /**
   * Toggles the sidebar open/close state with a short delay for content visibility.
   */
  toggleSidebar(): void {
    this.sidebarClosed = !this.sidebarClosed;
    localStorage.setItem('sidebarClosed', JSON.stringify(this.sidebarClosed));

    // Delay content visibility for smooth transition
    setTimeout(() => {
      this.showSidebarContent = !this.sidebarClosed;
    }, 100);

    // Notify other components about sidebar toggle
    this.sharedService.triggerSidebarToggleSideToChat();
  }

  /**
   * Fetches all chat history titles and updates the active session based on the current route.
   */
  getAllChatHistoryTitle(): void {
    console.log("Last segment: ",this.lastSegment);
    
    if (this.lastSegment = 'chat') {
      this.service.getAllChatHistoryTitle().subscribe({
        next: (history: any[]) => {
          // Clear previous history to avoid duplicates
          this.chatHistory = [];
          // Populate chat history
          history.forEach(item => {
            this.chatHistory.push({ sessionId: item.sessionId, title: item.title });
          });

          // Determine active session from the current route
          const pathSegments = this.router.url.split('/');
          const lastSegment = pathSegments[pathSegments.length - 1];
          this.activeSessionId = lastSegment;
        },
        error: (error) => {
          // Handle errors gracefully
          console.error('Error fetching chat history:', error);
          this.chatHistory = [];
        }
      });
    } else if (this.lastSegment = 'rag') {

      this.service.getAllRagHistoryTitle().subscribe({
        next: (history: any[]) => {
          // Clear previous history to avoid duplicates
          this.chatHistory = [];
          // Populate chat history
          history.forEach(item => {
            this.chatHistory.push({ sessionId: item.sessionId, title: item.title });
          });

          // Determine active session from the current route
          const pathSegments = this.router.url.split('/');
          const lastSegment = pathSegments[pathSegments.length - 1];
          this.activeSessionId = lastSegment;
        },
        error: (error) => {
          // Handle errors gracefully
          console.error('Error fetching chat history:', error);
          this.chatHistory = [];
        }
      });
    }
  }

  /**
   * Sets the active chat session and notifies other components.
   * @param session Session ID to set as active
   */
  setActiveSession(session: string): void {
    this.activeSessionId = session;
    sessionStorage.setItem('generated_id', session);
    if (this.isMobileView || window.innerWidth < 768) {
      this.sidebarClosed = !this.sidebarClosed;
      // this.isOverlay = false;
    }
    this.sharedService.triggerSessionSelected(session);
  }

  createNewChat(): void {
    this.activeSessionId = '';

    // Trigger component switch to Chat-AI
    // this.sharedService.triggerComponentSwitch(true);
    this.sharedService.triggerCreateNewChat();
  }

  createNewChatSession(): void {
    this.activeSessionId = '';

    // Navigate to chat
    this.router.navigate(['/chat']);

    // Trigger component switch to Chat-AI
    this.sharedService.triggerComponentSwitch(true);

    // Close sidebar on mobile
    if (this.isMobileView || window.innerWidth < 768) {
      this.sidebarClosed = true;
      this.showSidebarContent = false;
      localStorage.setItem('sidebarClosed', 'true');
    }
    this.ctr.detectChanges();
  }

  createNewRagSession(): void {
    this.activeSessionId = '';

    // Navigate to RAG agent
    this.router.navigate(['/rag']);

    // Trigger component switch to RAG agent
    this.sharedService.triggerComponentSwitch(false);

    // Close sidebar on mobile
    if (this.isMobileView || window.innerWidth < 768) {
      this.sidebarClosed = true;
      this.showSidebarContent = false;
      localStorage.setItem('sidebarClosed', 'true');
    }
    this.ctr.detectChanges();
  }

  getCurrentUsername() {
    this.sharedService.getCurrentUsername().then((response: any) => {
      if (response && response.username) {
        this.userName = response.username;
        this.ctr.detectChanges();
      } else {
        console.warn('Username not found in response:', response);
      }
    });
  }
}
