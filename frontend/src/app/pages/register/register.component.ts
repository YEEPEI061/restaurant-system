import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

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

  agreeToTerms = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  createAccount(): void {

    if (
      !this.firstName ||
      !this.lastName ||
      !this.email ||
      !this.password ||
      !this.confirmPassword
    ) {
      return;
    }

    if (this.password !== this.confirmPassword) {
      return;
    }

    if (!this.agreeToTerms) {
      return;
    }

    this.isCreatingAccount = true;

    setTimeout(() => {

      this.isCreatingAccount = false;
      this.accountCreated = true;

      console.log('Account created:', {
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        phone: this.phone
      });

    }, 1200);
  }

  socialRegister(provider: string): void {
    console.log(`${provider} registration selected`);
  }
}