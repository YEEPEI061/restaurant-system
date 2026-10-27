require('dotenv').config();

const request = require('supertest');
const { expect } = require('chai');
const bcrypt = require('bcryptjs');

const app = require('../../app');

const {
    connectDatabase,
    disconnectDatabase
} = require('../../config/db');

const Reservation = require('../../models/Reservation');
const User = require('../../models/User');


describe('Reservation Integration Tests', function () {

    before(async function () {
        await connectDatabase(
            process.env.MONGO_TEST_URI
        );

        await Reservation.deleteMany({});
        await User.deleteMany({});
    });

    afterEach(async function () {
        await Reservation.deleteMany({});
        await User.deleteMany({});
    });

    after(async function () {
        await disconnectDatabase();
    });

    it('should create a reservation as a guest', async function () {

        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Reservation',
                lastName: 'Guest',
                email: 'reservationguest@test.com',
                phone: '0123456789',
                password: 'Password123'
            });

        const loginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'reservationguest@test.com',
                password: 'Password123'
            });

        expect(loginResponse.status).to.equal(200);

        const token = loginResponse.body.token;

        expect(token).to.be.a('string');

        const response = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${token}`)
            .send({
                guestName: 'Reservation Guest',
                email: 'reservationguest@test.com',
                phone: '0123456789',
                date: '2026-11-15',
                time: '19:00',
                partySize: 2,
                servicePeriod: 'dinner',
                seating: 'Main Dining Room',
                diningOption: 'alacarte',
                tastingMenu: '',
                selectedDishes: [
                    {
                        id: 'M-001',
                        name: 'Truffle Mushroom Tart',
                        price: 28
                    }
                ],
                beveragePairing: false,
                packageName: '',
                table: '',
                specialRequests: 'Window seat if available.'
            });

        expect(response.status).to.equal(201);

        expect(response.body)
            .to.have.property(
                'message',
                'Reservation created successfully'
            );

        expect(response.body.reservation)
            .to.have.property('reservationId', 'R-001');

        expect(response.body.reservation.guestName)
            .to.equal('Reservation Guest');

        expect(response.body.reservation.email)
            .to.equal('reservationguest@test.com');

        expect(response.body.reservation.partySize)
            .to.equal(2);

        expect(response.body.reservation.status)
            .to.equal('Pending');

        const savedReservation =
            await Reservation.findOne({
                reservationId: 'R-001'
            });

        expect(savedReservation)
            .to.not.equal(null);

        expect(savedReservation.guestName)
            .to.equal('Reservation Guest');

        expect(savedReservation.diningOption)
            .to.equal('alacarte');

        expect(savedReservation.status)
            .to.equal('Pending');
    });

    it('should retrieve the guest reservations', async function () {

        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Reservation',
                lastName: 'Guest',
                email: 'myreservation@test.com',
                phone: '0123456789',
                password: 'Password123'
            });

        const loginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'myreservation@test.com',
                password: 'Password123'
            });

        expect(loginResponse.status).to.equal(200);

        const token = loginResponse.body.token;

        await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${token}`)
            .send({
                guestName: 'Reservation Guest',
                email: 'myreservation@test.com',
                phone: '0123456789',
                date: '2026-11-20',
                time: '19:00',
                partySize: 2,
                servicePeriod: 'dinner',
                seating: 'Main Dining Room',
                diningOption: 'alacarte',
                tastingMenu: '',
                selectedDishes: [],
                beveragePairing: false,
                packageName: '',
                table: '',
                specialRequests: ''
            });

        const response = await request(app)
            .get('/api/reservations/my')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).to.equal(200);

        expect(response.body)
            .to.have.property('count', 1);

        expect(response.body.reservations)
            .to.be.an('array')
            .with.lengthOf(1);

        expect(response.body.reservations[0])
            .to.have.property(
                'reservationId',
                'R-001'
            );

        expect(response.body.reservations[0].guestName)
            .to.equal('Reservation Guest');

        expect(response.body.reservations[0].email)
            .to.equal('myreservation@test.com');

        expect(response.body.reservations[0].status)
            .to.equal('Pending');
    });

    it('should retrieve the guest own reservation', async function () {

        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Reservation',
                lastName: 'Guest',
                email: 'viewreservation@test.com',
                phone: '0123456789',
                password: 'Password123'
            });

        const loginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'viewreservation@test.com',
                password: 'Password123'
            });

        expect(loginResponse.status).to.equal(200);

        const token = loginResponse.body.token;

        const createResponse = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${token}`)
            .send({
                guestName: 'Reservation Guest',
                email: 'viewreservation@test.com',
                phone: '0123456789',
                date: '2026-11-25',
                time: '19:30',
                partySize: 2,
                servicePeriod: 'dinner',
                seating: 'Main Dining Room',
                diningOption: 'alacarte',
                tastingMenu: '',
                selectedDishes: [],
                beveragePairing: false,
                packageName: '',
                table: '',
                specialRequests: ''
            });

        expect(createResponse.status).to.equal(201);

        const reservationId =
            createResponse.body.reservation.reservationId;

        const response = await request(app)
            .get(`/api/reservations/${reservationId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).to.equal(200);

        expect(response.body)
            .to.have.property('reservation');

        expect(response.body.reservation.reservationId)
            .to.equal(reservationId);

        expect(response.body.reservation.guestName)
            .to.equal('Reservation Guest');

        expect(response.body.reservation.email)
            .to.equal('viewreservation@test.com');

        expect(response.body.reservation.status)
            .to.equal('Pending');
    });

    it('should reject a guest viewing another guest reservation', async function () {

        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Owner',
                lastName: 'Guest',
                email: 'owner@test.com',
                phone: '0123456789',
                password: 'Password123'
            });

        const ownerLoginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'owner@test.com',
                password: 'Password123'
            });

        expect(ownerLoginResponse.status).to.equal(200);

        const ownerToken = ownerLoginResponse.body.token;

        const createResponse = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                guestName: 'Owner Guest',
                email: 'owner@test.com',
                phone: '0123456789',
                date: '2026-11-26',
                time: '20:00',
                partySize: 4,
                servicePeriod: 'dinner',
                seating: 'Garden Solarium',
                diningOption: 'tasting',
                tastingMenu: 'Aurelia Seasonal Tasting',
                selectedDishes: [],
                beveragePairing: true,
                packageName: '',
                table: '',
                specialRequests: ''
            });

        expect(createResponse.status).to.equal(201);

        const reservationId =
            createResponse.body.reservation.reservationId;

        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Other',
                lastName: 'Guest',
                email: 'other@test.com',
                phone: '0198765432',
                password: 'Password123'
            });

        const otherLoginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'other@test.com',
                password: 'Password123'
            });

        expect(otherLoginResponse.status).to.equal(200);

        const otherToken = otherLoginResponse.body.token;

        const response = await request(app)
            .get(`/api/reservations/${reservationId}`)
            .set('Authorization', `Bearer ${otherToken}`);

        expect(response.status).to.equal(403);

        expect(response.body)
            .to.have.property(
                'message',
                'You are not allowed to view this reservation'
            );
    });

    it('should retrieve all reservations as an admin', async function () {

        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Guest',
                lastName: 'One',
                email: 'guestone@test.com',
                phone: '0123456789',
                password: 'Password123'
            });

        const guestLoginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'guestone@test.com',
                password: 'Password123'
            });

        expect(guestLoginResponse.status).to.equal(200);

        const guestToken = guestLoginResponse.body.token;

        await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${guestToken}`)
            .send({
                guestName: 'Guest One',
                email: 'guestone@test.com',
                phone: '0123456789',
                date: '2026-12-01',
                time: '19:00',
                partySize: 2,
                servicePeriod: 'dinner',
                seating: 'Main Dining Room',
                diningOption: 'alacarte',
                tastingMenu: '',
                selectedDishes: [],
                beveragePairing: false,
                packageName: '',
                table: '',
                specialRequests: ''
            });

        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Guest',
                lastName: 'Two',
                email: 'guesttwo@test.com',
                phone: '0198765432',
                password: 'Password123'
            });

        const guestTwoLoginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'guesttwo@test.com',
                password: 'Password123'
            });

        expect(guestTwoLoginResponse.status).to.equal(200);

        const guestTwoToken = guestTwoLoginResponse.body.token;

        await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${guestTwoToken}`)
            .send({
                guestName: 'Guest Two',
                email: 'guesttwo@test.com',
                phone: '0198765432',
                date: '2026-12-02',
                time: '20:00',
                partySize: 4,
                servicePeriod: 'dinner',
                seating: 'Garden Solarium',
                diningOption: 'tasting',
                tastingMenu: 'Aurelia Seasonal Tasting',
                selectedDishes: [],
                beveragePairing: true,
                packageName: '',
                table: '',
                specialRequests: ''
            });

        const bcrypt = require('bcryptjs');

        const hashedPassword = await bcrypt.hash(
            'Admin123',
            10
        );

        await User.create({
            firstName: 'Reservation',
            lastName: 'Admin',
            email: 'reservationadmin@test.com',
            phone: '0112233445',
            password: hashedPassword,
            role: 'admin',
            active: true
        });

        const adminLoginResponse = await request(app)
            .post('/api/auth/admin/login')
            .send({
                email: 'reservationadmin@test.com',
                password: 'Admin123'
            });

        expect(adminLoginResponse.status).to.equal(200);

        const adminToken = adminLoginResponse.body.token;

        const response = await request(app)
            .get('/api/reservations')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).to.equal(200);

        expect(response.body)
            .to.have.property('count', 2);

        expect(response.body.reservations)
            .to.be.an('array')
            .with.lengthOf(2);

        expect(response.body.reservations[0])
            .to.have.property('reservationId');

        expect(response.body.reservations[0])
            .to.have.property('guest');

        expect(response.body.reservations[0])
            .to.have.property('guestName');
    });

    it('should reject a guest user', async function () {

        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Reservation',
                lastName: 'Guest',
                email: 'reservationguest@test.com',
                phone: '0123456789',
                password: 'Password123'
            });

        const loginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'reservationguest@test.com',
                password: 'Password123'
            });

        expect(loginResponse.status).to.equal(200);

        const token = loginResponse.body.token;

        const response = await request(app)
            .get('/api/reservations')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).to.equal(403);

        expect(response.body)
            .to.have.property(
                'message',
                'You do not have permission to access this resource'
            );
    });

    it('should update the guest own reservation', async function () {

        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Update',
                lastName: 'Guest',
                email: 'updateguest@test.com',
                phone: '0123456789',
                password: 'Password123'
            });

        const loginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'updateguest@test.com',
                password: 'Password123'
            });

        expect(loginResponse.status).to.equal(200);

        const token = loginResponse.body.token;

        const createResponse = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${token}`)
            .send({
                guestName: 'Update Guest',
                email: 'updateguest@test.com',
                phone: '0123456789',
                date: '2026-12-10',
                time: '19:00',
                partySize: 2,
                servicePeriod: 'dinner',
                seating: 'Main Dining Room',
                diningOption: 'alacarte',
                tastingMenu: '',
                selectedDishes: [],
                beveragePairing: false,
                packageName: '',
                table: '',
                specialRequests: ''
            });

        expect(createResponse.status).to.equal(201);

        const reservationId =
            createResponse.body.reservation.reservationId;

        const response = await request(app)
            .put(`/api/reservations/${reservationId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                date: '2026-12-11',
                time: '20:00',
                partySize: 4,
                specialRequests: 'Birthday celebration.'
            });

        expect(response.status).to.equal(200);

        expect(response.body)
            .to.have.property(
                'message',
                'Reservation updated successfully'
            );

        expect(response.body.reservation.date)
            .to.equal('2026-12-11');

        expect(response.body.reservation.time)
            .to.equal('20:00');

        expect(response.body.reservation.partySize)
            .to.equal(4);

        expect(response.body.reservation.specialRequests)
            .to.equal('Birthday celebration.');

        const updatedReservation =
            await Reservation.findOne({
                reservationId
            });

        expect(updatedReservation.date)
            .to.equal('2026-12-11');

        expect(updatedReservation.partySize)
            .to.equal(4);
    });

    it('should reject a guest updating another guest reservation', async function () {

        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Owner',
                lastName: 'Guest',
                email: 'updateowner@test.com',
                phone: '0123456789',
                password: 'Password123'
            });

        const ownerLoginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'updateowner@test.com',
                password: 'Password123'
            });

        expect(ownerLoginResponse.status).to.equal(200);

        const ownerToken = ownerLoginResponse.body.token;

        const createResponse = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                guestName: 'Owner Guest',
                email: 'updateowner@test.com',
                phone: '0123456789',
                date: '2026-12-15',
                time: '19:00',
                partySize: 2,
                servicePeriod: 'dinner',
                seating: 'Main Dining Room',
                diningOption: 'alacarte',
                tastingMenu: '',
                selectedDishes: [],
                beveragePairing: false,
                packageName: '',
                table: '',
                specialRequests: ''
            });

        expect(createResponse.status).to.equal(201);

        const reservationId =
            createResponse.body.reservation.reservationId;

        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Other',
                lastName: 'Guest',
                email: 'updateother@test.com',
                phone: '0198765432',
                password: 'Password123'
            });

        const otherLoginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'updateother@test.com',
                password: 'Password123'
            });

        expect(otherLoginResponse.status).to.equal(200);

        const otherToken = otherLoginResponse.body.token;

        const response = await request(app)
            .put(`/api/reservations/${reservationId}`)
            .set('Authorization', `Bearer ${otherToken}`)
            .send({
                date: '2026-12-20',
                partySize: 10
            });

        expect(response.status).to.equal(403);

        expect(response.body)
            .to.have.property(
                'message',
                'You are not allowed to modify this reservation'
            );

        const reservation =
            await Reservation.findOne({
                reservationId
            });

        expect(reservation.date)
            .to.equal('2026-12-15');

        expect(reservation.partySize)
            .to.equal(2);
    });

    it('should allow a guest to cancel their own reservation', async function () {

        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Cancel',
                lastName: 'Guest',
                email: 'cancelguest@test.com',
                phone: '0123456789',
                password: 'Password123'
            });

        const loginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'cancelguest@test.com',
                password: 'Password123'
            });

        expect(loginResponse.status).to.equal(200);

        const token = loginResponse.body.token;

        const createResponse = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${token}`)
            .send({
                guestName: 'Cancel Guest',
                email: 'cancelguest@test.com',
                phone: '0123456789',
                date: '2026-12-20',
                time: '19:00',
                partySize: 2,
                servicePeriod: 'dinner',
                seating: 'Main Dining Room',
                diningOption: 'alacarte',
                tastingMenu: '',
                selectedDishes: [],
                beveragePairing: false,
                packageName: '',
                table: '',
                specialRequests: ''
            });

        expect(createResponse.status).to.equal(201);

        const reservationId =
            createResponse.body.reservation.reservationId;

        const response = await request(app)
            .patch(`/api/reservations/${reservationId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                status: 'Cancelled'
            });

        expect(response.status).to.equal(200);

        expect(response.body)
            .to.have.property(
                'message',
                'Reservation status updated successfully'
            );

        expect(response.body.reservation.status)
            .to.equal('Cancelled');

        const reservation =
            await Reservation.findOne({
                reservationId
            });

        expect(reservation.status)
            .to.equal('Cancelled');
    });

    it('should allow an admin to update reservation status', async function () {

        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Status',
                lastName: 'Guest',
                email: 'statusguest@test.com',
                phone: '0123456789',
                password: 'Password123'
            });

        const guestLoginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'statusguest@test.com',
                password: 'Password123'
            });

        expect(guestLoginResponse.status).to.equal(200);

        const guestToken = guestLoginResponse.body.token;

        const createResponse = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${guestToken}`)
            .send({
                guestName: 'Status Guest',
                email: 'statusguest@test.com',
                phone: '0123456789',
                date: '2026-12-25',
                time: '20:00',
                partySize: 4,
                servicePeriod: 'dinner',
                seating: 'Garden Solarium',
                diningOption: 'alacarte',
                tastingMenu: '',
                selectedDishes: [],
                beveragePairing: false,
                packageName: '',
                table: '',
                specialRequests: ''
            });

        expect(createResponse.status).to.equal(201);

        const reservationId =
            createResponse.body.reservation.reservationId;

        const bcrypt = require('bcryptjs');

        const hashedPassword = await bcrypt.hash(
            'Admin123',
            10
        );

        await User.create({
            firstName: 'Status',
            lastName: 'Admin',
            email: 'statusadmin@test.com',
            phone: '0112233445',
            password: hashedPassword,
            role: 'admin',
            active: true
        });

        const adminLoginResponse = await request(app)
            .post('/api/auth/admin/login')
            .send({
                email: 'statusadmin@test.com',
                password: 'Admin123'
            });

        expect(adminLoginResponse.status).to.equal(200);

        const adminToken = adminLoginResponse.body.token;

        const response = await request(app)
            .patch(`/api/reservations/${reservationId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                status: 'Confirmed'
            });

        expect(response.status).to.equal(200);

        expect(response.body.reservation.status)
            .to.equal('Confirmed');

        const reservation =
            await Reservation.findOne({
                reservationId
            });

        expect(reservation.status)
            .to.equal('Confirmed');
    });

    it('should allow an admin to delete a reservation', async function () {

        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Delete',
                lastName: 'Guest',
                email: 'deleteguest@test.com',
                phone: '0123456789',
                password: 'Password123'
            });

        const guestLoginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'deleteguest@test.com',
                password: 'Password123'
            });

        expect(guestLoginResponse.status).to.equal(200);

        const guestToken = guestLoginResponse.body.token;

        const createResponse = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${guestToken}`)
            .send({
                guestName: 'Delete Guest',
                email: 'deleteguest@test.com',
                phone: '0123456789',
                date: '2026-12-28',
                time: '19:00',
                partySize: 2,
                servicePeriod: 'dinner',
                seating: 'Main Dining Room',
                diningOption: 'alacarte',
                tastingMenu: '',
                selectedDishes: [],
                beveragePairing: false,
                packageName: '',
                table: '',
                specialRequests: ''
            });

        expect(createResponse.status).to.equal(201);

        const reservationId =
            createResponse.body.reservation.reservationId;

        const bcrypt = require('bcryptjs');

        const hashedPassword = await bcrypt.hash(
            'Admin123',
            10
        );

        await User.create({
            firstName: 'Delete',
            lastName: 'Admin',
            email: 'deleteadmin@test.com',
            phone: '0112233445',
            password: hashedPassword,
            role: 'admin',
            active: true
        });

        const adminLoginResponse = await request(app)
            .post('/api/auth/admin/login')
            .send({
                email: 'deleteadmin@test.com',
                password: 'Admin123'
            });

        expect(adminLoginResponse.status).to.equal(200);

        const adminToken = adminLoginResponse.body.token;

        const response = await request(app)
            .delete(`/api/reservations/${reservationId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).to.equal(200);

        expect(response.body)
            .to.have.property(
                'message',
                'Reservation deleted successfully'
            );

        const deletedReservation =
            await Reservation.findOne({
                reservationId
            });

        expect(deletedReservation).to.equal(null);
    });

});