import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Router,
  RouterLink
} from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-guest-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './guest-login.component.html',
  styleUrl: './guest-login.component.css'
})
export class GuestLoginComponent {

  email = '';
  password = '';

  showPassword = false;
  isSigningIn = false;

  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}


  // =========================
  // TOGGLE PASSWORD
  // =========================

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }


  // =========================
  // SIGN IN
  // =========================

  signIn(): void {

    this.errorMessage = '';

    const email =
      this.email.trim().toLowerCase();

    const password =
      this.password;


    // =========================
    // FRONTEND VALIDATION
    // =========================

    if (!email || !password) {
      this.errorMessage =
        'Please enter your email address and password.';

      return;
    }


    // =========================
    // LOGIN REQUEST
    // =========================

    this.isSigningIn = true;

    this.authService
      .guestLogin({
        email,
        password
      })
      .subscribe({

        next: () => {

          this.isSigningIn = false;

          this.router.navigate([
            '/reservations'
          ]);
        },

        error: (error) => {

          console.error(
            'Guest login error:',
            error
          );

          this.isSigningIn = false;

          this.errorMessage =
            error?.error?.message ||
            'Unable to sign in. Please try again.';
        }
      });
  }


  // =========================
  // SOCIAL LOGIN
  // =========================

  socialLogin(provider: string): void {
    console.log(
      `${provider} login selected`
    );
  }
}