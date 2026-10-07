import { Routes } from '@angular/router';

import { GuestLoginComponent } from './pages/guest-login/guest-login.component';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MenuComponent } from './pages/menu/menu.component';

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
];