require('dotenv').config();

const request = require('supertest');
const { expect } = require('chai');
const bcrypt = require('bcryptjs');

const app = require('../../app');

const {
    connectDatabase,
    disconnectDatabase
} = require('../../config/db');

const MenuItem = require('../../models/MenuItem');
const User = require('../../models/User');


describe('Menu Integration Tests', function () {

    before(async function () {
        await connectDatabase(
            process.env.MONGO_TEST_URI
        );

        await MenuItem.deleteMany({});
    });

    afterEach(async function () {
        await MenuItem.deleteMany({});
        await User.deleteMany({});
    });

    after(async function () {
        await disconnectDatabase();
    });


    it('should retrieve all menu items', async function () {

        await MenuItem.create([
            {
                dishId: 'M-001',
                name: 'Truffle Mushroom Tart',
                description: 'A savoury tart with wild mushrooms and truffle.',
                category: 'Prelude & Starters',
                price: 28,
                available: true,
                signature: true,
                dietary: ['Veg'],
                image: '',
                provenance: 'Local wild mushrooms',
                pairing: 'Chardonnay',
                allergens: 'Milk'
            },
            {
                dishId: 'M-002',
                name: 'French Onion Soup',
                description: 'Classic caramelised onion soup.',
                category: 'Prelude & Starters',
                price: 22,
                available: true,
                signature: false,
                dietary: [],
                image: '',
                provenance: 'French-inspired preparation',
                pairing: 'Red wine',
                allergens: 'Milk'
            }
        ]);

        const response = await request(app)
            .get('/api/menu');

        expect(response.status).to.equal(200);

        expect(response.body).to.have.property('count', 2);

        expect(response.body.menuItems)
            .to.be.an('array')
            .with.lengthOf(2);

        expect(response.body.menuItems[0])
            .to.have.property('dishId');

        expect(response.body.menuItems[0])
            .to.have.property('name');

        expect(response.body.menuItems[0])
            .to.have.property('price');
    });

    it('should retrieve one menu item by dish ID', async function () {

        await MenuItem.create({
            dishId: 'M-001',
            name: 'Truffle Mushroom Tart',
            description: 'A savoury tart with wild mushrooms and truffle.',
            category: 'Prelude & Starters',
            price: 28,
            available: true,
            signature: true,
            dietary: ['Veg'],
            image: '',
            provenance: 'Local wild mushrooms',
            pairing: 'Chardonnay',
            allergens: 'Milk'
        });

        const response = await request(app)
            .get('/api/menu/M-001');

        expect(response.status).to.equal(200);

        expect(response.body)
            .to.have.property('menuItem');

        expect(response.body.menuItem.dishId)
            .to.equal('M-001');

        expect(response.body.menuItem.name)
            .to.equal('Truffle Mushroom Tart');

        expect(response.body.menuItem.price)
            .to.equal(28);
    });

    it('should create a menu item as an admin', async function () {

        const hashedPassword = await bcrypt.hash(
            'Admin123',
            10
        );

        await User.create({
            firstName: 'Integration',
            lastName: 'Admin',
            email: 'menuadmin@test.com',
            phone: '0123456789',
            password: hashedPassword,
            role: 'admin',
            active: true
        });

        const loginResponse = await request(app)
            .post('/api/auth/admin/login')
            .send({
                email: 'menuadmin@test.com',
                password: 'Admin123'
            });

        expect(loginResponse.status).to.equal(200);

        const token = loginResponse.body.token;

        expect(token).to.be.a('string');

        const response = await request(app)
            .post('/api/menu')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Herb-Crusted Lamb',
                description: 'Tender lamb with seasonal herbs and vegetables.',
                category: 'Wood-Fire Mains',
                price: 68,
                available: true,
                signature: true,
                dietary: [],
                image: '',
                provenance: 'Locally sourced lamb',
                pairing: 'Cabernet Sauvignon',
                allergens: 'Milk'
            });

        expect(response.status).to.equal(201);

        expect(response.body)
            .to.have.property(
                'message',
                'Menu item created successfully'
            );

        expect(response.body.menuItem)
            .to.have.property('dishId', 'M-001');

        expect(response.body.menuItem.name)
            .to.equal('Herb-Crusted Lamb');

        expect(response.body.menuItem.price)
            .to.equal(68);

        const savedItem = await MenuItem.findOne({
            dishId: 'M-001'
        });

        expect(savedItem).to.not.equal(null);

        expect(savedItem.name)
            .to.equal('Herb-Crusted Lamb');
    });

    it('should reject unauthenticated users', async function () {

        const response = await request(app)
            .post('/api/menu')
            .send({
                name: 'Unauthorised Dish',
                description: 'This item should not be created.',
                category: 'Wood-Fire Mains',
                price: 50,
                available: true,
                signature: false,
                dietary: [],
                image: '',
                provenance: '',
                pairing: '',
                allergens: ''
            });

        expect(response.status).to.equal(401);

        expect(response.body)
            .to.have.property(
                'message',
                'Authentication token is required'
            );

        const menuItem = await MenuItem.findOne({
            name: 'Unauthorised Dish'
        });

        expect(menuItem).to.equal(null);
    });

    it('should reject a guest user', async function () {

        await request(app)
            .post('/api/auth/guest/signup')
            .send({
                firstName: 'Menu',
                lastName: 'Guest',
                email: 'menuguest@test.com',
                phone: '0123456789',
                password: 'Password123'
            });

        const loginResponse = await request(app)
            .post('/api/auth/guest/login')
            .send({
                email: 'menuguest@test.com',
                password: 'Password123'
            });

        expect(loginResponse.status).to.equal(200);

        const token = loginResponse.body.token;

        expect(token).to.be.a('string');

        const response = await request(app)
            .post('/api/menu')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Guest Dish',
                description: 'This item should not be created by a guest.',
                category: 'Wood-Fire Mains',
                price: 50,
                available: true,
                signature: false,
                dietary: [],
                image: '',
                provenance: '',
                pairing: '',
                allergens: ''
            });

        expect(response.status).to.equal(403);

        expect(response.body)
            .to.have.property(
                'message',
                'You do not have permission to access this resource'
            );

        const menuItem = await MenuItem.findOne({
            name: 'Guest Dish'
        });

        expect(menuItem).to.equal(null);
    });

    it('should update a menu item as an admin', async function () {

        const menuItem = await MenuItem.create({
            dishId: 'M-001',
            name: 'Original Dish',
            description: 'Original description.',
            category: 'Wood-Fire Mains',
            price: 50,
            available: true,
            signature: false,
            dietary: [],
            image: '',
            provenance: '',
            pairing: '',
            allergens: ''
        });

        const hashedPassword = await bcrypt.hash(
            'Admin123',
            10
        );

        await User.create({
            firstName: 'Update',
            lastName: 'Admin',
            email: 'updateadmin@test.com',
            phone: '0123456789',
            password: hashedPassword,
            role: 'admin',
            active: true
        });

        const loginResponse = await request(app)
            .post('/api/auth/admin/login')
            .send({
                email: 'updateadmin@test.com',
                password: 'Admin123'
            });

        expect(loginResponse.status).to.equal(200);

        const token = loginResponse.body.token;

        const response = await request(app)
            .put(`/api/menu/${menuItem.dishId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Updated Dish',
                price: 65,
                available: false
            });

        expect(response.status).to.equal(200);

        expect(response.body)
            .to.have.property(
                'message',
                'Menu item updated successfully'
            );

        expect(response.body.menuItem.name)
            .to.equal('Updated Dish');

        expect(response.body.menuItem.price)
            .to.equal(65);

        expect(response.body.menuItem.available)
            .to.equal(false);

        const updatedItem = await MenuItem.findOne({
            dishId: 'M-001'
        });

        expect(updatedItem.name)
            .to.equal('Updated Dish');

        expect(updatedItem.price)
            .to.equal(65);

        expect(updatedItem.available)
            .to.equal(false);
    });

    it('should delete a menu item as an admin', async function () {

        const menuItem = await MenuItem.create({
            dishId: 'M-001',
            name: 'Dish to Delete',
            description: 'This menu item will be deleted.',
            category: 'Wood-Fire Mains',
            price: 55,
            available: true,
            signature: false,
            dietary: [],
            image: '',
            provenance: '',
            pairing: '',
            allergens: ''
        });

        const hashedPassword = await bcrypt.hash(
            'Admin123',
            10
        );

        await User.create({
            firstName: 'Delete',
            lastName: 'Admin',
            email: 'deleteadmin@test.com',
            phone: '0123456789',
            password: hashedPassword,
            role: 'admin',
            active: true
        });

        const loginResponse = await request(app)
            .post('/api/auth/admin/login')
            .send({
                email: 'deleteadmin@test.com',
                password: 'Admin123'
            });

        expect(loginResponse.status).to.equal(200);

        const token = loginResponse.body.token;

        const response = await request(app)
            .delete(`/api/menu/${menuItem.dishId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).to.equal(200);

        expect(response.body)
            .to.have.property(
                'message',
                'Menu item deleted successfully'
            );

        const deletedItem = await MenuItem.findOne({
            dishId: 'M-001'
        });

        expect(deletedItem).to.equal(null);
    });

    it('should update menu item availability as an admin', async function () {

        const menuItem = await MenuItem.create({
            dishId: 'M-001',
            name: 'Availability Test Dish',
            description: 'A dish used to test availability updates.',
            category: 'Wood-Fire Mains',
            price: 60,
            available: true,
            signature: false,
            dietary: [],
            image: '',
            provenance: '',
            pairing: '',
            allergens: ''
        });

        const hashedPassword = await bcrypt.hash(
            'Admin123',
            10
        );

        await User.create({
            firstName: 'Availability',
            lastName: 'Admin',
            email: 'availabilityadmin@test.com',
            phone: '0123456789',
            password: hashedPassword,
            role: 'admin',
            active: true
        });

        const loginResponse = await request(app)
            .post('/api/auth/admin/login')
            .send({
                email: 'availabilityadmin@test.com',
                password: 'Admin123'
            });

        expect(loginResponse.status).to.equal(200);

        const token = loginResponse.body.token;

        const response = await request(app)
            .patch(`/api/menu/${menuItem.dishId}/availability`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                available: false
            });

        expect(response.status).to.equal(200);

        expect(response.body)
            .to.have.property(
                'message',
                'Menu item availability updated successfully'
            );

        expect(response.body.menuItem.available)
            .to.equal(false);

        const updatedItem = await MenuItem.findOne({
            dishId: 'M-001'
        });

        expect(updatedItem.available)
            .to.equal(false);
    });

});