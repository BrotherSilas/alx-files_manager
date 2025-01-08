/ tests/endpoints.test.js
import { expect } from 'chai';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../server.js';
import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

describe('API Endpoints', () => {
    let token;
    let userId;
    let fileId;

    before(async () => {
        await redisClient.client.flushall('ASYNC');
        const collections = await dbClient.db.listCollections().toArray();
        for (const collection of collections) {
            await dbClient.db.collection(collection.name).deleteMany({});
        }
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

    describe('GET /stats', () => {
        it('should return correct stats', async () => {
            const res = await request(app).get('/stats');
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('users');
            expect(res.body).to.have.property('files');
        });
    });

    describe('POST /users', () => {
        it('should create a new user successfully', async () => {
            const res = await request(app)
                .post('/users')
                .send({
                    email: 'test@test.com',
                    password: 'testpassword'
                });
            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('email', 'test@test.com');
            userId = res.body.id;
        });

        it('should return error if email is missing', async () => {
            const res = await request(app)
                .post('/users')
                .send({ password: 'testpassword' });
            expect(res.status).to.equal(400);
            expect(res.body).to.deep.equal({ error: 'Missing email' });
        });
    });

    describe('GET /connect', () => {
        it('should authenticate user and return token', async () => {
            const credentials = Buffer.from('test@test.com:testpassword').toString('base64');
            const res = await request(app)
                .get('/connect')
                .set('Authorization', `Basic ${credentials}`);
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('token');
            token = res.body.token;
        });
    });

    describe('GET /disconnect', () => {
        it('should disconnect user successfully', async () => {
            const res = await request(app)
                .get('/disconnect')
                .set('X-Token', token);
            expect(res.status).to.equal(204);
        });
    });

    describe('GET /users/me', () => {
        it('should return user information', async () => {
            const res = await request(app)
                .get('/users/me')
                .set('X-Token', token);
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('email', 'test@test.com');
            expect(res.body).to.have.property('id');
        });
    });

    describe('POST /files', () => {
        it('should create a new file successfully', async () => {
            const res = await request(app)
                .post('/files')
                .set('X-Token', token)
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
                .set('X-Token', token);
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('name', 'test.txt');
        });
    });

    describe('GET /files', () => {
        it('should list files with pagination', async () => {
            const res = await request(app)
                .get('/files')
                .set('X-Token', token)
                .query({ page: 0 });
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('array');
        });
    });

    describe('PUT /files/:id/publish', () => {
        it('should publish a file', async () => {
            const res = await request(app)
                .put(`/files/${fileId}/publish`)
                .set('X-Token', token);
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('isPublic', true);
        });
    });

    describe('PUT /files/:id/unpublish', () => {
        it('should unpublish a file', async () => {
            const res = await request(app)
                .put(`/files/${fileId}/unpublish`)
                .set('X-Token', token);
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('isPublic', false);
        });
    });

    describe('GET /files/:id/data', () => {
        it('should retrieve file data', async () => {
            const res = await request(app)
                .get(`/files/${fileId}/data`)
                .set('X-Token', token);
            expect(res.status).to.equal(200);
            expect(res.text).to.equal('Hello World');
        });
    });
});
