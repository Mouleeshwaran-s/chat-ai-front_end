import { Injectable } from '@angular/core';
import { DocumentSource } from './interfaces/rag.interfaces';
import { environment } from '../../../../environments/environment.development';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RagService {
  private baseAPIUrl = environment.apiUrl;
  private apiUrl = `${this.baseAPIUrl}/api/rag/stream`;
  API_URL = `${this.baseAPIUrl}/api`;
  constructor(private http: HttpClient, private router: Router) { }

  streamRagChat(
    payload: FormData,
    onChunk: (data: string) => void,
    onError: (err: any) => void,
    onComplete: () => void
  ) {
    this.makeStreamRequest(payload, onChunk, onError, onComplete);
  }

  private async makeStreamRequest(
    payload: FormData,
    onChunk: (data: string) => void,
    onError: (err: any) => void,
    onComplete: () => void,
    isRetry: boolean = false
  ): Promise<void> {
    const token = localStorage.getItem('access_token');

    console.log('Making stream request with FormData payload');

    // Log FormData contents for debugging
    for (let [key, value] of (payload as any).entries()) {
      if (value instanceof File) {
        console.log(`FormData key: ${key}, File: ${value.name}, Type: ${value.type}`);
      } else {
        console.log(`FormData key: ${key}, Value: ${value}`);
      }
    }

    try {
      let isCodeBlock = false;
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          // Don't set Content-Type - browser will set it with boundary for multipart/form-data
          'Accept': 'text/event-stream',
          'Authorization': `Bearer ${token}`,
        },
        body: payload,
      });

      if (response.status === 401 && !isRetry) {
        console.warn('Stream request got 401, attempting token refresh');
        await this.performRefreshToken();
        return this.makeStreamRequest(payload, onChunk, onError, onComplete, true);
      }

      if (!response.ok || !response.body) {
        throw new Error(`Failed to connect to stream: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode incoming bytes
        buffer += decoder.decode(value, { stream: true });

        // SSE format: each message is terminated by \n\n
        // But Spring Boot SSE may send single \n between data: lines
        const lines = buffer.split('\n');

        // Keep last line (might be incomplete)
        buffer = lines.pop() || '';
        let count = 0;

        // Process complete lines
        for (const line of lines) {
          if (!line.trim()) continue; // Skip empty lines
          console.log("Line:", line);

          // if line exactly equals to data: for two time in a row, append '\n' to onChunk('\n')
          if (line === 'data:' && count > 0 && lines[count - 1] === 'data:') {
            onChunk('\n');
          }

          // SSE data format: "data: <content>"
          if (line.startsWith('data:')) {
            let content = line.substring(5); // Remove "data:"
            console.log("Content: ", content);
            console.log("Content Size: ", content.length);

            // Handle "data: " with space vs "data:" without space
            if (content.startsWith(' ')) {
              content = content.substring(1);
            }

            // Skip control messages
            if (content === '[DONE]' || content === 'done') {
              console.log('✅ Stream completed');
              continue;
            }

            // Stream chunk to UI - preserve ALL formatting
            console.log('📦 Chunk:', content.length > 50 ? content.substring(0, 50) + '...' : content);
            onChunk(content);
          }
          count++;
        }
      }

      // Handle any remaining buffer content
      if (buffer.trim()) {
        if (buffer.startsWith('data:')) {
          let content = buffer.substring(5);
          if (content.startsWith(' ')) {
            content = content.substring(1);
          }
          if (content && content !== '[DONE]') {
            console.log('📦 Final chunk:', content);
            onChunk(content);
          }
        }
      }

      onComplete();
    } catch (err) {
      console.error('Stream request error:', err);
      onError(err);
    }
  }
  saveChatHistory(chatHistory: any) {
    const url = `${this.API_URL}/ragHistory/title`;
    const headers = this.getHeaderWithAuth();
    return this.http.post(url, chatHistory, { headers });
  }
  getUserChatHistory(session_id: any) {
    const url = `${this.API_URL}/rag/data/${session_id}`;
    const headers = this.getHeaderWithAuth();
    return this.http.get(url, { headers }).toPromise().then((response: any) => {
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

  performRefreshToken(): Promise<void> {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.warn('No refresh token available');
      this.performLogout();
      // return Promise.reject('No refresh token available');
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    });
    const body = { refreshToken };
    return this.http.post<any>(`${this.API_URL}/auth/refresh-token`, body, { headers })
      .toPromise()
      .then((response) => {
        localStorage.setItem('access_token', response.token);
        localStorage.setItem('refresh_token', response.refreshToken);
      })
      .catch((error) => {
        console.error('Error refreshing token:', error);
        this.performLogout();
      });
  }
  getHeaderWithAuth(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }
  private performLogout(): void {
    // Clear all session data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_type');

    // Optionally clear other app state here...

    // Navigate to home
    this.router.navigate(['/login']);
  }
}