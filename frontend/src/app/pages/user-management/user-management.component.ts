import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

import {
  UserService,
  User as ApiUser,
  UserRole
} from '../../services/user.service';

type RoleFilter = 'all' | UserRole;
type StatusFilter = 'all' | 'active' | 'deactivated';

interface UserMember {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  password?: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent {

  searchQuery = '';

  roleFilter: RoleFilter = 'all';
  statusFilter: StatusFilter = 'all';

  drawerOpen = false;
  isCreating = false;

  isLoading = false;

  // =========================
  // SUCCESS MESSAGE
  // =========================

  successMessage = '';
  successTitle = '';

  private successTimeout?:
    ReturnType<typeof setTimeout>;

  // =========================
  // ERROR MESSAGE
  // =========================

  errorMessage = '';
  errorTitle = '';

  private errorTimeout?:
    ReturnType<typeof setTimeout>;

  // =========================
  // DELETE CONFIRMATION
  // =========================

  deleteConfirmOpen = false;

  userToDelete:
    UserMember | null = null;

  // =========================
  // FORM
  // =========================

  form: UserMember =
    this.createEmptyUser();

  users: UserMember[] = [];

  constructor(
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  // =========================
  // LOAD USERS
  // =========================

  loadUsers(): void {

    this.isLoading = true;

    this.userService
      .getUsers()
      .subscribe({

        next: (response) => {

          this.users =
            response.users.map(user =>
              this.mapApiUser(user)
            );

          this.isLoading = false;
        },

        error: (error) => {

          console.error(
            'Failed to load users:',
            error
          );

          this.isLoading = false;

          this.showError(
            'Unable to Load Users',
            error?.error?.message ||
            'Failed to load the user directory.'
          );
        }

      });
  }

  // =========================
  // API → FRONTEND MAPPING
  // =========================

  private mapApiUser(
    user: ApiUser
  ): UserMember {

    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      name:
        `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      active: user.active
    };
  }

  // =========================
  // EMPTY USER
  // =========================

  private createEmptyUser():
    UserMember {

    return {
      id: '',
      firstName: '',
      lastName: '',
      name: '',
      email: '',
      phone: '',
      role: 'admin',
      active: true,
      password: ''
    };
  }

  // =========================
  // FILTERING
  // =========================

  get filteredUsers():
    UserMember[] {

    const query =
      this.searchQuery
        .trim()
        .toLowerCase();

    return this.users.filter(user => {

      const matchesSearch =
        !query ||
        user.name
          .toLowerCase()
          .includes(query) ||
        user.email
          .toLowerCase()
          .includes(query) ||
        user.phone
          .toLowerCase()
          .includes(query) ||
        user.id
          .toLowerCase()
          .includes(query) ||
        this.roleLabel(user.role)
          .toLowerCase()
          .includes(query);

      const matchesRole =
        this.roleFilter === 'all' ||
        user.role === this.roleFilter;

      const matchesStatus =
        this.statusFilter === 'all' ||
        (
          this.statusFilter ===
            'active' &&
          user.active
        ) ||
        (
          this.statusFilter ===
            'deactivated' &&
          !user.active
        );

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }

  // =========================
  // COUNTS
  // =========================

  get totalUsers(): number {
    return this.users.length;
  }

  get guestCount(): number {

    return this.users.filter(
      user => user.role === 'guest'
    ).length;
  }

  get adminCount(): number {

    return this.users.filter(
      user => user.role === 'admin'
    ).length;
  }

  get activeCount(): number {

    return this.users.filter(
      user => user.active
    ).length;
  }

  get deactivatedCount(): number {

    return this.users.filter(
      user => !user.active
    ).length;
  }

  get roleBreakdown():
    { label: string; count: number }[] {

    return [
      {
        label: 'Guests',
        count: this.guestCount
      },
      {
        label: 'Admins',
        count: this.adminCount
      }
    ];
  }

  // =========================
  // ROLE LABEL
  // =========================

  roleLabel(
    role: UserRole
  ): string {

    return role === 'admin'
      ? 'Admin'
      : 'Guest';
  }

  // =========================
  // OPEN USER
  // =========================

  openUser(
    member: UserMember
  ): void {

    this.isCreating = false;

    this.form = {
      ...member,
      password: ''
    };

    this.drawerOpen = true;
  }

  // =========================
  // CREATE USER DRAWER
  // =========================

  openCreateDrawer(): void {

    this.isCreating = true;

    this.form =
      this.createEmptyUser();

    this.drawerOpen = true;
  }

  // =========================
  // CLOSE DRAWER
  // =========================

  closeDrawer(): void {
    this.drawerOpen = false;
  }

  // =========================
  // SAVE USER
  // =========================

  saveUser(): void {

    const firstName =
      this.form.firstName.trim();

    const lastName =
      this.form.lastName.trim();

    const email =
      this.form.email.trim();

    // =========================
    // BASIC VALIDATION
    // =========================

    if (
      !firstName ||
      !lastName ||
      !email
    ) {
      return;
    }

    // =========================
    // CREATE USER
    // =========================

    if (this.isCreating) {

      const password =
        this.form.password?.trim();

        if (!password) {
          return;
        }

      if (password.length < 6) {
        return;
      }

      const createData = {
        firstName,
        lastName,
        email,
        password,
        phone:
          this.form.phone.trim(),
        role:
          this.form.role,
        active:
          this.form.active
      };

      this.userService
        .createUser(createData)
        .subscribe({

          next: (response) => {

            this.users.unshift(
              this.mapApiUser(
                response.user
              )
            );

            // Close form automatically
            this.closeDrawer();

            // Show centered success
            this.showSuccess(
              'Account Created',
              'The new user account has been created successfully.'
            );
          },

          error: (error) => {

            console.error(
              'Failed to create user:',
              error
            );

            this.showError(
              'Unable to Create Account',
              error?.error?.message ||
              'Failed to create the user account.'
            );
          }

        });

      return;
    }

    // =========================
    // UPDATE USER
    // =========================

    const updateData: any = {
      firstName,
      lastName,
      email,
      phone:
        this.form.phone.trim(),
      role:
        this.form.role,
      active:
        this.form.active
    };

    if (
      this.form.password?.trim()
    ) {

      const password =
        this.form.password.trim();

      if (password.length < 6) {

        this.showError(
          'Invalid Password',
          'Password must contain at least 6 characters.'
        );

        return;
      }

      updateData.password =
        password;
    }

    this.userService
      .updateUser(
        this.form.id,
        updateData
      )
      .subscribe({

        next: (response) => {

          const updatedUser =
            this.mapApiUser(
              response.user
            );

          const index =
            this.users.findIndex(
              user =>
                user.id ===
                updatedUser.id
            );

          if (index !== -1) {
            this.users[index] =
              updatedUser;
          }

          // Close form automatically
          this.closeDrawer();

          // Show centered success
          this.showSuccess(
            'Changes Saved',
            'The user account has been updated successfully.'
          );
        },

        error: (error) => {

          console.error(
            'Failed to update user:',
            error
          );

          this.showError(
            'Unable to Save Changes',
            error?.error?.message ||
            'Failed to update the user account.'
          );
        }

      });
  }

  // =========================
  // TOGGLE STATUS IN DRAWER
  // =========================

  toggleStatus(): void {

    this.form.active =
      !this.form.active;
  }

  // =========================
  // REACTIVATE USER
  // =========================

  reactivateUser(
    member: UserMember,
    event: Event
  ): void {

    event.stopPropagation();

    this.userService
      .updateUserStatus(
        member.id,
        true
      )
      .subscribe({

        next: (response) => {

          const updatedUser =
            this.mapApiUser(
              response.user
            );

          this.users =
            this.users.map(user =>
              user.id ===
              updatedUser.id
                ? updatedUser
                : user
            );

          this.showSuccess(
            'Account Reactivated',
            `${member.name}'s account has been reactivated successfully.`
          );
        },

