import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import cron from 'node-cron';
import { initDatabase } from './database';
import authRoutes from './routes/auth';
import associacoesRoutes from './routes/associacoes';
import associadosRoutes from './routes/associados';
import mensalidadesRoutes from './routes/mensalidades';
import relatoriosRoutes from './routes/relatorios';
import configuracoesRoutes from './routes/configuracoes';
import denunciasRoutes from './routes/denuncias';
import avaliacoesRoutes from './routes/avaliacoes';
import { backupDatabase } from './utils/backup';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/associacoes', associacoesRoutes);
app.use('/api/associados', associadosRoutes);
app.use('/api/mensalidades', mensalidadesRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/configuracoes', configuracoesRoutes);
app.use('/api/denuncias', denunciasRoutes);
app.use('/api/avaliacoes', avaliacoesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'AMFAC Multi-Tenant', version: '2.0.0' });
});

// Rota para download do APK com MIME type correto
app.get('/download/amfac.apk', (req, res) => {
  const apkPath = path.join(process.cwd(), 'amfac.apk');
  if (!fs.existsSync(apkPath)) {
    return res.status(404).json({ error: 'APK não encontrado' });
  }
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="AMFAC.apk"');
  res.sendFile(apkPath);
});

// Página de download estilizada
app.get('/instalar', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Instalar AMFAC</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; background: linear-gradient(135deg,#1a6b3a,#2d9e5f); min-height:100vh; display:flex; align-items:center; justify-content:center; }
    .card { background:#fff; border-radius:20px; padding:40px 32px; max-width:380px; width:90%; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,0.3); }
    .logo { font-size:60px; margin-bottom:16px; }
    h1 { color:#1a6b3a; font-size:24px; margin-bottom:8px; }
    p { color:#666; font-size:14px; margin-bottom:24px; line-height:1.6; }
    .btn { display:block; background:linear-gradient(135deg,#1a6b3a,#2d9e5f); color:#fff; text-decoration:none; padding:16px 24px; border-radius:12px; font-size:18px; font-weight:bold; margin-bottom:16px; }
    .btn:hover { opacity:0.9; }
    .steps { background:#f0faf4; border-radius:12px; padding:16px; text-align:left; }
    .steps p { color:#333; margin-bottom:6px; font-size:13px; }
    .step { display:flex; gap:10px; align-items:flex-start; margin-bottom:10px; }
    .step span { background:#1a6b3a; color:#fff; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; flex-shrink:0; margin-top:1px; }
    .warn { background:#fff8e1; border:1px solid #f0c040; border-radius:8px; padding:12px; margin-top:16px; font-size:12px; color:#7a6000; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🌿</div>
    <h1>AMFAC</h1>
    <p>Associação de Moradores<br>Fazenda Cachoeirinha</p>
    <a href="/download/amfac.apk" class="btn">⬇️ Baixar App Android</a>
    <div class="steps">
      <p><strong>Como instalar:</strong></p>
      <div class="step"><span>1</span><p>Toque em "Baixar App Android" acima</p></div>
      <div class="step"><span>2</span><p>Quando o Chrome perguntar, toque em <strong>Abrir</strong></p></div>
      <div class="step"><span>3</span><p>Se aparecer aviso de segurança, toque em <strong>Configurações → Permitir</strong></p></div>
      <div class="step"><span>4</span><p>Toque em <strong>Instalar</strong> e aguarde</p></div>
    </div>
    <div class="warn">⚠️ Abra este link no <strong>Google Chrome</strong> do celular para garantir o download correto.</div>
  </div>
</body>
</html>`);
});

cron.schedule('0 2 * * *', () => {
  backupDatabase();
  console.log('Backup automático realizado');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║   Associação Organizada                       ║
  ║   Gestão Inteligente para Associações         ║
  ║   Servidor rodando na porta ${PORT}              ║
  ╚═══════════════════════════════════════════════╝
  `);
});

export default app;
