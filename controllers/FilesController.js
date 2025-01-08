import { ObjectID } from 'mongodb';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import Queue from 'bull';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

const fileQueue = new Queue('fileQueue');
const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
    static async postUpload(req, res) {
        const token = req.header('X-Token');
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, type, parentId = '0', isPublic = false, data } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Missing name' });
        }

        if (!type || !['folder', 'file', 'image'].includes(type)) {
            return res.status(400).json({ error: 'Missing type' });
        }

        if (!data && type !== 'folder') {
            return res.status(400).json({ error: 'Missing data' });
        }

        if (parentId !== '0') {
            const parent = await dbClient.files.findOne({ _id: ObjectID(parentId) });
            if (!parent) {
                return res.status(400).json({ error: 'Parent not found' });
            }
            if (parent.type !== 'folder') {
                return res.status(400).json({ error: 'Parent is not a folder' });
            }
        }

        const fileDocument = {
            userId: ObjectID(userId),
            name,
            type,
            isPublic,
            parentId: parentId === '0' ? 0 : ObjectID(parentId),
        };

        if (type === 'folder') {
            const result = await dbClient.files.insertOne(fileDocument);
            return res.status(201).json({
                id: result.insertedId,
                userId: fileDocument.userId,
                name,
                type,
                isPublic,
                parentId: fileDocument.parentId,
            });
        }

        // Create storage folder if it doesn't exist
        if (!fs.existsSync(FOLDER_PATH)) {
            fs.mkdirSync(FOLDER_PATH, { recursive: true });
        }

        // Save file content
        const fileUuid = uuidv4();
        const localPath = `${FOLDER_PATH}/${fileUuid}`;
        const fileContent = Buffer.from(data, 'base64');
        fs.writeFileSync(localPath, fileContent);

        fileDocument.localPath = localPath;
        const result = await dbClient.files.insertOne(fileDocument);

        // Add thumbnail generation job for images
        if (type === 'image') {
            await fileQueue.add({
                userId: userId.toString(),
                fileId: result.insertedId.toString(),
            });
        }

        return res.status(201).json({
            id: result.insertedId,
            userId: fileDocument.userId,
            name,
            type,
            isPublic,
            parentId: fileDocument.parentId,
        });
    }

    static async getShow(req, res) {
        const token = req.header('X-Token');
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const fileId = req.params.id;
        const file = await dbClient.files.findOne({
            _id: ObjectID(fileId),
            userId: ObjectID(userId),
        });

        if (!file) {
            return res.status(404).json({ error: 'Not found' });
        }

        return res.status(200).json({
            id: file._id,
            userId: file.userId,
            name: file.name,
            type: file.type,
            isPublic: file.isPublic,
            parentId: file.parentId,
        });
    }

    static async getIndex(req, res) {
        const token = req.header('X-Token');
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const parentId = req.query.parentId || '0';
        const page = parseInt(req.query.page) || 0;
        const pageSize = 20;

        const query = {
            userId: ObjectID(userId),
            parentId: parentId === '0' ? 0 : ObjectID(parentId),
        };

        const files = await dbClient.files
            .aggregate([
                { $match: query },
                { $skip: page * pageSize },
                { $limit: pageSize },
            ])
            .toArray();

        return res.status(200).json(
            files.map((file) => ({
                id: file._id,
                userId: file.userId,
                name: file.name,
                type: file.type,
                isPublic: file.isPublic,
                parentId: file.parentId,
            }))
        );
    }

    static async putPublish(req, res) {
        const token = req.header('X-Token');
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const fileId = req.params.id;
        const file = await dbClient.files.findOneAndUpdate(
            { _id: ObjectID(fileId), userId: ObjectID(userId) },
            { $set: { isPublic: true } },
            { returnDocument: 'after' }
        );

        if (!file.value) {
            return res.status(404).json({ error: 'Not found' });
        }

        return res.status(200).json({
            id: file.value._id,
            userId: file.value.userId,
            name: file.value.name,
            type: file.value.type,
            isPublic: true,
            parentId: file.value.parentId,
        });
    }

    static async putUnpublish(req, res) {
        const token = req.header('X-Token');
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const fileId = req.params.id;
        const file = await dbClient.files.findOneAndUpdate(
            { _id: ObjectID(fileId), userId: ObjectID(userId) },
            { $set: { isPublic: false } },
            { returnDocument: 'after' }
        );

        if (!file.value) {
            return res.status(404).json({ error: 'Not found' });
        }

        return res.status(200).json({
            id: file.value._id,
            userId: file.value.userId,
            name: file.value.name,
            type: file.value.type,
            isPublic: false,
            parentId: file.value.parentId,
        });
    }

    static async getFile(req, res) {
        const fileId = req.params.id;
        const size = req.query.size;

        const file = await dbClient.files.findOne({ _id: ObjectID(fileId) });
        if (!file) {
            return res.status(404).json({ error: 'Not found' });
        }

        const token = req.header('X-Token');
        const userId = token ? await redisClient.get(`auth_${token}`) : null;

        if (!file.isPublic && (!userId || userId !== file.userId.toString())) {
            return res.status(404).json({ error: 'Not found' });
        }

        if (file.type === 'folder') {
            return res.status(400).json({ error: "A folder doesn't have content" });
        }

        let filePath = file.localPath;
        if (size) {
            filePath = `${file.localPath}_${size}`;
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Not found' });
        }

        const mimeType = mime.lookup(file.name);
	res.setHeader('Content-Type', mimeType);
        return res.sendFile(filePath);
    }
}

export default FilesController;
