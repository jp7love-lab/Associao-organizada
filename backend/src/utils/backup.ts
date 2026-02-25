import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/amfac.db');
const BACKUP_DIR = path.join(__dirname, '../../backups');

export function backupDatabase(): string | null {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = path.join(BACKUP_DIR, `amfac_backup_${timestamp}.db`);
    fs.copyFileSync(DB_PATH, backupFile);

    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.db'))
      .sort()
      .reverse();

    if (backups.length > 30) {
      backups.slice(30).forEach(f => fs.unlinkSync(path.join(BACKUP_DIR, f)));
    }

    console.log(`Backup criado: ${backupFile}`);
    return path.basename(backupFile);
  } catch (err) {
    console.error('Erro ao criar backup:', err);
    return null;
  }
}

export function listBackups(): Array<{ arquivo: string; tamanho: number; data: string }> {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .sort()
    .reverse()
    .map(f => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        arquivo: f,
        tamanho: stats.size,
        data: stats.mtime.toISOString()
      };
    });
}
