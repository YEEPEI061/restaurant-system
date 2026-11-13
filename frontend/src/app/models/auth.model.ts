import { UserRole } from '../services/user.service';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface GuestSignupData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
}

export interface AuthUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: UserRole;
    active?: boolean;
}

export interface AuthResponse {
    message: string;
    token: string;
    user: AuthUser;
}

export interface SignupResponse {
    message: string;
    user: AuthUser;
}

export interface CurrentUserResponse {
    user: AuthUser;
}