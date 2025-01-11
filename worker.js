import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import dbClient from './utils/db.js';

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

const generateThumbnail = async (path, width) => {
  try {
    const thumbnail = await imageThumbnail(path, { width });
    const thumbnailPath = `${path}_${width}`;
    await fs.promises.writeFile(thumbnailPath, thumbnail);
    return thumbnailPath;
  } catch (error) {
    console.error(`Error generating thumbnail: ${error}`);
    throw error;
  }
};

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId || !userId) {
    throw new Error('Missing required fields');
  }

  const file = await dbClient.files.findOne({
    _id: ObjectId(fileId),
    userId: ObjectId(userId)
  });

  if (!file) {
    throw new Error('File not found');
  }

  const sizes = [500, 250, 100];
  
  try {
    const thumbnailPromises = sizes.map(width => generateThumbnail(file.localPath, width));
    await Promise.all(thumbnailPromises);
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    throw error;
  }
});

userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  const user = await dbClient.users.findOne({ _id: ObjectId(userId) });

  if (!user) {
    throw new Error('User not found');
  }

  // Could be replaced with actual email sending logic
  console.log(`Welcome ${user.email}!`);
});

export { fileQueue, userQueue };
