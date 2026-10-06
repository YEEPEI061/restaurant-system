import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

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

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  signIn(): void {
    this.isSigningIn = true;

    setTimeout(() => {
      console.log('Sign in:', this.email);
      this.isSigningIn = false;
    }, 1000);
  }

  socialLogin(provider: string): void {
    console.log(`${provider} login selected`);
  }
}