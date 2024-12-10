import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redisClient';
import dbClient from '../utils/dbClient';
import sha1 from 'sha1';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) return res.status(401).json({ error: 'Unauthorized' });

    const encodedCreds = authHeader.split(' ')[1];
    const decodedCreds = Buffer.from(encodedCreds, 'base64').toString('utf8');
    const [email, password] = decodedCreds.split(':');

    const hashedPassword = sha1(password);
    const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 86400);
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token || !(await redisClient.exists(`auth_${token}`))) return res.status(401).json({ error: 'Unauthorized' });

    await redisClient.del(`auth_${token}`);
    return res.status(204).send();
  }
}

export default AuthController;

