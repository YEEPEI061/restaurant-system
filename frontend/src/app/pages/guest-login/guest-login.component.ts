import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
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

  successMessage = '';
  successTitle = '';

  errorMessage = '';
  errorTitle = '';

  private successTimeout:
    ReturnType<typeof setTimeout> | undefined;

  private errorTimeout:
    ReturnType<typeof setTimeout> | undefined;


  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }


  // =========================
  // TOGGLE PASSWORD
  // =========================

  togglePassword(): void {
    this.showPassword =
      !this.showPassword;
  }


  // =========================
  // SIGN IN
  // =========================

  signIn(): void {

    this.clearError();
    this.clearSuccess();

    const email =
      this.email.trim().toLowerCase();

    const password =
      this.password;


    // =========================
    // FRONTEND VALIDATION
    // =========================

    if (!email || !password) {

      this.showError(
        'Incomplete Information',
        'Please enter your email address and password.'
      );

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

        next: (response) => {

          console.log(
            'Guest login successful:',
            response
          );

          this.isSigningIn =
            false;

          this.showSuccess(
            'Welcome Back',
            'You have signed in successfully. Redirecting to your reservations...'
          );

          setTimeout(() => {

            this.clearSuccess();

            const returnUrl =
              this.route.snapshot.queryParamMap.get(
                'returnUrl'
              );

            this.router.navigateByUrl(
              returnUrl || '/menu'
            );

          }, 1400);
        },

        error: (error) => {

          console.error(
            'Guest login error:',
            error
          );

          this.isSigningIn =
            false;

          this.showError(
            'Unable to Sign In',
            error?.error?.message ||
            'The email or password you entered is incorrect. Please try again.'
          );
        }

      });
  }


  // =========================
  // SUCCESS MESSAGE
  // =========================

  showSuccess(
    title: string,
    message: string
  ): void {

    // Remove existing error
    this.clearError();

    // Reset existing timer
    if (this.successTimeout) {

      clearTimeout(
        this.successTimeout
      );

      this.successTimeout =
        undefined;
    }

    this.successTitle =
      title;

    this.successMessage =
      message;
  }


  // =========================
  // ERROR MESSAGE
  // =========================

  showError(
    title: string,
    message: string
  ): void {

    // Remove existing success message
    this.clearSuccess();

    // Cancel previous error timer
    if (this.errorTimeout) {

      clearTimeout(
        this.errorTimeout
      );

      this.errorTimeout =
        undefined;
    }

    this.errorTitle =
      title;

    this.errorMessage =
      message;
  }


  // =========================
  // CLEAR SUCCESS
  // =========================

  clearSuccess(): void {

    if (this.successTimeout) {

      clearTimeout(
        this.successTimeout
      );

      this.successTimeout =
        undefined;
    }

    this.successMessage =
      '';

    this.successTitle =
      '';
  }


  // =========================
  // CLEAR ERROR
  // =========================

  clearError(): void {

    if (this.errorTimeout) {

      clearTimeout(
        this.errorTimeout
      );

      this.errorTimeout =
        undefined;
    }

    this.errorMessage =
      '';

    this.errorTitle =
      '';
  }


  // =========================
  // SOCIAL LOGIN
  // =========================

  socialLogin(
    provider: string
  ): void {

    console.log(
      `${provider} login selected`
    );
  }

}