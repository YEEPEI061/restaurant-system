const { expect } = require('chai');
const sinon = require('sinon');

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../../models/User');

const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus
} = require('../../controllers/userController');


describe('User Controller', function () {

    afterEach(function () {
        sinon.restore();
    });


    /*
     * --------------------------------------------------
     * GET ALL USERS
     * --------------------------------------------------
     */

    describe('getUsers', function () {

        it('should return all users successfully', async function () {

            const users = [
                {
                    _id: 'user002',
                    firstName: 'John',
                    lastName: 'Tan',
                    email: 'john@example.com'
                },
                {
                    _id: 'user001',
                    firstName: 'Jane',
                    lastName: 'Lee',
                    email: 'jane@example.com'
                }
            ];

            const selectStub = sinon.stub().returns({
                sort: sinon.stub().resolves(users)
            });

            sinon.stub(User, 'find').returns({
                select: selectStub
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

            await getUsers(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.count)
                .to.equal(2);

            expect(responseBody.users)
                .to.deep.equal(users);

            expect(selectStub.calledWith('-password'))
                .to.equal(true);
        });

    });


    /*
     * --------------------------------------------------
     * GET USER BY ID
     * --------------------------------------------------
     */

    describe('getUserById', function () {

        it('should return a user successfully', async function () {

            const user = {
                _id: 'user001',
                firstName: 'Jane',
                lastName: 'Lee',
                email: 'jane@example.com'
            };

            const selectStub = sinon.stub()
                .resolves(user);

            sinon.stub(User, 'findById')
                .returns({
                    select: selectStub
                });

            const req = {
                params: {
                    id: 'user001'
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

            await getUserById(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.user)
                .to.deep.equal(user);

            expect(selectStub.calledWith('-password'))
                .to.equal(true);
        });
    });


    /*
     * --------------------------------------------------
     * CREATE USER
     * --------------------------------------------------
     */

    describe('createUser', function () {

        it('should create a user successfully using a mock object', async function () {

            sinon.stub(User, 'findOne')
                .resolves(null);

            sinon.stub(bcrypt, 'hash')
                .resolves('hashed-password');

            const createdUser = {
                _id: 'user001',
                firstName: 'Jane',
                lastName: 'Lee',
                email: 'jane@example.com',
                password: 'hashed-password',
                phone: '0123456789',
                role: 'guest',
                active: true,

                toObject: function () {
                    return {
                        _id: 'user001',
                        firstName: 'Jane',
                        lastName: 'Lee',
                        email: 'jane@example.com',
                        password: 'hashed-password',
                        phone: '0123456789',
                        role: 'guest',
                        active: true
                    };
                }
            };

            const createMock = sinon.mock(User);

            createMock.expects('create')
                .once()
                .withArgs(sinon.match({
                    firstName: 'Jane',
                    lastName: 'Lee',
                    email: 'jane@example.com',
                    password: 'hashed-password',
                    phone: '0123456789',
                    role: 'guest',
                    active: true
                }))
                .resolves(createdUser);

            const req = {
                body: {
                    firstName: 'Jane',
                    lastName: 'Lee',
                    email: 'jane@example.com',
                    password: 'password123',
                    phone: '0123456789',
                    role: 'guest',
                    active: true
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

            await createUser(req, res);

            expect(statusCode).to.equal(201);

            expect(responseBody.message)
                .to.equal('User created successfully');

            expect(responseBody.user.email)
                .to.equal('jane@example.com');

            expect(responseBody.user.password)
                .to.equal(undefined);

            createMock.verify();
        });


        it('should return 409 when the email already exists', async function () {

            sinon.stub(User, 'findOne')
                .resolves({
                    _id: 'existing-user',
                    email: 'jane@example.com'
                });

            const req = {
                body: {
                    firstName: 'Jane',
                    lastName: 'Lee',
                    email: 'jane@example.com',
                    password: 'password123',
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

            await createUser(req, res);

            expect(statusCode).to.equal(409);

            expect(responseBody.message)
                .to.equal(
                    'An account with this email already exists'
                );
        });


        it('should return 500 when creating a user fails', async function () {

            sinon.stub(User, 'findOne')
                .resolves(null);

            sinon.stub(bcrypt, 'hash')
                .resolves('hashed-password');

            sinon.stub(User, 'create')
                .rejects(new Error('Database error'));

            const req = {
                body: {
                    firstName: 'Jane',
                    lastName: 'Lee',
                    email: 'jane@example.com',
                    password: 'password123',
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

            await createUser(req, res);

            expect(statusCode).to.equal(500);

            expect(responseBody.message)
                .to.equal('Failed to create user');
        });

    });


    /*
     * --------------------------------------------------
     * UPDATE USER
     * --------------------------------------------------
     */

    describe('updateUser', function () {

        it('should update a user successfully', async function () {

            const userId =
                new mongoose.Types.ObjectId();

            const user = {
                _id: userId,
                firstName: 'Jane',
                lastName: 'Lee',
                email: 'jane@example.com',
                password: 'old-password',
                phone: '0123456789',
                role: 'guest',
                active: true,

                save: sinon.stub().resolves(),

                toObject: function () {
                    return {
                        _id: this._id,
                        firstName: this.firstName,
                        lastName: this.lastName,
                        email: this.email,
                        password: this.password,
                        phone: this.phone,
                        role: this.role,
                        active: this.active
                    };
                }
            };

            sinon.stub(User, 'findById')
                .resolves(user);

            sinon.stub(User, 'findOne')
                .resolves(null);

            sinon.stub(bcrypt, 'hash')
                .resolves('new-hashed-password');

            const req = {
                params: {
                    id: userId.toString()
                },

                body: {
                    firstName: 'Janet',
                    lastName: 'Tan',
                    email: 'janet@example.com',
                    password: 'newpassword123',
                    phone: '0111111111',
                    role: 'guest',
                    active: false
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

            await updateUser(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.message)
                .to.equal('User updated successfully');

            expect(user.firstName)
                .to.equal('Janet');

            expect(user.lastName)
                .to.equal('Tan');

            expect(user.email)
                .to.equal('janet@example.com');

            expect(user.password)
                .to.equal('new-hashed-password');

            expect(user.phone)
                .to.equal('0111111111');

            expect(user.active)
                .to.equal(false);

            expect(responseBody.user.password)
                .to.equal(undefined);

            expect(user.save.calledOnce)
                .to.equal(true);

            expect(bcrypt.hash.calledOnce)
                .to.equal(true);
        });

        it('should return 409 when updating to an existing email', async function () {

            const user = {
                _id: 'user001',
                email: 'jane@example.com'
            };

            sinon.stub(User, 'findById')
                .resolves(user);

            sinon.stub(User, 'findOne')
                .resolves({
                    _id: 'user002',
                    email: 'other@example.com'
                });

            const req = {
                params: {
                    id: 'user001'
                },

                body: {
                    email: 'other@example.com'
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

            await updateUser(req, res);

            expect(statusCode).to.equal(409);

            expect(responseBody.message)
                .to.equal(
                    'An account with this email already exists'
                );
        });

    });


    /*
     * --------------------------------------------------
     * DELETE USER
     * --------------------------------------------------
     */

    describe('deleteUser', function () {

        it('should delete a user successfully', async function () {

            const user = {
                _id: new mongoose.Types.ObjectId(),
                email: 'guest@example.com'
            };

            sinon.stub(User, 'findById')
                .resolves(user);

            const deleteMock = sinon.mock(User);

            deleteMock.expects('deleteOne')
                .once()
                .withArgs({ _id: user._id })
                .resolves({
                    deletedCount: 1
                });

            const req = {
                params: {
                    id: user._id.toString()
                },

                user: {
                    userId: new mongoose.Types.ObjectId().toString()
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

            await deleteUser(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.message)
                .to.equal('User deleted successfully');

            deleteMock.verify();
        });

        it('should prevent an admin from deleting their own account', async function () {

            const adminId =
                new mongoose.Types.ObjectId();

            const user = {
                _id: adminId,
                email: 'admin@aurelia.com'
            };

            sinon.stub(User, 'findById')
                .resolves(user);

            const req = {
                params: {
                    id: adminId.toString()
                },

                user: {
                    userId: adminId.toString()
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

            await deleteUser(req, res);

            expect(statusCode).to.equal(400);

            expect(responseBody.message)
                .to.equal(
                    'You cannot delete your own admin account'
                );
        });

    });


    /*
     * --------------------------------------------------
     * UPDATE USER STATUS
     * --------------------------------------------------
     */

    describe('updateUserStatus', function () {

        it('should return 400 when active is not a boolean', async function () {

            const req = {
                params: {
                    id: new mongoose.Types.ObjectId().toString()
                },

                body: {
                    active: 'yes'
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

            await updateUserStatus(req, res);

            expect(statusCode).to.equal(400);

            expect(responseBody.message)
                .to.equal(
                    'Active must be true or false'
                );
        });


        it('should return 400 when the user ID is invalid', async function () {

            const req = {
                params: {
                    id: 'invalid-id'
                },

                body: {
                    active: false
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

            await updateUserStatus(req, res);

            expect(statusCode).to.equal(400);

            expect(responseBody.message)
                .to.equal('Invalid user ID');
        });


        it('should update user status successfully', async function () {

            const userId =
                new mongoose.Types.ObjectId();

            const updatedUser = {
                _id: userId,
                firstName: 'Jane',
                lastName: 'Lee',
                email: 'jane@example.com',
                active: false
            };

            const selectStub = sinon.stub()
                .resolves(updatedUser);

            sinon.stub(User, 'findByIdAndUpdate')
                .returns({
                    select: selectStub
                });

            const req = {
                params: {
                    id: userId.toString()
                },

                body: {
                    active: false
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

            await updateUserStatus(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.message)
                .to.equal(
                    'User status updated successfully'
                );

            expect(responseBody.user)
                .to.deep.equal(updatedUser);

            expect(selectStub.calledWith('-password'))
                .to.equal(true);
        });

    });

});