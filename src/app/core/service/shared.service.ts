import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment.development';
interface LoginDetails {
  token: string;
  refreshToken: string;
  tokenType: string;
}
@Injectable({
  providedIn: 'root'
})
export class SharedService {
  isUserLoggedIn = false;
  access_token = localStorage.getItem('access_token') || '';
  refresh_token = localStorage.getItem('refresh_token') || '';
  token_type = localStorage.getItem('token_type') || '';
  constructor(private https: HttpClient, private router: Router) {

  }
  private sidebarToggleSourceChatToSide = new Subject<void>();
  private sidebarToggleSourceSideToChat = new Subject<void>();
  private sidebarChatHistoryUpdateSource = new Subject<void>();
  private createNewChatSource = new Subject<void>();
  createNewChat$ = this.createNewChatSource.asObservable();
  sidebarChatHistoryUpdate$ = this.sidebarChatHistoryUpdateSource.asObservable();
  sidebarToggle$ = this.sidebarToggleSourceChatToSide.asObservable();
  sidebarToggleSide$ = this.sidebarToggleSourceSideToChat.asObservable();
  // Method to trigger the sidebar toggle from chat to side
  triggerSidebarToggleSideToChat() {
    this.sidebarToggleSourceSideToChat.next();
  }
  // Method to trigger the sidebar toggle from side to chat
  triggerSidebarToggle() {
    this.sidebarToggleSourceChatToSide.next();
  }
  triggerSidebarChatHistoryUpdate() {
    this.sidebarChatHistoryUpdateSource.next();
  }
  triggerCreateNewChat() {
    this.createNewChatSource.next();
  }
  private userSetSource = new Subject<any>();
  userSet$ = this.userSetSource.asObservable();

  triggerUserSet(user: any) {
    this.userSetSource.next(user);
  }

  private sessionSelectedSource = new Subject<string>();
  sessionSelected$ = this.sessionSelectedSource.asObservable();

  triggerSessionSelected(sessionId: string) {
    this.sessionSelectedSource.next(sessionId);
  }

  private componentSwitchSource = new Subject<boolean>();
  componentSwitch$ = this.componentSwitchSource.asObservable();

  triggerComponentSwitch(isChatActive: boolean) {
    this.componentSwitchSource.next(isChatActive);
  }
  // Chat AI Service
  private baseAPIUrl = environment.apiUrl
  private apiUrl = `${this.baseAPIUrl}/api`;
  getCurrentUsername(): Promise<any> {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      console.warn('No refresh token available');
      return Promise.resolve(undefined);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    });
    const url = `${this.apiUrl}/users/getName`;
    return this.https.get(url, { headers }).toPromise().then((response: any) => {
      return response;
    }).catch((error) => {
      console.log('Error fetching users:', error);

      // Check for HttpErrorResponse and status
      const errorStatus = error?.status ?? error?.response?.status;
      if (typeof errorStatus !== 'undefined') {
        console.log('Error code:', errorStatus);
      } else {
        console.log('Error code not available. Full error:', error);
      }
    });
  }

  // get refresh-token
  getRefreshToken(): void {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      console.warn('No refresh token available');
      return;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`  // optional: some APIs don't need this for refresh
    });

    const body = { refreshToken };
    console.log('Requesting new access token with refresh token:', body);


    this.https.post<LoginDetails>(`${this.apiUrl}/auth/refresh-token`, body, { headers })
      .subscribe({
        next: (data: LoginDetails) => {
          if (data?.token) {
            this.isUserLoggedIn = true;
            this.access_token = data.token;
            this.refresh_token = data.refreshToken;
            this.token_type = data.tokenType;
            localStorage.setItem('access_token', data.token);
            localStorage.setItem('refresh_token', data.refreshToken);
            localStorage.setItem('token_type', data.tokenType);
          }
        },
        error: (err) => {
          if (err.status === 401) {
            this.performLogout();
          }
        }
      });
  }
  private performLogout(): void {
    // Clear all session data
    this.isUserLoggedIn = false;
    this.access_token = '';
    this.refresh_token = '';
    this.token_type = '';
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_type');

    // Optionally clear other app state here...

    // Navigate to home
    this.router.navigate(['/login']);
  }

  getRefreshTokenDetails() {
    return this.https.post<LoginDetails>(`${this.apiUrl}/auth/refresh-token`, { refreshToken: this.access_token });
  }
}
