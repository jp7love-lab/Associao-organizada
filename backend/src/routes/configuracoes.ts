import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { getDb } from '../database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { backupDatabase, listBackups } from '../utils/backup';

const router = Router();
router.use(authenticateToken);

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/logos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo_assoc_${req.user!.associacao_id}${ext}`);
  }
});
const uploadLogo = multer({ storage: logoStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_, file, cb) => {
  cb(null, /image\/(jpeg|jpg|png|gif|webp)/.test(file.mimetype));
}});

router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const configs = db.prepare('SELECT chave, valor FROM configuracoes WHERE associacao_id = ?').all([aid]) as any[];
  const assoc = db.prepare('SELECT * FROM associacoes WHERE id = ?').get([aid]) as any;
  const result: Record<string, string> = {};
  configs.forEach((c: any) => { result[c.chave] = c.valor; });
  if (assoc) {
    result['nome_associacao'] = assoc.nome;
    result['cnpj_associacao'] = assoc.cnpj || '';
    result['endereco_associacao'] = assoc.endereco || '';
    result['telefone_associacao'] = assoc.telefone || '';
    result['email_associacao'] = assoc.email || '';
    result['cidade_associacao'] = assoc.cidade || '';
    result['estado_associacao'] = assoc.estado || '';
    result['limite_socios'] = String(assoc.limite_socios || 1000);
    result['logo_url'] = assoc.logo ? `/uploads/logos/${path.basename(assoc.logo)}` : '';
  }
  res.json(result);
});

router.put('/', requireAdmin, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const aid = req.user!.associacao_id;
  const configs = req.body as Record<string, string>;

  db.exec('BEGIN');
  for (const [chave, valor] of Object.entries(configs)) {
    if (chave === 'nome_associacao') {
      db.prepare("UPDATE associacoes SET nome=? WHERE id=?").run([valor, aid]);
    } else if (chave === 'cnpj_associacao') {
      db.prepare("UPDATE associacoes SET cnpj=? WHERE id=?").run([valor, aid]);
    } else if (chave === 'endereco_associacao') {
      db.prepare("UPDATE associacoes SET endereco=? WHERE id=?").run([valor, aid]);
    } else if (chave === 'telefone_associacao') {
      db.prepare("UPDATE associacoes SET telefone=? WHERE id=?").run([valor, aid]);
    } else if (chave === 'email_associacao') {
      db.prepare("UPDATE associacoes SET email=? WHERE id=?").run([valor, aid]);
    } else if (chave === 'cidade_associacao') {
      db.prepare("UPDATE associacoes SET cidade=? WHERE id=?").run([valor, aid]);
    } else if (chave === 'estado_associacao') {
      db.prepare("UPDATE associacoes SET estado=? WHERE id=?").run([valor, aid]);
    } else {
      db.prepare(`
        INSERT INTO configuracoes (associacao_id, chave, valor, updated_at)
        VALUES (?, ?, ?, datetime('now','localtime'))
        ON CONFLICT(associacao_id, chave) DO UPDATE SET valor=excluded.valor, updated_at=excluded.updated_at
      `).run([aid, chave, valor]);
    }
  }
  db.exec('COMMIT');
  res.json({ message: 'Configurações salvas com sucesso' });
});

router.post('/logo', requireAdmin, uploadLogo.single('logo'), (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'Nenhuma imagem enviada' }); return; }
  const db = getDb();
  const aid = req.user!.associacao_id;
  const filePath = req.file.path;
  db.prepare("UPDATE associacoes SET logo=? WHERE id=?").run([filePath, aid]);
  const logoUrl = `/uploads/logos/${path.basename(filePath)}`;
  res.json({ message: 'Logo atualizada com sucesso', logo_url: logoUrl });
});

router.post('/backup', requireAdmin, (req: AuthRequest, res: Response) => {
  const arquivo = backupDatabase();
  arquivo ? res.json({ message: 'Backup realizado com sucesso', arquivo }) : res.status(500).json({ error: 'Erro ao realizar backup' });
});

router.get('/backups', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json(listBackups());
});

router.get('/backup/:arquivo', requireAdmin, (req: AuthRequest, res: Response) => {
  const backupDir = path.join(__dirname, '../../backups');
  const arquivo = path.join(backupDir, req.params.arquivo);
  if (!fs.existsSync(arquivo)) { res.status(404).json({ error: 'Arquivo não encontrado' }); return; }
  res.download(arquivo);
});

export default router;
