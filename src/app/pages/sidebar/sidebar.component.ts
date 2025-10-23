import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SharedService } from '../../core/service/shared.service';
import { SidebarService } from './service/sidebar.service';
import { CommonModule } from '@angular/common';
import { CdkAutofill } from "@angular/cdk/text-field";

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
    CdkAutofill
  ],
})
export class SidebarComponent implements OnInit, AfterViewInit, AfterViewChecked {
  title = 'chatAI';
  userName: string = '';
  sidebarClosed = false; // Tracks sidebar open/close state
  showSidebarContent = true; // Controls sidebar content visibility (with delay)
  chatHistory: ChatHistoryTitle[] = []; // Stores chat history titles
  activeSessionId: string = ''; // Currently active chat session
  isOverlay: boolean = false; // Determines if sidebar is in overlay mode
  isMobileView: boolean = false; // Tracks if the view is mobile-sized

  constructor(
    private service: SidebarService,
    private sharedService: SharedService,
    private router: Router,
    private ctr: ChangeDetectorRef
  ) { }
  ngAfterViewChecked(): void {
    // if (window.innerWidth < 768) {
    //   this.isOverlay = !this.isOverlay;
    // } else {
    //   this.isOverlay = false;
    // }
    // this.ctr.detectChanges();
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
    this.sharedService.sidebarToggle$.subscribe(() => this.toggleSidebar());

    // Subscribe to chat history update events
    this.sharedService.sidebarChatHistoryUpdate$.subscribe(() => this.getAllChatHistoryTitle());

    // Initial fetch of chat history
    this.getAllChatHistoryTitle();

    this.sharedService.sidebarChatHistoryUpdate$.subscribe(() => {
      this.getAllChatHistoryTitle();
    });
    this.isMobileView = window.innerWidth < 768;
  }

  ngAfterViewInit(): void {
    // Ensure overlay mode is correct after view initializes
    this.updateOverlayMode();
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

    this.sharedService.triggerCreateNewChat();
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
