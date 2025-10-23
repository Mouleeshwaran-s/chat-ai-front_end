import { HttpInterceptorFn } from '@angular/common/http';
import {
    HttpRequest,
    HttpHandlerFn,
    HttpEvent,
    HttpErrorResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../service/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
    req: HttpRequest<any>,
    next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
    const authService = inject(AuthService);
    const accessToken = authService.getAccessToken();

    let authReq = req;
    if (accessToken) {
        authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${accessToken}`
            }
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (
                error.status === 401 &&
                !authReq.url.includes('/auth/login') &&
                !authReq.url.includes('/auth/refresh-token')
            ) {
                return handle401(authReq, next, authService);
            }
            return throwError(() => error);
        })
    );
};

function handle401(
    request: HttpRequest<any>,
    next: HttpHandlerFn,
    authService: AuthService
): Observable<HttpEvent<any>> {
    if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);

        return authService.refreshToken().pipe(
            switchMap((res: any) => {
                isRefreshing = false;
                console.log('Response received:', res);

                authService.saveAccessToken(res.token);
                authService.saveRefreshToken(res.refreshToken);
                refreshTokenSubject.next(res.token);
                return next(
                    request.clone({
                        setHeaders: {
                            Authorization: `Bearer ${res.token}`
                        }
                    })
                );
            }),
            catchError((err) => {
                isRefreshing = false;
                authService.logout();
                return throwError(() => err);
            })
        );
    } else {
        return refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((token) =>
                next(
                    request.clone({
                        setHeaders: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                )
            )
        );
    }
}
