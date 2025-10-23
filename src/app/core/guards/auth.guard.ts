import { CanActivate, CanActivateFn, CanDeactivate, CanLoad, Router } from '@angular/router';
import { ChatAIComponent } from '../../pages/chat-ai/chat-ai.component';
import { Injectable } from '@angular/core';
import { AuthService } from '../service/auth.service';
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanLoad {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): boolean {
    return this.checkAuth();
  }

  canLoad(): boolean {
    return this.checkAuth();
  }

  private checkAuth(): boolean {
    console.log('AuthGuard: Checking authentication status');
    console.log('Is user authenticated:', this.authService.isAuthenticatedUser());


    if (this.authService.getAccessToken()) {
      return true;
    } else {
      // Redirect to the login page if the user is not authenticated
      this.router.navigate(['/login']);
      return false;
    }
  }

}