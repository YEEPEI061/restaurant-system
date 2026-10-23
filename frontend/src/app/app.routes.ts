import { Routes } from '@angular/router';

import { GuestLoginComponent } from './pages/guest-login/guest-login.component';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MenuComponent } from './pages/menu/menu.component';
import { ReservationsComponent } from './pages/reservations/reservations.component';
import { MyReservationsComponent } from './pages/my-reservations/my-reservations.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { MenuManagementComponent } from './pages/menu-management/menu-management.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { ReservationManagementComponent } from './pages/reservation-management/reservation-management.component';

import {
  guestGuard
} from './guards/guest.guard';

import {
  adminGuard
} from './guards/admin.guard';


export const routes: Routes = [

  // =========================
  // DEFAULT
  // =========================

  {
    path: '',
    redirectTo: 'menu',
    pathMatch: 'full'
  },


  // =========================
  // PUBLIC ROUTES
  // =========================

  {
    path: 'menu',
    component: MenuComponent
  },

  {
    path: 'guest-login',
    component: GuestLoginComponent
  },

  {
    path: 'register',
    component: RegisterComponent
  },

  {
    path: 'admin-login',
    component: AdminLoginComponent
  },


  // =========================
  // GUEST ROUTES
  // =========================

  {
    path: 'reservations',
    component: ReservationsComponent,
    canActivate: [guestGuard]
  },

  {
    path: 'my-reservations',
    component: MyReservationsComponent,
    canActivate: [guestGuard]
  },


  // =========================
  // ADMIN ROUTES
  // =========================

  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [adminGuard]
  },

  {
    path: 'menu-management',
    component: MenuManagementComponent,
    canActivate: [adminGuard]
  },

  {
    path: 'user-management',
    component: UserManagementComponent,
    canActivate: [adminGuard]
  },

  {
    path: 'reservation-management',
    component: ReservationManagementComponent,
    canActivate: [adminGuard]
  },


  // =========================
  // UNKNOWN ROUTE
  // =========================

  {
    path: '**',
    redirectTo: 'menu'
  }

];