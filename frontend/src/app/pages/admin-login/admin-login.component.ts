import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

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

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  signIn(): void {
    if (!this.staffIdentifier || !this.password) {
      return;
    }

    this.isSigningIn = true;

    setTimeout(() => {
      this.isSigningIn = false;
      this.isAuthenticated = true;

      console.log('Staff sign in:', this.staffIdentifier);
    }, 900);
  }
}