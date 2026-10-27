const { expect } = require('chai');
const jwt = require('jsonwebtoken');

const authenticateToken = require('../../middleware/authMiddleware');

describe('authenticateToken Middleware', function () {

    before(function () {
        process.env.JWT_SECRET = 'test-secret';
    });


    it('should return 401 when Authorization header is missing', function () {

        const req = {
            headers: {}
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

        const next = function () { };

        authenticateToken(req, res, next);

        expect(statusCode).to.equal(401);
        expect(responseBody.message)
            .to.equal('Authentication token is required');
    });


    it('should return 401 when Authorization format is invalid', function () {

        const req = {
            headers: {
                authorization: 'InvalidToken'
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

        const next = function () { };

        authenticateToken(req, res, next);

        expect(statusCode).to.equal(401);
        expect(responseBody.message)
            .to.equal('Invalid authentication format');
    });


    it('should return 401 when JWT token is invalid', function () {

        const req = {
            headers: {
                authorization: 'Bearer invalid-token'
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

        const next = function () { };

        authenticateToken(req, res, next);

        expect(statusCode).to.equal(401);
        expect(responseBody.message)
            .to.equal('Invalid authentication token');
    });


    it('should authenticate a valid JWT token', function () {

        const token = jwt.sign(
            {
                userId: '12345',
                role: 'guest'
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        const req = {
            headers: {
                authorization: `Bearer ${token}`
            }
        };

        const res = {
            status: function () {
                return this;
            },
            json: function () {
                return this;
            }
        };

        let nextCalled = false;

        const next = function () {
            nextCalled = true;
        };

        authenticateToken(req, res, next);

        expect(nextCalled).to.equal(true);
        expect(req.user.userId).to.equal('12345');
        expect(req.user.role).to.equal('guest');
    });

});