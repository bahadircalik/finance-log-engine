require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const { Client } = require('@elastic/elasticsearch');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Elasticsearch Bağlantısı
const esClient = new Client({
  node: process.env.ELASTIC_NODE,
  auth: {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD
  }
});

// 🔒 Kimlik Doğrulama Endpoint'i (Login)
app.post('/login', (express.json()), (req, res) => {
  const { username, password } = req.body;

  // Üretim ortamı standart giriş doğrulaması
  if (username === 'admin' && password === 'ProductionPassword2026!') {
    const token = jwt.sign({ role: 'api_operator' }, process.env.JWT_SECRET, { expiresIn: '15m' });
    return res.json({ status: 'success', token: `Bearer ${token}` });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

// 🛡️ JWT Doğrulama Ara Yazılımı (Middleware)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Security token missing' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Security token invalid or expired' });
    req.user = user;
    next();
  });
};

// 📥 Finansal Veri Kabul Noktası (POST /)
app.post('/', authenticateToken, async (req, res) => {
  const data = req.body;
  
  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Payload cannot be empty' });
  }

  const errors = [];

  // 1. Kademe: Alan Varlık Kontrolü (Mandatory Field Validation)
  const requiredFields = ['txn_id', 'op', 'amt', 'curr', 'bank', 'store', 'mcc', 'city', 'lat', 'lon', 'auth', 'status', 'user'];
  requiredFields.forEach(field => {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`missing_field_${field}`);
    }
  });

  // 2. Kademe: Tip Kontrolü (Data Type Validation)
  if (data.amt !== undefined && typeof data.amt !== 'number') errors.push('invalid_type_amt');
  if (data.mcc !== undefined && typeof data.mcc !== 'number') errors.push('invalid_type_mcc');
  if (data.lat !== undefined && typeof data.lat !== 'number') errors.push('invalid_type_lat');
  if (data.lon !== undefined && typeof data.lon !== 'number') errors.push('invalid_type_lon');

  // 3. Kademe: Coğrafi Sınır Kontrolü (Geo Bounds Validation)
  if (typeof data.lat === 'number' && (data.lat < -90 || data.lat > 90)) errors.push('out_of_bounds_lat');
  if (typeof data.lon === 'number' && (data.lon < -180 || data.lon > 180)) errors.push('out_of_bounds_lon');

  // 4. Kademe: Standart Format Kontrolü (ISO Currency Code Validation)
  if (data.curr && (typeof data.curr !== 'string' || data.curr.trim().length !== 3)) {
    errors.push('invalid_currency_format');
  }

  // 🛑 KARANTİNA SENARYOSU: Herhangi bir validasyon hatası varsa
  if (errors.length > 0) {
    const quarantinedPayload = {
      ...data,
      received_at: new Date().toISOString(),
      validation_errors: errors,
      tags: ['quarantined_transaction', ...errors]
    };

    try {
      await esClient.index({
        index: 'transactions-quarantined',
        document: quarantinedPayload
      });
      return res.status(202).json({ status: 'quarantined', message: 'Data failed validation and was sent to quarantine index.' });
    } catch (esErr) {
      return res.status(500).json({ error: 'Database pipeline error', detail: esErr.message });
    }
  }

  // 🟢 TEMİZ VERİ SENARYOSU: Tüm testlerden başarıyla geçtiyse
  const cleanPayload = {
    ...data,
    received_at: new Date().toISOString(),
    location: {
      lat: data.lat,
      lon: data.lon
    },
    tags: ['validated_transaction']
  };

  // Dolandırıcılık ve Risk Analizi (Fraud & High Value Detection)
  if (data.amt > 15000) {
    cleanPayload.tags.push('high_value_transaction', 'security_review_required');
  }

  try {
    await esClient.index({
      index: 'transactions-validated',
      document: cleanPayload
    });
    return res.status(201).json({ status: 'success', message: 'Data verified and saved to production index.' });
  } catch (esErr) {
    return res.status(500).json({ error: 'Database pipeline error', detail: esErr.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Professional Finance Log Engine running securely on port ${PORT}`);
});
