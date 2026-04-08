import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authMiddleware, authController.profile);

export default router;