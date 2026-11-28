import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

import { AuthService } from '../../services/auth.service';
import {
    AuthUser,
    UpdateProfileData,
    ChangePasswordData
} from '../../models/auth.model';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        HeaderComponent,
        FooterComponent
    ],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {

    user: AuthUser | null = null;

    // Profile form
    profileData: UpdateProfileData = {
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    };

    // Password form
    passwordData: ChangePasswordData = {
        currentPassword: '',
        newPassword: ''
    };

    confirmPassword = '';

    showCurrentPassword = false;
    showNewPassword = false;
    showConfirmPassword = false;

    // Loading states
    isLoading = true;
    isSavingProfile = false;
    isChangingPassword = false;

    // Feedback messages
    profileSuccess = '';
    profileError = '';

    passwordSuccess = '';
    passwordError = '';

    private profileSuccessTimeout?: ReturnType<typeof setTimeout>;
    private passwordSuccessTimeout?: ReturnType<typeof setTimeout>;

    constructor(
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.loadProfile();
    }

    ngOnDestroy(): void {
        if (this.profileSuccessTimeout) {
            clearTimeout(this.profileSuccessTimeout);
        }

        if (this.passwordSuccessTimeout) {
            clearTimeout(this.passwordSuccessTimeout);
        }
    }

    // =========================
    // LOAD PROFILE
    // =========================

    loadProfile(): void {
        this.isLoading = true;

        this.authService.getCurrentUser().subscribe({
            next: (response) => {
                this.user = response.user;

                this.profileData = {
                    firstName: response.user.firstName,
                    lastName: response.user.lastName,
                    email: response.user.email,
                    phone: response.user.phone || ''
                };

                this.isLoading = false;
            },
            error: (error) => {
                this.isLoading = false;

                this.profileError =
                    error.error?.message ||
                    'Unable to load your profile.';
            }
        });
    }

    showProfileSuccess(message: string): void {

        // Remove existing error
        this.profileError = '';

        // Reset existing timer
        if (this.profileSuccessTimeout) {
            clearTimeout(this.profileSuccessTimeout);
        }

        this.profileSuccess = message;

        this.profileSuccessTimeout = setTimeout(() => {

            this.profileSuccess = '';

        }, 1600);
    }

    showPasswordSuccess(message: string): void {

        this.passwordError = '';

        if (this.passwordSuccessTimeout) {
            clearTimeout(this.passwordSuccessTimeout);
        }

        this.passwordSuccess = message;

        this.passwordSuccessTimeout = setTimeout(() => {
            this.passwordSuccess = '';
        }, 1600);
    }

    // =========================
    // UPDATE PROFILE
    // =========================

    saveProfile(): void {
        this.profileSuccess = '';
        this.profileError = '';

        const data: UpdateProfileData = {
            firstName: this.profileData.firstName.trim(),
            lastName: this.profileData.lastName.trim(),
            email: this.profileData.email.trim(),
            phone: this.profileData.phone?.trim() || ''
        };

        if (
            !data.firstName ||
            !data.lastName ||
            !data.email
        ) {
            this.profileError =
                'Please complete all required fields.';
            return;
        }

        this.isSavingProfile = true;

        this.authService.updateProfile(data).subscribe({
            next: (response) => {
                this.user = response.user;

                this.profileData = {
                    firstName: response.user.firstName,
                    lastName: response.user.lastName,
                    email: response.user.email,
                    phone: response.user.phone || ''
                };

                this.showProfileSuccess(
                    'Your profile has been updated successfully.'
                );

                this.isSavingProfile = false;
            },
            error: (error) => {
                this.profileError =
                    error.error?.errors?.[0]?.msg ||
                    error.error?.message ||
                    'Unable to update your profile.';

                this.isSavingProfile = false;
            }
        });
    }

    // =========================
    // CHANGE PASSWORD
    // =========================

    changePassword(): void {
        this.passwordSuccess = '';
        this.passwordError = '';

        if (
            !this.passwordData.currentPassword ||
            !this.passwordData.newPassword ||
            !this.confirmPassword
        ) {
            this.passwordError =
                'Please complete all password fields.';
            return;
        }

        if (this.passwordData.newPassword.length < 6) {
            this.passwordError =
                'Your new password must contain at least 6 characters.';
            return;
        }

        if (
            this.passwordData.newPassword !==
            this.confirmPassword
        ) {
            this.passwordError =
                'Your new passwords do not match.';
            return;
        }

        if (
            this.passwordData.currentPassword ===
            this.passwordData.newPassword
        ) {
            this.passwordError =
                'Your new password must be different from your current password.';
            return;
        }

        this.isChangingPassword = true;

        this.authService.changePassword(
            this.passwordData
        ).subscribe({
            next: (response) => {
                this.showPasswordSuccess(response.message);

                this.passwordData = {
                    currentPassword: '',
                    newPassword: ''
                };

                this.confirmPassword = '';
                this.isChangingPassword = false;
            },
            error: (error) => {
                this.passwordError =
                    error.error?.errors?.[0]?.msg ||
                    error.error?.message ||
                    'Unable to change your password.';

                this.isChangingPassword = false;
            }
        });
    }

    // =========================
    // RESET PASSWORD FORM
    // =========================

    resetPasswordForm(): void {
        this.passwordData = {
            currentPassword: '',
            newPassword: ''
        };

        this.confirmPassword = '';

        this.passwordSuccess = '';
        this.passwordError = '';

        this.showCurrentPassword = false;
        this.showNewPassword = false;
        this.showConfirmPassword = false;
    }

    toggleCurrentPassword(): void {
        this.showCurrentPassword = !this.showCurrentPassword;
    }

    toggleNewPassword(): void {
        this.showNewPassword = !this.showNewPassword;
    }

    toggleConfirmPassword(): void {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    hasProfileChanges(): boolean {
        return (
            this.profileData.firstName !== this.user?.firstName ||
            this.profileData.lastName !== this.user?.lastName ||
            this.profileData.email !== this.user?.email ||
            this.profileData.phone !== this.user?.phone
        );
    }

}
