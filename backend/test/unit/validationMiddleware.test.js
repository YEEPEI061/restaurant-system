const { expect } = require('chai');
const { body, validationResult } = require('express-validator');

const validateRequest = require('../../middleware/validationMiddleware');

describe('validateRequest Middleware', function () {

  it('should call next when there are no validation errors', async function () {

    const req = {
      body: {
        email: 'test@example.com'
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

    const validationChain = body('email')
      .isEmail()
      .withMessage('Invalid email');

    await validationChain.run(req);

    validateRequest(req, res, next);

    expect(nextCalled).to.equal(true);
  });


  it('should return 400 when validation errors exist', async function () {

    const req = {
      body: {
        email: 'invalid-email'
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

    const validationChain = body('email')
      .isEmail()
      .withMessage('Invalid email');

    await validationChain.run(req);

    validateRequest(req, res, next);

    expect(statusCode).to.equal(400);

    expect(responseBody.message)
      .to.equal('Validation failed');

    expect(responseBody.errors)
      .to.be.an('array');

    expect(responseBody.errors.length)
      .to.be.greaterThan(0);
  });

});