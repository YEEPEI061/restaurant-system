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

  // =========================
  // SUCCESS / ERROR MESSAGE
  // =========================

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
    private router: Router
  ) { }


  // =========================
  // TOGGLE PASSWORD
  // =========================

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }


  // =========================
  // SHOW SUCCESS
  // =========================

  showSuccess(
    title: string,
    message: string
  ): void {

    this.clearError();

    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
      this.successTimeout = undefined;
    }

    this.successTitle = title;
    this.successMessage = message;
  }


  // =========================
  // SHOW ERROR
  // =========================

  showError(
    title: string,
    message: string
  ): void {

    this.clearSuccess();

    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = undefined;
    }

    this.errorTitle = title;
    this.errorMessage = message;
  }


  // =========================
  // CLEAR SUCCESS
  // =========================

  clearSuccess(): void {

    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
      this.successTimeout = undefined;
    }

    this.successMessage = '';
    this.successTitle = '';
  }


  // =========================
  // CLEAR ERROR
  // =========================

  clearError(): void {

    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = undefined;
    }

    this.errorMessage = '';
    this.errorTitle = '';
  }


  // =========================
  // SIGN IN
  // =========================

  signIn(): void {

    this.clearError();
    this.clearSuccess();

    const email =
      this.staffIdentifier.trim().toLowerCase();

    const password =
      this.password;


    // FRONTEND VALIDATION
    if (!email || !password) {

      this.showError(
        'Incomplete Information',
        'Please enter your work email or staff ID and password.'
      );

      return;
    }


    // LOGIN REQUEST
    this.isSigningIn = true;

    this.authService
      .adminLogin({
        email,
        password
      })
      .subscribe({

        next: (response) => {

          console.log(
            'Admin login successful:',
            response.user
          );

          this.isSigningIn = false;

          this.showSuccess(
            'Access Granted',
            'Your staff credentials have been verified. Redirecting to Service & Floor Operations...'
          );


          // REDIRECT AFTER SUCCESS MESSAGE
          this.successTimeout =
            setTimeout(() => {

              this.clearSuccess();

              this.router.navigate([
                '/admin-dashboard'
              ]);

            }, 1400);
        },


        error: (error) => {

          console.error(
            'Admin login failed:',
            error
          );

          this.isSigningIn = false;

          this.showError(
            'Unable to Sign In',
            error?.error?.message ||
            'The staff credentials you entered are incorrect. Please try again.'
          );
        }

      });
  }
}