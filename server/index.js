/**
 * Backend API for Courts Finder when using Google Cloud SQL (MySQL).
 * Exposes the same operations as the Supabase client (getVenues, upsertVenue, deleteVenue, updateVenueOrder).
 *
 * Env: MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, CORS_ORIGIN, PORT (default 3001), IMGBB_API_KEY (optional, for Base64 image upload)
 */

import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import mysql from 'mysql2/promise';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

const certFiles = {
  ca: path.join(__dirname, 'server-ca.pem'),
  cert: path.join(__dirname, 'client-cert.pem'),
  key: path.join(__dirname, 'client-key.pem')
};

const missingFiles = [];
for (const [name, filePath] of Object.entries(certFiles)) {
  if (!fs.existsSync(filePath)) {
    missingFiles.push(`${name}: ${filePath}`);
  }
}

if (missingFiles.length > 0) {
  console.error('❌ 缺少以下 SSL 证书文件:');
  missingFiles.forEach(file => console.error(`   - ${file}`));
  console.error('\n请将以下证书文件放置在 server/ 目录下:');
  console.error('   - server-ca.pem');
  console.error('   - client-cert.pem');
  console.error('   - client-key.pem');
  process.exit(1);
}

// MySQL connection pool with SSL
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '35.202.128.228',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'courts-db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    ca: fs.readFileSync(certFiles.ca),
    cert: fs.readFileSync(certFiles.cert),
    key: fs.readFileSync(certFiles.key),
    rejectUnauthorized: false
  }
});

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '';

/** Upload Base64 image to ImgBB and return permanent URL, or null on failure. */
async function uploadToImgBB(base64String) {
  if (!IMGBB_API_KEY) {
    console.error('ImgBB: IMGBB_API_KEY not set in .env');
    return null;
  }
  try {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const formData = new FormData();
    formData.append('image', base64Data);
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      formData,
      { headers: formData.getHeaders() }
    );
    return response.data.data?.url ?? null;
  } catch (err) {
    console.error('ImgBB Upload Error:', err.response?.data || err.message);
    return null;
  }
}

app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  // Allow requests from the configured origin or any localhost origin in development
  const origin = req.headers.origin;
  const allowedOrigin = 
    origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))
      ? origin
      : CORS_ORIGIN;
  
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// GET /api/venues — list all (full row so pins, price, detail, edit work)
app.get('/api/venues', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM venues ORDER BY sort_order IS NULL, sort_order ASC, name ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/venues/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM venues WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).send();
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/venues — insert
app.post('/api/venues', async (req, res) => {
  try {
    const row = sanitizeRow(req.body);

    if (row.images && Array.isArray(row.images)) {
      console.log('正在處理圖片上傳至 ImgBB...');
      const imageUrls = await Promise.all(
        row.images.map(img => img.startsWith('data:') ? uploadToImgBB(img) : img)
      );
      row.images = JSON.stringify(imageUrls.filter(url => url !== null));
    }

    console.log('圖片處理完成，準備寫入資料庫...');
    const keys = Object.keys(row);
    const values = keys.map((k) => row[k]);
    const placeholders = keys.map(() => '?').join(', ');

    const [result] = await pool.execute(
      `INSERT INTO venues (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );

    res.status(201).json({ id: result.insertId, ...row });
  } catch (err) {
    console.error('POST /api/venues Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/venues/:id — update
app.put('/api/venues/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const row = sanitizeRow(req.body);
    const keys = Object.keys(row);
    if (keys.length === 0) {
      const [rows] = await pool.execute('SELECT * FROM venues WHERE id = ?', [id]);
      if (Array.isArray(rows) && rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json(rows[0]);
    }
    const setClause = keys.map((k) => (k === 'sort_order' ? 'sort_order' : `\`${k}\``) + ' = ?').join(', ');
    const values = [...Object.values(row), id];
    const [result] = await pool.execute(
      `UPDATE venues SET ${setClause} WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    const [rows] = await pool.execute('SELECT * FROM venues WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/venues/:id', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/venues/:id
app.delete('/api/venues/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const [result] = await pool.execute('DELETE FROM venues WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/venues/:id', err);
    res.status(500).json({ error: err.message || 'Failed to delete venue from Cloud SQL' });
  }
});

// PATCH /api/venues/order — body: { orderedIds: number[] }
app.patch('/api/venues/order', async (req, res) => {
  try {
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds array required' });
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (let i = 0; i < orderedIds.length; i++) {
        await connection.execute('UPDATE venues SET sort_order = ? WHERE id = ?', [i, orderedIds[i]]);
      }
      await connection.commit();
      res.status(204).send();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('PATCH /api/venues/order', err);
    res.status(500).json({ error: err.message || 'Failed to update venue order in Cloud SQL' });
  }
});

function sanitizeRow(body) {
  const allowed = new Set([
    'name', 'description', 'mtrStation', 'mtrExit', 'walkingDistance', 'address',
    'ceilingHeight', 'startingPrice', 'pricing', 'images', 'amenities', 'whatsapp',
    'socialLink', 'orgIcon', 'coordinates', 'sort_order',
  ]);
  const row = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (allowed.has(k) && v !== undefined) row[k] = v;
  }
  return row;
}

async function start() {
  if (!process.env.MYSQL_PASSWORD) {
    console.error('❌ MYSQL_PASSWORD is required. Set it in .env file.');
    process.exit(1);
  }
  try {
    await pool.execute('SELECT 1');
    console.log('🔒 Database connected to Cloud SQL (MySQL) via SSL.');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Cloud SQL API listening on http://localhost:${PORT}`);
    console.log(`CORS configured for: ${CORS_ORIGIN} (also accepts any localhost origin)`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
