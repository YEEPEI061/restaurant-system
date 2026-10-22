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
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  firstName = '';
  lastName = '';
  email = '';
  phone = '';

  password = '';
  confirmPassword = '';

  showPassword = false;
  showConfirmPassword = false;

  isCreatingAccount = false;
  accountCreated = false;

  successMessage = '';
  successTitle = '';

  errorMessage = '';
  errorTitle = '';

  private successTimeout:
    ReturnType<typeof setTimeout> | undefined;

  private errorTimeout:
    ReturnType<typeof setTimeout> | undefined;

  agreeToTerms = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  togglePassword(): void {
    this.showPassword =
      !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword =
      !this.showConfirmPassword;
  }

  createAccount(): void {

    this.clearError();
    this.clearSuccess();

    /*
     * REQUIRED FIELDS
     */
    if (
      !this.firstName.trim() ||
      !this.lastName.trim() ||
      !this.email.trim() ||
      !this.password ||
      !this.confirmPassword
    ) {

      this.showError(
        'Incomplete Information',
        'Please complete all required fields.'
      );

      return;
    }

    /*
     * PASSWORD LENGTH
     */
    if (this.password.length < 8) {

      this.showError(
        'Invalid Password',
        'Password must contain at least 8 characters.'
      );

      return;
    }

    /*
     * PASSWORD MATCH
     */
    if (
      this.password !==
      this.confirmPassword
    ) {

      this.showError(
        'Passwords Do Not Match',
        'Please make sure both password fields match.'
      );

      return;
    }

    /*
     * TERMS AND PRIVACY
     */
    if (!this.agreeToTerms) {

      this.showError(
        'Agreement Required',
        'Please agree to the Terms of Service and Privacy Policy before creating your account.'
      );

      return;
    }

    this.isCreatingAccount = true;

    /*
     * CREATE GUEST ACCOUNT
     */
    this.authService
      .guestSignup({
        firstName:
          this.firstName.trim(),

        lastName:
          this.lastName.trim(),

        email:
          this.email.trim(),

        phone:
          this.phone.trim(),

        password:
          this.password
      })
      .subscribe({

        next: (response) => {

          console.log(
            'Account created:',
            response
          );

          this.isCreatingAccount =
            false;

          this.showSuccess(
            'Account Created',
            'Your Aurelia guest account has been created successfully. You can now sign in to continue.'
          );
        },

        error: (error) => {

          console.error(
            'Registration failed:',
            error
          );

          this.isCreatingAccount =
            false;

          if (
            error.status === 400 ||
            error.status === 409
          ) {

            this.showError(
              'Unable to Create Account',
              error?.error?.message ||
              'Please check your registration details and try again.'
            );

            return;
          }

          this.showError(
            'Registration Failed',
            error?.error?.message ||
            'Unable to create your account. Please try again.'
          );
        }

      });
  }

  continueToLogin(): void {

    this.clearSuccess();

    this.router.navigate([
      '/guest-login'
    ]);
  }

  socialRegister(
    provider: string
  ): void {

    console.log(
      `${provider} registration selected`
    );
  }

  /*
 * --------------------------------------------------
 * SUCCESS MESSAGE
 * --------------------------------------------------
 */

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


  /*
   * --------------------------------------------------
   * ERROR MESSAGE
   * --------------------------------------------------
   */

  showError(
    title: string,
    message: string
  ): void {

    // Remove existing success message
    this.clearSuccess();

    // Cancel any previous error timer
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


  /*
   * --------------------------------------------------
   * CLEAR SUCCESS
   * --------------------------------------------------
   */

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


  /*
   * --------------------------------------------------
   * CLEAR ERROR
   * --------------------------------------------------
   */

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
}