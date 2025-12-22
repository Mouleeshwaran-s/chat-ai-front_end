import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
interface LoginDetails {
    token: string;
    refreshToken: string;
    tokenType: string;
}
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private baseAPIUrl = environment.apiUrl
    private readonly API_BASE_URL = `${this.baseAPIUrl}/api/auth`;

    private ACCESS_TOKEN_KEY = 'access_token';
    private REFRESH_TOKEN_KEY = 'refresh_token';
    isAuthenticated: boolean = false;

    constructor(
        private https: HttpClient,
        private router: Router
    ) {
        this.isAuthenticated = this.isLoggedIn();
    }
    /** -----------------------------
     *  Authentication Methods
     *  ----------------------------- */
    checkLoginStatus(): Observable<{ isLoggedIn: boolean; }> {
        return new Observable<{ isLoggedIn: boolean; }>(observer => {
            this.getRefreshTokenForUser().subscribe(loginDetails => {
                const accessToken = loginDetails?.token;
                console.log('Checking login status with access token:', accessToken);

                if (!accessToken) {
                    observer.next({ isLoggedIn: false });
                } else {
                    observer.next({ isLoggedIn: true });
                }
                observer.complete();
            });
        });
    }

    /** -----------------------------
     *  Authentication APIs
     *  ----------------------------- */
    login(credentials: { email: string; password: string; }): Observable<any> {
        return this.https.post(`${this.API_BASE_URL}/login`, credentials).pipe(
            tap((response: any) => {
                this.saveAccessToken(response.token);
                this.saveRefreshToken(response.refreshToken);
            })
        );
    }

    signUp(details: { username: string; email: string; password: string; }): Observable<any> {
        return this.https.post(`${this.API_BASE_URL}/register`, details);
    }

    getRefreshTokenForUser(): Observable<LoginDetails | null> {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
            console.warn('No refresh token available');
            return new Observable<LoginDetails | null>(observer => {
                observer.next(null);
                observer.complete();
            });
        }

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`  // optional: some APIs don't need this for refresh
        });

        const body = { refreshToken };
        console.log('Requesting new access token with refresh token:', body);

        return this.https.post<LoginDetails>(`${this.API_BASE_URL}/refresh-token`, body, { headers })
            .pipe(
                tap((data: LoginDetails) => {
                    if (data?.token) {
                        localStorage.setItem('access_token', data.token);
                        localStorage.setItem('refresh_token', data.refreshToken);
                        localStorage.setItem('token_type', data.tokenType);
                    }
                })
            );
    }

    refreshToken(): Observable<any> {
        const refreshToken = this.getRefreshToken();
        const accessToken = this.getAccessToken();

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        });
        if (!refreshToken) {
            console.warn('No refresh token available');
            return new Observable(observer => {
                observer.error('No refresh token available');
                observer.complete();
            });
        }
        return this.https.post(`${this.API_BASE_URL}/refresh-token`, { refreshToken }, { headers });
    }
    isAuthenticatedUser(): boolean {
        return this.isAuthenticated;
    }

    logout(): Observable<any> {
        const refreshToken = this.getRefreshToken();
        const accessToken = this.getAccessToken();

        if (!refreshToken) {
            this.clearTokens();
            this.router.navigate(['/login']);
            return new Observable(observer => {
                observer.next({ msg: 'Logged out locally' });
                observer.complete();
            });
        }

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        });

        return this.https.post(`${this.API_BASE_URL}/logout`, { refreshToken }, { headers }).pipe(
            tap(() => {
                this.clearTokens();
                this.router.navigate(['/login']);
            })
        );
    }

    /** -----------------------------
     *  Token Utilities
     *  ----------------------------- */
    saveAccessToken(token: string): void {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    }

    saveRefreshToken(token: string): void {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }

    getAccessToken(): string | null {
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    clearTokens(): void {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }

    isLoggedIn(): boolean {
        return !!this.getAccessToken();
    }
}
