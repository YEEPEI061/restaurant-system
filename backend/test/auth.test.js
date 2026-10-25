const { expect } = require('chai');
const sinon = require('sinon');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const {
    guestSignup,
    guestLogin,
    adminLogin,
    getCurrentUser
} = require('../controllers/authController');

describe('Authentication Controller', function () {

    before(function () {
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_EXPIRES_IN = '1h';
    });


    afterEach(function () {
        sinon.restore();
    });


    /*
     * --------------------------------------------------
     * GUEST SIGNUP
     * --------------------------------------------------
     */

    describe('guestSignup', function () {

        it('should return 409 when the email is already registered', async function () {

            sinon.stub(User, 'findOne').resolves({
                email: 'existing@example.com'
            });

            const req = {
                body: {
                    firstName: 'John',
                    lastName: 'Tan',
                    email: 'existing@example.com',
                    password: 'Password123!',
                    phone: '0123456789'
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

            await guestSignup(req, res);

            expect(statusCode).to.equal(409);

            expect(responseBody.message)
                .to.equal(
                    'An account with this email already exists'
                );
        });


        it('should create a guest account successfully', async function () {

            sinon.stub(User, 'findOne').resolves(null);

            sinon.stub(bcrypt, 'hash')
                .resolves('hashed-password');

            sinon.stub(User, 'create').resolves({
                _id: 'guest456',
                firstName: 'John',
                lastName: 'Tan',
                email: 'john@example.com',
                password: 'hashed-password',
                phone: '0123456789',
                role: 'guest'
            });

            const req = {
                body: {
                    firstName: 'John',
                    lastName: 'Tan',
                    email: 'john@example.com',
                    password: 'Password123!',
                    phone: '0123456789'
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

            await guestSignup(req, res);

            expect(statusCode).to.equal(201);

            expect(responseBody.message)
                .to.equal(
                    'Guest account created successfully'
                );

            expect(responseBody.user.email)
                .to.equal('john@example.com');

            expect(responseBody.user.role)
                .to.equal('guest');

            expect(responseBody.user)
                .to.not.have.property('password');
        });

    });


    /*
     * --------------------------------------------------
     * GUEST LOGIN
     * --------------------------------------------------
     */

    describe('guestLogin', function () {

        it('should return 401 when the guest account does not exist', async function () {

            sinon.stub(User, 'findOne').resolves(null);

            const req = {
                body: {
                    email: 'unknown@example.com',
                    password: 'Password123!'
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

            await guestLogin(req, res);

            expect(statusCode).to.equal(401);

            expect(responseBody.message)
                .to.equal('Invalid email or password');
        });


        it('should return 403 when the guest account is deactivated', async function () {

            sinon.stub(User, 'findOne').resolves({
                _id: 'guest123',
                email: 'guest@example.com',
                role: 'guest',
                active: false
            });

            const req = {
                body: {
                    email: 'guest@example.com',
                    password: 'Password123!'
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

            await guestLogin(req, res);

            expect(statusCode).to.equal(403);

            expect(responseBody.message)
                .to.equal(
                    'Your account has been deactivated'
                );
        });


        it('should return 401 when the password is incorrect', async function () {

            sinon.stub(User, 'findOne').resolves({
                _id: 'guest123',
                email: 'guest@example.com',
                password: 'hashed-password',
                role: 'guest',
                active: true
            });

            sinon.stub(bcrypt, 'compare').resolves(false);

            const req = {
                body: {
                    email: 'guest@example.com',
                    password: 'WrongPassword!'
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

            await guestLogin(req, res);

            expect(statusCode).to.equal(401);

            expect(responseBody.message)
                .to.equal('Invalid email or password');
        });


        it('should return a JWT when the guest login is successful', async function () {

            sinon.stub(User, 'findOne').resolves({
                _id: 'guest123',
                firstName: 'Sofia',
                lastName: 'Chen',
                email: 'guest@example.com',
                password: 'hashed-password',
                phone: '0123456789',
                role: 'guest',
                active: true
            });

            sinon.stub(bcrypt, 'compare').resolves(true);

            const req = {
                body: {
                    email: 'guest@example.com',
                    password: 'Password123!'
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

            await guestLogin(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.message)
                .to.equal('Guest login successful');

            expect(responseBody.token)
                .to.be.a('string');

            expect(responseBody.user.email)
                .to.equal('guest@example.com');

            expect(responseBody.user.role)
                .to.equal('guest');

            expect(responseBody.user)
                .to.not.have.property('password');

            const decoded = jwt.verify(
                responseBody.token,
                process.env.JWT_SECRET
            );

            expect(decoded.userId)
                .to.equal('guest123');

            expect(decoded.role)
                .to.equal('guest');
        });

    });


    /*
     * --------------------------------------------------
     * ADMIN LOGIN
     * --------------------------------------------------
     */

    describe('adminLogin', function () {

        it('should return 401 when the admin account does not exist', async function () {

            sinon.stub(User, 'findOne').resolves(null);

            const req = {
                body: {
                    email: 'unknown@aurelia.com',
                    password: 'Password123!'
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

            await adminLogin(req, res);

            expect(statusCode).to.equal(401);

            expect(responseBody.message)
                .to.equal('Invalid email or password');
        });


        it('should return a JWT when admin login is successful', async function () {

            sinon.stub(User, 'findOne').resolves({
                _id: 'admin123',
                firstName: 'Aurelia',
                lastName: 'Admin',
                email: 'admin@aurelia.com',
                password: 'hashed-password',
                phone: '0123456789',
                role: 'admin',
                active: true
            });

            sinon.stub(bcrypt, 'compare').resolves(true);

            const req = {
                body: {
                    email: 'admin@aurelia.com',
                    password: 'Admin123!'
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

            await adminLogin(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.message)
                .to.equal('Admin login successful');

            expect(responseBody.token)
                .to.be.a('string');

            expect(responseBody.user.role)
                .to.equal('admin');

            expect(responseBody.user)
                .to.not.have.property('password');
        });

    });

    /*
 * --------------------------------------------------
 * GET CURRENT USER
 * --------------------------------------------------
 */

    describe('getCurrentUser', function () {

        it('should return 404 when the user does not exist', async function () {

            sinon.stub(User, 'findById').returns({
                select: sinon.stub().resolves(null)
            });

            const req = {
                user: {
                    userId: 'unknown123'
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

            await getCurrentUser(req, res);

            expect(statusCode).to.equal(404);

            expect(responseBody.message)
                .to.equal('User not found');
        });


        it('should return the current user successfully', async function () {

            const user = {
                _id: 'guest123',
                firstName: 'Sofia',
                lastName: 'Chen',
                email: 'sofia@example.com',
                phone: '0123456789',
                role: 'guest',
                active: true
            };

            sinon.stub(User, 'findById').returns({
                select: sinon.stub().resolves(user)
            });

            const req = {
                user: {
                    userId: 'guest123',
                    role: 'guest'
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

            await getCurrentUser(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.user.id)
                .to.equal('guest123');

            expect(responseBody.user.firstName)
                .to.equal('Sofia');

            expect(responseBody.user.lastName)
                .to.equal('Chen');

            expect(responseBody.user.email)
                .to.equal('sofia@example.com');

            expect(responseBody.user.phone)
                .to.equal('0123456789');

            expect(responseBody.user.role)
                .to.equal('guest');

            expect(responseBody.user.active)
                .to.equal(true);
        });

    });

});