import { Routes } from '@angular/router';

import { GuestLoginComponent } from './pages/guest-login/guest-login.component';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MenuComponent } from './pages/menu/menu.component';
import { ReservationsComponent } from './pages/reservations/reservations.component';
import { MyReservationsComponent } from './pages/my-reservations/my-reservations.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { MenuManagementComponent } from './pages/menu-management/menu-management.component';
import { StaffManagementComponent } from './pages/staff-management/staff-management.component';
import { ReservationManagementComponent } from './pages/reservation-management/reservation-management.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'guest-login',
    pathMatch: 'full'
  },
  {
    path: 'guest-login',
    component: GuestLoginComponent
  },
  {
    path: 'admin-login',
    component: AdminLoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'menu',
    component: MenuComponent
  },
  {
    path: 'reservations',
    component: ReservationsComponent
  },
  {
    path: 'my-reservations',
    component: MyReservationsComponent
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent
  },
  {
    path: 'menu-management',
    component: MenuManagementComponent
  },
  {
    path: 'staff-management',
    component: StaffManagementComponent
  },
  {
    path: 'reservation-management',
    component: ReservationManagementComponent
  }
];