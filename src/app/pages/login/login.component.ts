import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from './service/login.service';
import { AuthService } from '../../core/service/auth.service';
import { SharedService } from '../../core/service/shared.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class LoginComponent implements OnInit {
  isUserLoggedIn = false;
  loginForm!: FormGroup;
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'success';
  private notificationTimeout: any;

  showPassword = false;
  isLoading = false;

  constructor(private fb: FormBuilder, private loginService: AuthService, private router: Router, private shared: SharedService) { }

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: [''],
      password: ['']
    });
    // Check if the user is already logged in
    this.loginService.checkLoginStatus().subscribe({
      next: (response) => {
        console.log('Login status:', response);
        if (response.isLoggedIn) {
          this.isUserLoggedIn = true;
          this.shared.isUserLoggedIn = true;
          this.router.navigate(['/chat']);
        } else {
          this.isUserLoggedIn = false;
          this.shared.isUserLoggedIn = false;
        }
      },
      error: (error) => {
        console.error('Error checking login status:', error);
        this.isUserLoggedIn = false;
        this.shared.isUserLoggedIn = false;
      }
    });
    // Subscribe to shared service to get the login status
    this.isUserLoggedIn = this.shared.isUserLoggedIn;
  }

  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    setTimeout(() => {
      const progress = document.querySelector('.notification-progress') as HTMLElement;
      if (progress) {
        progress.style.transition = 'none';
        progress.style.transform = 'scaleX(0)';
        void progress.offsetWidth;
        progress.style.transition = 'transform 3s linear';
        progress.style.transform = 'scaleX(1)';
      }
    }, 10);

    clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(() => {
      this.showNotification = false;
    }, 3000);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    const { email, password } = this.loginForm.value;

    if (!email && !password) {
      this.showToast('Please enter both email and password.', 'info');
    } else if (!email) {
      this.showToast('Please enter your email.', 'warning');
    } else if (!password) {
      this.showToast('Please enter your password.', 'warning');
    } else {
      // Set loading state to true
      this.isLoading = true;
      
      this.loginService.login({ email: email, password }).subscribe({
        next: (response) => {
          this.isLoading = false; // Stop loading
          this.showToast('Login successful!', 'success');
          setTimeout(() => {
            this.router.navigate(['/chat']);
          }, 3000); // Redirect after 3 seconds
        },
        error: (error) => {
          this.isLoading = false; // Stop loading
          this.showToast('Invalid credentials. Please try again.', 'error');
        }
      });
    }
  }
}
