import dbClient from '../utils/dbClient';
import redisClient from '../utils/redisClient';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

class FilesController {
  static async postUpload(req, res) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, type, parentId = '0', isPublic = false, data } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    if (parentId !== '0') {
      const parent = await dbClient.db.collection('files').findOne({ _id: parentId });
      if (!parent) return res.status(400).json({ error: 'Parent not found' });
      if (parent.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    let localPath = '';
    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

      localPath = `${folderPath}/${uuidv4()}`;
      fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
    }

    const fileData = {
      userId: user._id,
      name,
      type,
      isPublic,
      parentId,
      localPath,
    };

    const result = await dbClient.db.collection('files').insertOne(fileData);
    return res.status(201).json({ id: result.insertedId, ...fileData });
  }

  static async getShow(req, res) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.db.collection('files').findOne({ _id: req.params.id, userId: user._id });
    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { parentId = '0', page = 0 } = req.query;
    const files = await dbClient.db.collection('files')
      .find({ parentId, userId: user._id })
      .skip(page * 20)
      .limit(20)
      .toArray();

    return res.status(200).json(files);
  }
}

export default FilesController;

