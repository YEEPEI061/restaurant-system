const { expect } = require('chai');
const sinon = require('sinon');

const MenuItem = require('../models/MenuItem');

const {
    getMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateAvailability
} = require('../controllers/menuController');


describe('Menu Controller', function () {

    afterEach(function () {
        sinon.restore();
    });


    /*
     * --------------------------------------------------
     * GET ALL MENU ITEMS
     * --------------------------------------------------
     */

    describe('getMenuItems', function () {

        it('should return all menu items successfully', async function () {

            const menuItems = [
                {
                    dishId: 'M-002',
                    name: 'Truffle Pasta',
                    price: 28
                },
                {
                    dishId: 'M-001',
                    name: 'French Onion Soup',
                    price: 18
                }
            ];

            sinon.stub(MenuItem, 'find').returns({
                sort: sinon.stub().resolves(menuItems)
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

            await getMenuItems(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.count)
                .to.equal(2);

            expect(responseBody.menuItems)
                .to.deep.equal(menuItems);
        });

    });


    /*
     * --------------------------------------------------
     * GET MENU ITEM BY ID
     * --------------------------------------------------
     */

    describe('getMenuItemById', function () {

        it('should return a menu item successfully', async function () {

            const menuItem = {
                dishId: 'M-001',
                name: 'French Onion Soup',
                price: 18,
                available: true
            };

            sinon.stub(MenuItem, 'findOne').resolves(menuItem);

            const req = {
                params: {
                    id: 'M-001'
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

            await getMenuItemById(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.menuItem)
                .to.deep.equal(menuItem);
        });

    });


    /*
     * --------------------------------------------------
     * CREATE MENU ITEM
     * --------------------------------------------------
     */

    describe('createMenuItem', function () {

        it('should create a menu item successfully', async function () {

            sinon.stub(MenuItem, 'find').resolves([
                {
                    dishId: 'M-001'
                },
                {
                    dishId: 'M-005'
                }
            ]);

            const createdMenuItem = {
                _id: 'menu123',
                dishId: 'M-006',
                name: 'Truffle Pasta',
                description: 'Fresh pasta with truffle',
                category: 'Main Course',
                price: 28,
                available: true,
                signature: true,
                dietary: [],
                image: 'truffle-pasta.jpg',
                provenance: 'France',
                pairing: 'Red Wine',
                allergens: ['gluten'],
                save: sinon.stub()
            };

            sinon.stub(MenuItem, 'create')
                .resolves(createdMenuItem);

            const req = {
                body: {
                    name: 'Truffle Pasta',
                    description: 'Fresh pasta with truffle',
                    category: 'Main Course',
                    price: 28,
                    available: true,
                    signature: true,
                    dietary: [],
                    image: 'truffle-pasta.jpg',
                    provenance: 'France',
                    pairing: 'Red Wine',
                    allergens: ['gluten']
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

            await createMenuItem(req, res);

            expect(statusCode).to.equal(201);

            expect(responseBody.message)
                .to.equal('Menu item created successfully');

            expect(responseBody.menuItem.dishId)
                .to.equal('M-006');

            expect(responseBody.menuItem.name)
                .to.equal('Truffle Pasta');
        });


        it('should return 500 when creating a menu item fails', async function () {

            sinon.stub(MenuItem, 'find').resolves([]);

            sinon.stub(MenuItem, 'create').rejects(
                new Error('Database error')
            );

            const req = {
                body: {
                    name: 'Truffle Pasta',
                    description: 'Fresh pasta with truffle',
                    category: 'Main Course',
                    price: 28,
                    available: true,
                    signature: true,
                    dietary: [],
                    image: 'truffle-pasta.jpg',
                    provenance: 'France',
                    pairing: 'Red Wine',
                    allergens: ['gluten']
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

            await createMenuItem(req, res);

            expect(statusCode).to.equal(500);

            expect(responseBody.message)
                .to.equal('Failed to create menu item');
        });

    });


    /*
     * --------------------------------------------------
     * UPDATE MENU ITEM
     * --------------------------------------------------
     */

    describe('updateMenuItem', function () {

        it('should update a menu item successfully', async function () {

            const menuItem = {
                dishId: 'M-001',
                name: 'Original Name',
                price: 20,
                available: true,
                save: sinon.stub().resolves()
            };

            sinon.stub(MenuItem, 'findOne')
                .resolves(menuItem);

            const req = {
                params: {
                    id: 'M-001'
                },

                body: {
                    name: 'Updated Name',
                    price: 25
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

            await updateMenuItem(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.message)
                .to.equal('Menu item updated successfully');

            expect(menuItem.name)
                .to.equal('Updated Name');

            expect(menuItem.price)
                .to.equal(25);

            expect(menuItem.save.calledOnce)
                .to.equal(true);
        });


        it('should return 404 when updating a menu item that does not exist', async function () {

            sinon.stub(MenuItem, 'findOne').resolves(null);

            const req = {
                params: {
                    id: 'M-999'
                },

                body: {
                    name: 'Updated Name'
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

            await updateMenuItem(req, res);

            expect(statusCode).to.equal(404);

            expect(responseBody.message)
                .to.equal('Menu item not found');
        });


        it('should return 500 when updating a menu item fails', async function () {

            sinon.stub(MenuItem, 'findOne').rejects(
                new Error('Database error')
            );

            const req = {
                params: {
                    id: 'M-001'
                },

                body: {
                    name: 'Updated Name'
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

            await updateMenuItem(req, res);

            expect(statusCode).to.equal(500);

            expect(responseBody.message)
                .to.equal('Failed to update menu item');
        });

    });


    /*
     * --------------------------------------------------
     * DELETE MENU ITEM
     * --------------------------------------------------
     */

    describe('deleteMenuItem', function () {

        it('should delete a menu item successfully', async function () {

            const menuItem = {
                _id: 'menu123',
                dishId: 'M-001'
            };

            sinon.stub(MenuItem, 'findOne')
                .resolves(menuItem);

            const deleteOneStub = sinon.stub(MenuItem, 'deleteOne')
                .resolves({
                    deletedCount: 1
                });

            const req = {
                params: {
                    id: 'M-001'
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

            await deleteMenuItem(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.message)
                .to.equal('Menu item deleted successfully');

            expect(deleteOneStub.calledOnce)
                .to.equal(true);
        });

    });


    /*
     * --------------------------------------------------
     * UPDATE AVAILABILITY
     * --------------------------------------------------
     */

    describe('updateAvailability', function () {

        it('should return 400 when available is not a boolean', async function () {

            const req = {
                params: {
                    id: 'M-001'
                },

                body: {
                    available: 'yes'
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

            await updateAvailability(req, res);

            expect(statusCode).to.equal(400);

            expect(responseBody.message)
                .to.equal('Available must be true or false');
        });


        it('should update menu item availability successfully', async function () {

            const updatedMenuItem = {
                dishId: 'M-001',
                name: 'French Onion Soup',
                available: false
            };

            sinon.stub(MenuItem, 'findOneAndUpdate')
                .resolves(updatedMenuItem);

            const req = {
                params: {
                    id: 'M-001'
                },

                body: {
                    available: false
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

            await updateAvailability(req, res);

            expect(statusCode).to.equal(200);

            expect(responseBody.message)
                .to.equal(
                    'Menu item availability updated successfully'
                );

            expect(responseBody.menuItem)
                .to.deep.equal(updatedMenuItem);
        });

        it('should return 500 when updating availability fails', async function () {

            sinon.stub(MenuItem, 'findOneAndUpdate')
                .rejects(new Error('Database error'));

            const req = {
                params: {
                    id: 'M-001'
                },

                body: {
                    available: false
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

            await updateAvailability(req, res);

            expect(statusCode).to.equal(500);

            expect(responseBody.message)
                .to.equal(
                    'Failed to update menu item availability'
                );
        });

    });

});