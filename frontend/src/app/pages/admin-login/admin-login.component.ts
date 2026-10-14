import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {

  staffIdentifier = '';
  password = '';

  showPassword = false;
  isSigningIn = false;
  isAuthenticated = false;

  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  signIn(): void {

    this.errorMessage = '';

    const email = this.staffIdentifier.trim();
    const password = this.password;

    if (!email || !password) {
      this.errorMessage =
        'Please enter your email and password.';
      return;
    }

    this.isSigningIn = true;

    this.authService.adminLogin({
      email,
      password
    }).subscribe({

      next: (response) => {

        this.isSigningIn = false;
        this.isAuthenticated = true;

        console.log(
          'Admin login successful:',
          response.user
        );

        setTimeout(() => {
          this.router.navigate(['/admin-dashboard']);
        }, 900);
      },

      error: (error) => {

        this.isSigningIn = false;
        this.isAuthenticated = false;

        console.error(
          'Admin login failed:',
          error
        );

        this.errorMessage =
          error?.error?.message ||
          'Invalid email or password.';
      }
    });
  }
}