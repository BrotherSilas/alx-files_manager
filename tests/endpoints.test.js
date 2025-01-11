import { expect } from 'chai';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../server';
import redisClient from '../utils/redis.js';
import { dbClient } from '../utils/db.js';

describe('API Endpoints', () => {
    let token;
    let userId;
    let fileId;

    before(async function () {
        this.timeout(20000); // Ensure enough time for MongoDB connection

        // Flush Redis asynchronously
        await redisClient.client.flushall('ASYNC');

        // Connect to MongoDB and ensure it's successful
        try {
            await dbClient.connect(); // Explicit connection call
        } catch (err) {
            console.error('MongoDB connection failed during tests:', err);
            throw err; // Stop the tests if DB connection fails
        }

        // Delete all collections from MongoDB concurrently
        const collections = await dbClient.db.listCollections().toArray();
        const deletePromises = collections.map(collection => {
            return dbClient.db.collection(collection.name).deleteMany({});
        });

        // Wait for all delete operations to finish
        await Promise.all(deletePromises);

        // Create a test user
        const userResponse = await request(app)
            .post('/users')
            .send({
                email: 'test@example.com',
                password: 'testpassword123'
            });
        userId = userResponse.body.id;

        // Authenticate the user to get a token
        const authResponse = await request(app)
            .get('/connect')
            .auth('test@example.com', 'testpassword123', { type: 'basic' });
        token = authResponse.body.token;
    });

    describe('GET /status', () => {
        it('should return status of Redis and DB connections', async () => {
            const res = await request(app).get('/status');
            expect(res.status).to.equal(200);
            expect(res.body).to.deep.equal({
                redis: true,
                db: true
            });
        });
    });

    describe('GET /users/me', () => {
        it('should return user information', async () => {
            const res = await request(app)
                .get('/users/me')
                .set('X-Token', token); // Ensure the token is sent here
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('email', 'test@example.com');
        });
    });

    describe('POST /files', () => {
        it('should create a new file successfully', async () => {
            const res = await request(app)
                .post('/files')
                .set('X-Token', token) // Ensure the token is sent here
                .send({
                    name: 'test.txt',
                    type: 'file',
                    data: Buffer.from('Hello World').toString('base64')
                });
            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('id');
            fileId = res.body.id;
        });
    });

    describe('GET /files/:id', () => {
        it('should retrieve file information', async () => {
            const res = await request(app)
                .get(`/files/${fileId}`)
                .set('X-Token', token); // Token for authenticated request
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('name', 'test.txt');
        });
    });

    describe('GET /files/:id/data', () => {
        it('should retrieve file data', async () => {
            const res = await request(app)
                .get(`/files/${fileId}/data`)
                .set('X-Token', token); // Token for authenticated request
            expect(res.status).to.equal(200);
            expect(res.text).to.equal('Hello World');
        });
    });
});

