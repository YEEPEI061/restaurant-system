import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { UserManagementComponent } from './user-management.component';
import {
    UserService,
    User,
    UsersResponse
} from '../../services/user.service';
import { WebSocketService } from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';

describe('UserManagementComponent', () => {

    let component: UserManagementComponent;
    let fixture: ComponentFixture<UserManagementComponent>;

    let userService: jasmine.SpyObj<UserService>;
    let webSocketService: jasmine.SpyObj<WebSocketService>;
    let authService: jasmine.SpyObj<AuthService>;

    const mockUsers: User[] = [
        {
            _id: 'U001',
            firstName: 'Alex',
            lastName: 'Tan',
            email: 'alex@example.com',
            phone: '0123456789',
            role: 'guest',
            active: true
        },
        {
            _id: 'U002',
            firstName: 'Sarah',
            lastName: 'Lee',
            email: 'sarah@example.com',
            phone: '0123456788',
            role: 'admin',
            active: true
        },
        {
            _id: 'U003',
            firstName: 'David',
            lastName: 'Lim',
            email: 'david@example.com',
            phone: '0123456787',
            role: 'guest',
            active: false
        },
        {
            _id: 'U004',
            firstName: 'Emily',
            lastName: 'Wong',
            email: 'emily@example.com',
            phone: '0123456786',
            role: 'guest',
            active: true
        }
    ];

    beforeEach(async () => {

        userService = jasmine.createSpyObj(
            'UserService',
            [
                'getUsers',
                'createUser',
                'updateUser',
                'updateUserStatus',
                'deleteUser'
            ]
        );

        webSocketService = jasmine.createSpyObj(
            'WebSocketService',
            ['connect'],
            {
                messages$: new Subject<unknown>()
            }
        );

        authService = jasmine.createSpyObj(
            'AuthService',
            ['getUser', 'isLoggedIn']
        );

        authService.getUser.and.returnValue(null);
        authService.isLoggedIn.and.returnValue(false);

        const mockUsersResponse: UsersResponse = {
            count: mockUsers.length,
            users: mockUsers.map(user => ({ ...user }))
        };

        userService.getUsers.and.returnValue(
            of(mockUsersResponse)
        );

        const createdUser: User = {
            _id: 'U005',
            firstName: 'Michael',
            lastName: 'Chen',
            email: 'michael@example.com',
            phone: '0123456785',
            role: 'guest',
            active: true
        };

        userService.createUser.and.returnValue(
            of({
                message: 'User created successfully',
                user: createdUser
            })
        );

        userService.deleteUser.and.returnValue(
            of({
                message: 'User deleted successfully'
            })
        );

        await TestBed.configureTestingModule({

            imports: [
                UserManagementComponent
            ],

            providers: [
                {
                    provide: UserService,
                    useValue: userService
                },
                {
                    provide: WebSocketService,
                    useValue: webSocketService
                },
                {
                    provide: AuthService,
                    useValue: authService
                },
                provideHttpClient(),
                provideRouter([])
            ]

        }).compileComponents();

        fixture = TestBed.createComponent(
            UserManagementComponent
        );

        component = fixture.componentInstance;

        fixture.detectChanges();

    });


    it('should load users and connect to WebSocket on initialisation', () => {

        expect(component).toBeTruthy();
        expect(userService.getUsers).toHaveBeenCalled();
        expect(webSocketService.connect).toHaveBeenCalled();
        expect(component.users.length).toBe(4);
        expect(component.isLoading).toBeFalse();

    });



    it('should filter and sort users correctly', () => {

        component.roleFilter = 'guest';

        expect(component.filteredUsers.length).toBe(3);

        component.roleFilter = 'all';
        component.statusFilter = 'active';

        expect(component.filteredUsers.length).toBe(3);

        component.statusFilter = 'all';
        component.searchQuery = 'sarah';

        expect(component.filteredUsers.length).toBe(1);
        expect(component.filteredUsers[0].name).toBe('Sarah Lee');

        component.searchQuery = '';
        component.sortOption = 'name-descending';

        expect(component.filteredUsers[0].name).toBe('Sarah Lee');

    });


    it('should calculate user summary counts correctly', () => {

        expect(component.totalUsers).toBe(4);
        expect(component.guestCount).toBe(3);
        expect(component.adminCount).toBe(1);
        expect(component.activeCount).toBe(3);
        expect(component.deactivatedCount).toBe(1);

    });


    it('should create a new user account successfully', () => {

        component.openCreateDrawer();

        component.form.firstName = 'Michael';
        component.form.lastName = 'Chen';
        component.form.email = 'michael@example.com';
        component.form.phone = '0123456785';
        component.form.password = 'password123';
        component.form.role = 'guest';
        component.form.active = true;

        component.saveUser();

        expect(userService.createUser).toHaveBeenCalledWith(
            jasmine.objectContaining({
                firstName: 'Michael',
                lastName: 'Chen',
                email: 'michael@example.com',
                phone: '0123456785',
                role: 'guest',
                active: true
            })
        );

        expect(component.users.length).toBe(5);
        expect(component.users[0].name).toBe('Michael Chen');
        expect(component.drawerOpen).toBeFalse();
        expect(component.successTitle).toBe('Account Created');

    });


    it('should delete a user after confirmation', () => {

        const member = component.users[0];

        component.deleteUser(member);

        expect(component.deleteConfirmOpen).toBeTrue();
        expect(userService.deleteUser).not.toHaveBeenCalled();

        component.confirmDelete();

        expect(userService.deleteUser).toHaveBeenCalledWith('U001');
        expect(component.users.length).toBe(3);
        expect(component.users.some(user => user.id === 'U001')).toBeFalse();
        expect(component.deleteConfirmOpen).toBeFalse();
        expect(component.successTitle).toBe('User Deleted');

    });

});
