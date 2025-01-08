// tests/dbClient.test.js
import { expect } from 'chai';
import dbClient from '../utils/db.js';
import { ObjectId } from 'mongodb';

describe('DBClient', () => {
    before(async () => {
        const collections = await dbClient.db.listCollections().toArray();
        for (const collection of collections) {
            await dbClient.db.collection(collection.name).deleteMany({});
        }
    });

    after(async () => {
        const collections = await dbClient.db.listCollections().toArray();
        for (const collection of collections) {
            await dbClient.db.collection(collection.name).deleteMany({});
        }
    });

    it('should connect to MongoDB successfully', () => {
        expect(dbClient.isAlive()).to.be.true;
    });

    it('should return correct number of users', async () => {
        const usersCollection = dbClient.db.collection('users');
        await usersCollection.insertMany([
            { email: 'test1@test.com', password: 'password1' },
            { email: 'test2@test.com', password: 'password2' }
        ]);
        const nbUsers = await dbClient.nbUsers();
        expect(nbUsers).to.equal(2);
    });

    it('should return correct number of files', async () => {
        const filesCollection = dbClient.db.collection('files');
        await filesCollection.insertMany([
            { name: 'file1.txt', type: 'file' },
            { name: 'file2.txt', type: 'file' },
            { name: 'file3.txt', type: 'file' }
        ]);
        const nbFiles = await dbClient.nbFiles();
        expect(nbFiles).to.equal(3);
    });
});
