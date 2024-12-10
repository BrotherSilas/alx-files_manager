import express from 'express';
import AuthController from '../controllers/AuthController';
import UsersController from '../controllers/UsersController';
import FilesController from '../controllers/FilesController';
import authMiddleware from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/users', UsersController.postNew);
router.get('/users/me', authMiddleware, UsersController.getMe);

router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);

router.post('/files', authMiddleware, FilesController.postUpload);
router.get('/files/:id', authMiddleware, FilesController.getShow);
router.get('/files', authMiddleware, FilesController.getIndex);

export default router;

