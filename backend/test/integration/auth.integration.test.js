require('dotenv').config();

const request = require('supertest');
const { expect } = require('chai');
const bcrypt = require('bcryptjs');

const app = require('../../app');

const {
    connectDatabase,
    disconnectDatabase
} = require('../../config/db');

const User = require('../../models/User');

describe('Authentication Integration Tests', function () {

    before(async function () {
        await connectDatabase(
            process.env.MONGO_TEST_URI
        );

        // Start with a clean test database
        await User.deleteMany({});
    });

    afterEach(async function () {
        // Prevent one test from affecting another
        await User.deleteMany({});
    });

    after(async function () {
        await disconnectDatabase();
    });


    it('should register a guest and save the user in MongoDB', async function () {

        const response = await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Integration',
                lastName: 'Guest',
                email: 'integrationguest@test.com',
                password: 'Password123',
                phone: '0123456789'
            });

        expect(response.status).to.equal(201);

        expect(response.body).to.have.property(
            'message',
            'Guest account created successfully'
        );

        expect(response.body).to.have.property('user');

        expect(response.body.user.email).to.equal(
            'integrationguest@test.com'
        );

        expect(response.body.user.role).to.equal(
            'guest'
        );

        expect(response.body.user).to.not.have.property(
            'password'
        );

        // Verify that the user was really stored in MongoDB
        const savedUser = await User.findOne({
            email: 'integrationguest@test.com'
        });

        expect(savedUser).to.not.equal(null);

        expect(savedUser.firstName).to.equal(
            'Integration'
        );

        expect(savedUser.lastName).to.equal(
            'Guest'
        );

        expect(savedUser.role).to.equal(
            'guest'
        );
    });


    it('should return 409 when registering an existing email', async function () {

        // Create the existing user in the real test database
        await User.create({
            firstName: 'Existing',
            lastName: 'Guest',
            email: 'existing@test.com',
            password: 'hashedpassword',
            phone: '0123456789',
            role: 'guest',
            active: true
        });

        const response = await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Another',
                lastName: 'Guest',
                email: 'existing@test.com',
                password: 'Password123',
                phone: '0198765432'
            });

        expect(response.status).to.equal(409);

        expect(response.body).to.have.property(
            'message',
            'An account with this email already exists'
        );

        // Make sure another account was not created
        const users = await User.find({
            email: 'existing@test.com'
        });

        expect(users).to.have.lengthOf(1);
    });


    it('should login a registered guest and return a JWT', async function () {

        // First register a real guest through the API
        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Login',
                lastName: 'Guest',
                email: 'loginguest@test.com',
                password: 'Password123',
                phone: '0123456789'
            });

        // Then login using the registered account
        const response = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'loginguest@test.com',
                password: 'Password123'
            });

        expect(response.status).to.equal(200);

        expect(response.body).to.have.property('token');

        expect(response.body.token).to.be.a('string');

        expect(response.body.token.length).to.be.greaterThan(0);

        expect(response.body).to.have.property('user');

        expect(response.body.user.email).to.equal(
            'loginguest@test.com'
        );

        expect(response.body.user.role).to.equal(
            'guest'
        );

        expect(response.body.user).to.not.have.property(
            'password'
        );
    });


    it('should return the authenticated guest when a valid JWT is provided', async function () {

        // Register a real guest
        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Authenticated',
                lastName: 'Guest',
                email: 'authenticated@test.com',
                password: 'Password123',
                phone: '0123456789'
            });

        // Login and obtain the real JWT
        const loginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'authenticated@test.com',
                password: 'Password123'
            });

        const token = loginResponse.body.token;

        expect(token).to.be.a('string');

        // Access the protected endpoint using the JWT
        const response = await request(app)
            .get('/api/auth/me')
            .set(
                'Authorization',
                `Bearer ${token}`
            );

        expect(response.status).to.equal(200);

        expect(response.body).to.have.property('user');

        expect(response.body.user.email).to.equal(
            'authenticated@test.com'
        );

        expect(response.body.user.firstName).to.equal(
            'Authenticated'
        );

        expect(response.body.user.role).to.equal(
            'guest'
        );

        expect(response.body.user).to.not.have.property(
            'password'
        );
    });


    it('should reject access to /me without a JWT', async function () {

        const response = await request(app)
            .get('/api/auth/me');

        expect(response.status).to.equal(401);

        expect(response.body).to.have.property(
            'message',
            'Authentication token is required'
        );
    });


    it('should login an admin and return a JWT', async function () {

        const hashedPassword = await bcrypt.hash(
            'Admin123',
            12
        );

        // Create a real admin in the test database
        await User.create({
            firstName: 'Test',
            lastName: 'Admin',
            email: 'admin@test.com',
            password: hashedPassword,
            phone: '0123456789',
            role: 'admin',
            active: true
        });

        // Login through the real API
        const response = await request(app)
            .post('/api/auth/admin/login')
            .send({
                email: 'admin@test.com',
                password: 'Admin123'
            });

        expect(response.status).to.equal(200);

        expect(response.body).to.have.property('token');

        expect(response.body.token).to.be.a('string');

        expect(response.body.token.length).to.be.greaterThan(0);

        expect(response.body).to.have.property('user');

        expect(response.body.user.email).to.equal(
            'admin@test.com'
        );

        expect(response.body.user.role).to.equal(
            'admin'
        );

        expect(response.body.user).to.not.have.property(
            'password'
        );
    });

});