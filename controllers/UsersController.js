import sha1 from 'sha1';
import dbClient from '../utils/dbClient';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const existingUser = await dbClient.db.collection('users').findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Already exist' });

    const hashedPassword = sha1(password);
    const result = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });
    return res.status(201).json({ id: result.insertedId, email });
  }

  static async getMe(req, res) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    return res.status(200).json({ id: user._id, email: user.email });
  }
}

export default UsersController;

