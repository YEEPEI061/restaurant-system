const { expect } = require('chai');
const sinon = require('sinon');

const Reservation = require('../../models/Reservation');

const {
    getReservations,
    getReservationById,
    getMyReservations,
    createReservation,
    updateReservation,
    deleteReservation,
    updateReservationStatus
} = require('../../controllers/reservationController');


describe('Reservation Controller', function () {

    afterEach(function () {
        sinon.restore();
    });


    /*
     * --------------------------------------------------
     * GET ALL RESERVATIONS
     * --------------------------------------------------
     */

    describe('getReservations', function () {

        it('should return all reservations successfully', async function () {

            const reservations = [
                {
                    reservationId: 'R-002',
                    guestName: 'John Tan',
                    status: 'Confirmed'
                },
                {
                    reservationId: 'R-001',
                    guestName: 'Sofia Chen',
                    status: 'Pending'
                }
            ];

            const sortStub = sinon.stub().resolves(reservations);

            sinon.stub(Reservation, 'find')
                .returns({
                    populate: sinon.stub().returns({
                        sort: sortStub
                    })
                });

            const req = {};

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await getReservations(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.count)
                .to.equal(2);

            expect(responseBody.reservations)
                .to.deep.equal(reservations);
        });

    });


    /*
     * --------------------------------------------------
     * GET RESERVATION BY ID
     * --------------------------------------------------
     */

    describe('getReservationById', function () {

        it('should allow an admin to view any reservation', async function () {

            const reservation = {
                reservationId: 'R-001',
                guest: 'guest123',
                guestName: 'Sofia Chen',
                status: 'Pending'
            };

            sinon.stub(Reservation, 'findOne')
                .returns({
                    populate: sinon.stub().resolves(reservation)
                });

            const req = {
                params: {
                    id: 'R-001'
                },

                user: {
                    role: 'admin',
                    userId: 'admin123'
                }
            };

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await getReservationById(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.reservation)
                .to.deep.equal(reservation);
        });


        it('should allow a guest to view their own reservation', async function () {

            const reservation = {
                reservationId: 'R-001',
                guest: {
                    _id: 'guest123'
                },
                guestName: 'Sofia Chen',
                status: 'Pending'
            };

            sinon.stub(Reservation, 'findOne')
                .returns({
                    populate: sinon.stub().resolves(reservation)
                });

            const req = {
                params: {
                    id: 'R-001'
                },

                user: {
                    role: 'guest',
                    userId: 'guest123'
                }
            };

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await getReservationById(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.reservation)
                .to.deep.equal(reservation);
        });


        it('should return 403 when a guest tries to view another guest reservation', async function () {

            const reservation = {
                reservationId: 'R-001',
                guest: {
                    _id: 'guest456'
                },
                guestName: 'John Tan',
                status: 'Pending'
            };

            sinon.stub(Reservation, 'findOne')
                .returns({
                    populate: sinon.stub().resolves(reservation)
                });

            const req = {
                params: {
                    id: 'R-001'
                },

                user: {
                    role: 'guest',
                    userId: 'guest123'
                }
            };

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await getReservationById(req, res);

            expect(statusCode).to.equal(403);

            expect(responseBody.message)
                .to.equal(
                    'You are not allowed to view this reservation'
                );
        });

    });


    /*
     * --------------------------------------------------
     * GET MY RESERVATIONS
     * --------------------------------------------------
     */

    describe('getMyReservations', function () {

        it('should return reservations belonging to the logged-in guest', async function () {

            const reservations = [
                {
                    reservationId: 'R-001',
                    guest: 'guest123',
                    status: 'Pending'
                },
                {
                    reservationId: 'R-002',
                    guest: 'guest123',
                    status: 'Confirmed'
                }
            ];

            sinon.stub(Reservation, 'find')
                .returns({
                    sort: sinon.stub().resolves(reservations)
                });

            const req = {
                user: {
                    userId: 'guest123'
                }
            };

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await getMyReservations(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.count)
                .to.equal(2);

            expect(responseBody.reservations)
                .to.deep.equal(reservations);
        });

    });


    /*
     * --------------------------------------------------
     * CREATE RESERVATION
     * --------------------------------------------------
     */

    describe('createReservation', function () {

        it('should create a reservation successfully', async function () {

            const latestReservation = {
                reservationId: 'R-009'
            };

            const createdReservation = {
                reservationId: 'R-010',
                guest: 'guest123',
                guestName: 'Sofia Chen',
                email: 'sofia@example.com',
                phone: '0123456789',
                date: '2026-11-01',
                time: '19:00',
                partySize: 2,
                servicePeriod: 'Dinner',
                seating: 'Indoor',
                diningOption: 'alacarte',
                selectedDishes: [],
                status: 'Pending'
            };

            sinon.stub(Reservation, 'findOne')
                .returns({
                    sort: sinon.stub().resolves(latestReservation)
                });

            sinon.stub(Reservation, 'create')
                .resolves(createdReservation);

            const req = {
                user: {
                    userId: 'guest123'
                },

                body: {
                    guestName: 'Sofia Chen',
                    email: 'sofia@example.com',
                    phone: '0123456789',
                    date: '2026-11-01',
                    time: '19:00',
                    partySize: 2,
                    servicePeriod: 'Dinner',
                    seating: 'Indoor',
                    diningOption: 'alacarte',
                    selectedDishes: []
                }
            };

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await createReservation(req, res);

            expect(statusCode).to.equal(201);

            expect(responseBody.message)
                .to.equal(
                    'Reservation created successfully'
                );

            expect(responseBody.reservation)
                .to.deep.equal(createdReservation);
        });


        it('should return 500 when creating a reservation fails', async function () {

            sinon.stub(Reservation, 'findOne')
                .returns({
                    sort: sinon.stub().rejects(
                        new Error('Database error')
                    )
                });

            const req = {
                user: {
                    userId: 'guest123'
                },

                body: {
                    guestName: 'Sofia Chen',
                    email: 'sofia@example.com'
                }
            };

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await createReservation(req, res);

            expect(statusCode).to.equal(500);

            expect(responseBody.message)
                .to.equal(
                    'Failed to create reservation'
                );
        });

    });


    /*
     * --------------------------------------------------
     * UPDATE RESERVATION
     * --------------------------------------------------
     */

    describe('updateReservation', function () {

        it('should update a reservation successfully', async function () {

            const reservation = {
                reservationId: 'R-001',
                guest: 'guest123',
                guestName: 'Old Name',
                partySize: 2,
                status: 'Pending',
                save: sinon.stub().resolves()
            };

            sinon.stub(Reservation, 'findOne')
                .resolves(reservation);

            const req = {
                params: {
                    id: 'R-001'
                },

                user: {
                    role: 'guest',
                    userId: 'guest123'
                },

                body: {
                    guestName: 'Updated Name',
                    partySize: 4
                }
            };

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await updateReservation(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.message)
                .to.equal(
                    'Reservation updated successfully'
                );

            expect(reservation.guestName)
                .to.equal('Updated Name');

            expect(reservation.partySize)
                .to.equal(4);

            expect(reservation.save.calledOnce)
                .to.equal(true);
        });


        it('should return 403 when a guest tries to modify another guest reservation', async function () {

            const reservation = {
                reservationId: 'R-001',
                guest: 'guest456',
                status: 'Pending'
            };

            sinon.stub(Reservation, 'findOne')
                .resolves(reservation);

            const req = {
                params: {
                    id: 'R-001'
                },

                user: {
                    role: 'guest',
                    userId: 'guest123'
                },

                body: {
                    guestName: 'Updated Name'
                }
            };

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await updateReservation(req, res);

            expect(statusCode).to.equal(403);

            expect(responseBody.message)
                .to.equal(
                    'You are not allowed to modify this reservation'
                );
        });


        it('should return 404 when updating a reservation that does not exist', async function () {

            sinon.stub(Reservation, 'findOne')
                .resolves(null);

            const req = {
                params: {
                    id: 'R-999'
                },

                user: {
                    role: 'admin',
                    userId: 'admin123'
                },

                body: {
                    guestName: 'Updated Name'
                }
            };

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await updateReservation(req, res);

            expect(statusCode).to.equal(404);

            expect(responseBody.message)
                .to.equal('Reservation not found');
        });

    });


    /*
     * --------------------------------------------------
     * DELETE RESERVATION
     * --------------------------------------------------
     */

    describe('deleteReservation', function () {

        it('should delete a reservation successfully', async function () {

            const reservation = {
                _id: 'reservation123',
                reservationId: 'R-001'
            };

            sinon.stub(Reservation, 'findOne')
                .resolves(reservation);

            const deleteOneStub = sinon.stub(Reservation, 'deleteOne')
                .resolves({
                    deletedCount: 1
                });

            const req = {
                params: {
                    id: 'R-001'
                }
            };

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await deleteReservation(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.message)
                .to.equal(
                    'Reservation deleted successfully'
                );

            expect(deleteOneStub.calledOnce)
                .to.equal(true);
        });

    });


    /*
     * --------------------------------------------------
     * UPDATE RESERVATION STATUS
     * --------------------------------------------------
     */

    describe('updateReservationStatus', function () {

        it('should return 400 when the reservation status is invalid', async function () {

            const req = {
                params: {
                    id: 'R-001'
                },

                body: {
                    status: 'InvalidStatus'
                },

                user: {
                    role: 'admin',
                    userId: 'admin123'
                }
            };

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await updateReservationStatus(req, res);

            expect(statusCode).to.equal(400);

            expect(responseBody.message)
                .to.equal('Invalid reservation status');
        });


        it('should allow an admin to update reservation status successfully', async function () {

            const reservation = {
                reservationId: 'R-001',
                guest: 'guest123',
                status: 'Pending',
                save: sinon.stub().resolves()
            };

            sinon.stub(Reservation, 'findOne')
                .resolves(reservation);

            const req = {
                params: {
                    id: 'R-001'
                },

                body: {
                    status: 'Confirmed'
                },

                user: {
                    role: 'admin',
                    userId: 'admin123'
                }
            };

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await updateReservationStatus(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.message)
                .to.equal(
                    'Reservation status updated successfully'
                );

            expect(reservation.status)
                .to.equal('Confirmed');

            expect(reservation.save.calledOnce)
                .to.equal(true);
        });


        it('should allow a guest to cancel their own pending reservation', async function () {

            const reservation = {
                reservationId: 'R-001',
                guest: 'guest123',
                status: 'Pending',
                save: sinon.stub().resolves()
            };

            sinon.stub(Reservation, 'findOne')
                .resolves(reservation);

            const req = {
                params: {
                    id: 'R-001'
                },

                body: {
                    status: 'Cancelled'
                },

                user: {
                    role: 'guest',
                    userId: 'guest123'
                }
            };

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await updateReservationStatus(req, res);

            expect(statusCode).to.equal(200);

            expect(reservation.status)
                .to.equal('Cancelled');

            expect(responseBody.message)
                .to.equal(
                    'Reservation status updated successfully'
                );

            expect(reservation.save.calledOnce)
                .to.equal(true);
        });


        it('should return 403 when a guest tries to update another guest reservation', async function () {

            const reservation = {
                reservationId: 'R-001',
                guest: 'guest456',
                status: 'Pending'
            };

            sinon.stub(Reservation, 'findOne')
                .resolves(reservation);

            const req = {
                params: {
                    id: 'R-001'
                },

                body: {
                    status: 'Cancelled'
                },

                user: {
                    role: 'guest',
                    userId: 'guest123'
                }
            };

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await updateReservationStatus(req, res);

            expect(statusCode).to.equal(403);

            expect(responseBody.message)
                .to.equal(
                    'You are not allowed to modify this reservation'
                );
        });


        it('should return 404 when updating the status of a reservation that does not exist', async function () {

            sinon.stub(Reservation, 'findOne')
                .resolves(null);

            const req = {
                params: {
                    id: 'R-999'
                },

                body: {
                    status: 'Confirmed'
                },

                user: {
                    role: 'admin',
                    userId: 'admin123'
                }
            };

            let statusCode;
            let responseBody;

            const res = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },

                json: function (body) {
                    responseBody = body;
                    return this;
                }
            };

            await updateReservationStatus(req, res);

            expect(statusCode).to.equal(404);

            expect(responseBody.message)
                .to.equal('Reservation not found');
        });

    });

});