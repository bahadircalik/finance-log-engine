const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const port = 3000;

const esClient = new Client({
  node: 'http://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'ProductionPassword2026!'
  }
});

const JWT_SECRET = 'BahoCorpSecretKeyCustom';

app.post('/login', (req, res) => {
  console.log('👉 [LOGIN] Giriş isteği geldi.');
  const { username, password } = req.body;
  if (username === 'admin' && password === 'ProductionPassword2026!') {
    const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ status: 'success', token: `Bearer ${token}` });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

app.post('/', authenticateToken, async (req, res) => {
  const data = req.body;
  
  // 🔍 CASUS LOG: Postman'den o an gelen verinin ham halini terminale basıyoruz!
  console.log('\n🚨 --- POSTMAN\'DEN SUNUCUYA GELEN HAM PAKET --- 🚨');
  console.log(JSON.stringify(data, null, 2));
  console.log('--------------------------------------------------\n');

  // Gümrük Kontrolü
  if (!data.txn_id || !data.amt || !data.user || !data.bank) {
    console.log('🛑 [FİLTRE] Eksik alan yakalandı! Karantina indeksine gönderiliyor...');
    try {
      await esClient.index({
        index: 'transactions-quarantine',
        document: {
          ...data,
          error_reason: 'Missing mandatory fields',
          quarantined_at: new Date().toISOString()
        }
      });
      return res.json({ status: 'quarantined', message: 'Data failed validation and was sent to quarantine index.' });
    } catch (qErr) {
      return res.status(500).json({ error: 'Quarantine failure' });
    }
  }

  // Başarı Senaryosu
  console.log('🟢 [FİLTRE] Paket temiz. Ana üretim indeksine yazılıyor...');
  try {
    await esClient.index({
      index: 'transactions-validated',
      document: {
        ...data,
        received_at: new Date().toISOString()
      }
    });
    res.json({ status: 'success', message: 'Data verified and saved to production index.' });
  } catch (esErr) {
    res.status(500).json({ error: 'Database error', detail: esErr.message });
  }
});

app.listen(port, () => {
  console.log(`\n🚀 Professional Finance Log Engine running securely on port ${port}`);
});
