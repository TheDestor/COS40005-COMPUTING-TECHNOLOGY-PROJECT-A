import { Router } from 'express';
import { verifyJWT, checkRole } from '../middleware/AuthMiddleware.js';
import { getBackupStatus, runBackup, listBackups, downloadBackup, deleteBackup } from '../controllers/BackupController.js';
import {
  adminBackupStatusLimiter,
  adminBackupRunLimiter,
  adminBackupListLimiter,
  adminBackupDownloadLimiter,
  adminBackupDeleteLimiter,
} from '../middleware/rateLimiter.js';
import { logAdminUsage } from '../middleware/adminMonitor.js';

const backupRouter = Router();

backupRouter.get('/status',
  verifyJWT,
  checkRole(['system_admin']),
  adminBackupStatusLimiter,
  logAdminUsage('admin_backup_status'),
  getBackupStatus
);

backupRouter.post('/run',
  verifyJWT,
  checkRole(['system_admin']),
  adminBackupRunLimiter,
  logAdminUsage('admin_backup_run'),
  runBackup
);

backupRouter.get('/list',
  verifyJWT,
  checkRole(['system_admin']),
  adminBackupListLimiter,
  logAdminUsage('admin_backup_list'),
  listBackups
);

backupRouter.get('/download/:filename',
  verifyJWT,
  checkRole(['system_admin']),
  adminBackupDownloadLimiter,
  logAdminUsage('admin_backup_download'),
  downloadBackup
);

backupRouter.delete('/delete/:filename',
  verifyJWT,
  checkRole(['system_admin']),
  adminBackupDeleteLimiter,
  logAdminUsage('admin_backup_delete'),
  deleteBackup
);

export default backupRouter;