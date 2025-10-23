import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;

  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'success';
  private notificationTimeout: any;

  showPassword = false;

  constructor(private fb: FormBuilder, private signUpService: AuthService, private router: Router) { }

  ngOnInit() {
    this.signupForm = this.fb.group({
      name: [''],
      email: [''],
      password: ['']
    });
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
    const { name, email, password } = this.signupForm.value;

    if (!name && !email && !password) {
      this.showToast('Please fill in all fields.', 'info');
    } else if (!name) {
      this.showToast('Please enter your name.', 'warning');
    } else if (!email) {
      this.showToast('Please enter your email.', 'warning');
    } else if (!password) {
      this.showToast('Please enter your password.', 'warning');
    } else {
      this.showToast('Account created successfully!', 'success');
      this.signUpService.signUp({ username: name, email, password }).subscribe({
        next: (response) => {
          this.showToast('Signup successful!', 'success');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000); // Redirect after 3 seconds
        },
        error: (error) => {
          console.log(error.message);
          console.log(error.status);

          // this.showToast('Invalid credentials. Please try again.', 'error');
        }
      });
      // Here you would handle actual signup logic
    }
  }
}
