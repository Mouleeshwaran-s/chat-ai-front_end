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
  isLoading = false;

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
      // Set loading state to true
      this.isLoading = true;
      
      // Make the API call without showing premature success message
      this.signUpService.signUp({ username: name, email, password }).subscribe({
        next: (response) => {
          this.isLoading = false; // Stop loading
          
          // check for response status code 200
          if (response.msg == "User registered successfully") {
            this.showToast('Account created successfully!', 'success');
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000); // Redirect after 2 seconds
          }else {
            this.showToast('Signup failed. Please try again.', 'error');
          }
        },
        error: (error) => {
          this.isLoading = false; // Stop loading
          
          console.log(error);
          console.log(error.status);
          
          // Show appropriate error message based on status code
          if (error.status === 400) {
            this.showToast(error.error, 'error');
          } else if (error.status === 409) {
            this.showToast('Email already exists. Please use a different email.', 'error');
          } else {
            this.showToast('Signup failed. Please try again.', 'error');
          }
        }
      });
      // Here you would handle actual signup logic
    }
  }
}
