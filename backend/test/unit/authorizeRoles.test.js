const { expect } = require('chai');

const authorizeRoles = require('../../middleware/roleMiddleware');

describe('authorizeRoles Middleware', function () {

    it('should allow access when the user has an allowed role', function () {

        const req = {
            user: {
                role: 'admin'
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

        authorizeRoles('admin')(req, res, next);

        expect(nextCalled).to.equal(true);
    });


    it('should return 401 when the user is not authenticated', function () {

        const req = {
            user: null
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

        authorizeRoles('admin')(req, res, next);

        expect(statusCode).to.equal(401);
        expect(responseBody.message)
            .to.equal('Authentication required');
    });


    it('should return 403 when the user does not have permission', function () {

        const req = {
            user: {
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

        const next = function () { };

        authorizeRoles('admin')(req, res, next);

        expect(statusCode).to.equal(403);
        expect(responseBody.message)
            .to.equal(
                'You do not have permission to access this resource'
            );
    });

});