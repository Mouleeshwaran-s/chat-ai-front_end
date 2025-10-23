import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {

  constructor(private http: HttpClient) { }
  private baseAPIUrl = environment.apiUrl;
  API_URL = `${this.baseAPIUrl}/api`;

  getAllChatHistoryTitle(): Observable<any> {
    const url = `${this.API_URL}/chatHistory/titles`;
    const headers = this.getHeaderWithAuth();
    return this.http.get(url, { headers });
  }
  getHeaderWithAuth(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }
}