        error: (error) => {

          console.error(
            'Failed to reactivate user:',
            error
          );

          this.showError(
            'Unable to Reactivate Account',
            error?.error?.message ||
            'Failed to reactivate the user account.'
          );
        }

      });
  }

  // =========================
  // OPEN DELETE CONFIRMATION
  // =========================

  deleteUser(
    member: UserMember,
    event?: Event
  ): void {

    event?.stopPropagation();

    this.userToDelete =
      member;

    this.deleteConfirmOpen =
      true;
  }

  // =========================
  // CANCEL DELETE
  // =========================

  cancelDelete(): void {

    this.deleteConfirmOpen =
      false;

    this.userToDelete =
      null;
  }

  // =========================
  // CONFIRM DELETE
  // =========================

  confirmDelete(): void {

    if (!this.userToDelete) {
      return;
    }

    const member =
      this.userToDelete;

    this.userService
      .deleteUser(member.id)
      .subscribe({

        next: () => {

          this.users =
            this.users.filter(
              user =>
                user.id !== member.id
            );

          // Close delete confirmation
          this.deleteConfirmOpen =
            false;

          this.userToDelete =
            null;

          // Close drawer if deletion
          // was triggered while editing
          this.drawerOpen =
            false;

          this.showSuccess(
            'User Deleted',
            `${member.name}'s account has been deleted successfully.`
          );
        },

        error: (error) => {

          console.error(
            'Failed to delete user:',
            error
          );

          // Close confirmation
          this.deleteConfirmOpen =
            false;

          this.userToDelete =
            null;

          this.showError(
            'Unable to Delete User',
            error?.error?.message ||
            'Failed to delete the user account.'
          );
        }

      });
  }

  // =========================
  // RESET FILTERS
  // =========================

  resetFilters(): void {

    this.searchQuery = '';
    this.roleFilter = 'all';
    this.statusFilter = 'all';
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
    }

    this.successTitle =
      title;

    this.successMessage =
      message;

    this.successTimeout =
      setTimeout(() => {

        this.successMessage =
          '';

        this.successTitle =
          '';

      }, 1400);
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
}