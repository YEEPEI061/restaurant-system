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

describe('User Management Integration Tests', function () {

    let adminToken;
    let guestToken;

    let adminUser;
    let guestUser;


    /*
     * --------------------------------------------------
     * DATABASE SETUP
     * --------------------------------------------------
     */

    before(async function () {

        await connectDatabase(
            process.env.MONGO_TEST_URI
        );

        await User.deleteMany({});

    });


    /*
     * --------------------------------------------------
     * TEST DATA
     * --------------------------------------------------
     */

    beforeEach(async function () {

        await User.deleteMany({});


        /*
         * Create admin
         */

        const adminPassword =
            await bcrypt.hash(
                'Admin123!',
                12
            );

        adminUser =
            await User.create({

                firstName: 'Test',

                lastName: 'Admin',

                email: 'admin@test.com',

                password: adminPassword,

                phone: '0123456789',

                role: 'admin',

                active: true

            });


        /*
         * Create guest
         */

        const guestPassword =
            await bcrypt.hash(
                'Guest123!',
                12
            );

        guestUser =
            await User.create({

                firstName: 'Test',

                lastName: 'Guest',

                email: 'guest@test.com',

                password: guestPassword,

                phone: '0111111111',

                role: 'guest',

                active: true

            });


        /*
         * Login admin
         */

        const adminLogin =
            await request(app)
                .post('/api/auth/admin/login')
                .send({

                    email: 'admin@test.com',

                    password: 'Admin123!'

                });


        adminToken =
            adminLogin.body.token;


        /*
         * Login guest
         */

        const guestLogin =
            await request(app)
                .post('/api/auth/guest/login')
                .send({

                    email: 'guest@test.com',

                    password: 'Guest123!'

                });


        guestToken =
            guestLogin.body.token;

    });


    /*
     * --------------------------------------------------
     * CLEANUP
     * --------------------------------------------------
     */

    after(async function () {

        await User.deleteMany({});

        await disconnectDatabase();

    });


    /*
     * ==================================================
     * GET ALL USERS
     * ==================================================
     */

    it('should allow an admin to retrieve all users', async function () {

        const response =
            await request(app)
                .get('/api/users')
                .set(
                    'Authorization',
                    `Bearer ${adminToken}`
                );


        expect(response.status).to.equal(200);

        expect(response.body).to.have.property(
            'count'
        );

        expect(response.body).to.have.property(
            'users'
        );

        expect(response.body.users).to.be.an(
            'array'
        );

        expect(response.body.count).to.equal(2);

    });


    it('should reject a guest from retrieving all users', async function () {

        const response =
            await request(app)
                .get('/api/users')
                .set(
                    'Authorization',
                    `Bearer ${guestToken}`
                );


        expect(response.status).to.equal(403);

    });


    /*
     * ==================================================
     * GET USER BY ID
     * ==================================================
     */

    it('should allow an admin to retrieve a user by ID', async function () {

        const response =
            await request(app)
                .get(
                    `/api/users/${guestUser._id}`
                )
                .set(
                    'Authorization',
                    `Bearer ${adminToken}`
                );


        expect(response.status).to.equal(200);

        expect(response.body).to.have.property(
            'user'
        );

        expect(
            response.body.user._id
        ).to.equal(
            guestUser._id.toString()
        );


        /*
         * Password must not be returned.
         */

        expect(
            response.body.user
        ).to.not.have.property(
            'password'
        );

    });


    /*
     * ==================================================
     * CREATE USER
     * ==================================================
     */

    it('should allow an admin to create a new user', async function () {

        const response =
            await request(app)
                .post('/api/users')
                .set(
                    'Authorization',
                    `Bearer ${adminToken}`
                )
                .send({

                    firstName: 'New',

                    lastName: 'User',

                    email: 'newuser@test.com',

                    password: 'Password123!',

                    phone: '0102222222',

                    role: 'guest',

                    active: true

                });


        expect(response.status).to.equal(201);

        expect(
            response.body.message
        ).to.equal(
            'User created successfully'
        );

        expect(response.body).to.have.property(
            'user'
        );

        expect(
            response.body.user.email
        ).to.equal(
            'newuser@test.com'
        );


        /*
         * Password must not be exposed.
         */

        expect(
            response.body.user
        ).to.not.have.property(
            'password'
        );


        /*
         * Confirm user exists in database.
         */

        const createdUser =
            await User.findOne({
                email: 'newuser@test.com'
            });


        expect(createdUser).to.not.equal(
            null
        );

    });


    /*
     * ==================================================
     * DUPLICATE EMAIL
     * ==================================================
     */

    it('should reject creating a user with an existing email', async function () {

        const response =
            await request(app)
                .post('/api/users')
                .set(
                    'Authorization',
                    `Bearer ${adminToken}`
                )
                .send({

                    firstName: 'Duplicate',

                    lastName: 'User',

                    email: 'guest@test.com',

                    password: 'Password123!',

                    phone: '0103333333',

                    role: 'guest',

                    active: true

                });


        expect(response.status).to.equal(409);

        expect(
            response.body.message
        ).to.equal(
            'An account with this email already exists'
        );

    });


    /*
     * ==================================================
     * UPDATE USER
     * ==================================================
     */

    it('should allow an admin to update a user', async function () {

        const response =
            await request(app)
                .put(
                    `/api/users/${guestUser._id}`
                )
                .set(
                    'Authorization',
                    `Bearer ${adminToken}`
                )
                .send({

                    firstName: 'Updated',

                    lastName: 'Guest',

                    phone: '0199999999'

                });


        expect(response.status).to.equal(200);

        expect(
            response.body.message
        ).to.equal(
            'User updated successfully'
        );

        expect(
            response.body.user.firstName
        ).to.equal(
            'Updated'
        );

        expect(
            response.body.user.phone
        ).to.equal(
            '0199999999'
        );


        /*
         * Confirm database was updated.
         */

        const updatedUser =
            await User.findById(
                guestUser._id
            );


        expect(
            updatedUser.firstName
        ).to.equal(
            'Updated'
        );

    });


    /*
     * ==================================================
     * UPDATE USER STATUS
     * ==================================================
     */

    it('should allow an admin to update a user status', async function () {

        const response =
            await request(app)
                .patch(
                    `/api/users/${guestUser._id}/status`
                )
                .set(
                    'Authorization',
                    `Bearer ${adminToken}`
                )
                .send({

                    active: false

                });


        expect(response.status).to.equal(200);

        expect(
            response.body.message
        ).to.equal(
            'User status updated successfully'
        );

        expect(
            response.body.user.active
        ).to.equal(
            false
        );


        /*
         * Confirm database was updated.
         */

        const updatedUser =
            await User.findById(
                guestUser._id
            );


        expect(
            updatedUser.active
        ).to.equal(
            false
        );

    });


    /*
     * ==================================================
     * DELETE USER
     * ==================================================
     */

    it('should allow an admin to delete another user', async function () {

        const response =
            await request(app)
                .delete(
                    `/api/users/${guestUser._id}`
                )
                .set(
                    'Authorization',
                    `Bearer ${adminToken}`
                );


        expect(response.status).to.equal(200);

        expect(
            response.body.message
        ).to.equal(
            'User deleted successfully'
        );


        /*
         * Confirm user no longer exists.
         */

        const deletedUser =
            await User.findById(
                guestUser._id
            );


        expect(deletedUser).to.equal(
            null
        );

    });


    /*
     * ==================================================
     * SELF DELETE PROTECTION
     * ==================================================
     */

    it('should prevent an admin from deleting their own account', async function () {

        const response =
            await request(app)
                .delete(
                    `/api/users/${adminUser._id}`
                )
                .set(
                    'Authorization',
                    `Bearer ${adminToken}`
                );


        expect(response.status).to.equal(400);

        expect(
            response.body.message
        ).to.equal(
            'You cannot delete your own admin account'
        );


        /*
         * Confirm admin still exists.
         */

        const existingAdmin =
            await User.findById(
                adminUser._id
            );


        expect(existingAdmin).to.not.equal(
            null
        );

    });


    /*
     * ==================================================
     * GUEST DELETE PROTECTION
     * ==================================================
     */

    it('should reject a guest from deleting a user', async function () {

        const response =
            await request(app)
                .delete(
                    `/api/users/${adminUser._id}`
                )
                .set(
                    'Authorization',
                    `Bearer ${guestToken}`
                );


        expect(response.status).to.equal(403);


        /*
         * Confirm admin still exists.
         */

        const existingAdmin =
            await User.findById(
                adminUser._id
            );


        expect(existingAdmin).to.not.equal(
            null
        );

    });

});