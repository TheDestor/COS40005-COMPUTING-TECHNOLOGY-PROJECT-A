import { Router } from 'express';
import { verifyJWT, checkRole } from '../middleware/AuthMiddleware.js';
import { getBackupStatus, runBackup, listBackups, downloadBackup } from '../controllers/BackupController.js';

const backupRouter = Router();

backupRouter.get('/status', verifyJWT, checkRole(['system_admin']), getBackupStatus);
backupRouter.post('/run', verifyJWT, checkRole(['system_admin']), runBackup);
backupRouter.get('/list', verifyJWT, checkRole(['system_admin']), listBackups);
backupRouter.get('/download/:filename', verifyJWT, checkRole(['system_admin']), downloadBackup);

export default backupRouter;