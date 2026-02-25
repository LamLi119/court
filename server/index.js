import path from 'path';
import fs from 'fs';
import express from 'express';
import mysql from 'mysql2/promise';
import axios from 'axios';
import FormData from 'form-data';

const app = express();
app.use(express.json({ limit: '5mb' })); // Increased limit for Base64

let pool;

/** SSL only when cert files exist (e.g. Cloud SQL); otherwise connect without SSL for local MySQL. */
function getSslOptions() {
  const certDir = path.join(process.cwd(), 'api');
  const caPath = path.join(certDir, 'server-ca.pem');
  const certPath = path.join(certDir, 'client-cert.pem');
  const keyPath = path.join(certDir, 'client-key.pem');
  try {
    if (fs.existsSync(caPath) && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      return {
        ca: fs.readFileSync(caPath),
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
        rejectUnauthorized: false
      };
    }
  } catch (_) {
    // ignore
  }
  const ca = process.env.MYSQL_CA;
  const cert = process.env.MYSQL_CERT;
  const key = process.env.MYSQL_KEY;
  if (!ca && !cert && !key) return undefined;
  const ssl = {};
  if (ca) ssl.ca = Buffer.from(ca, 'utf8');
  if (cert) ssl.cert = Buffer.from(cert, 'utf8');
  if (key) ssl.key = Buffer.from(key, 'utf8');
  ssl.rejectUnauthorized = false;
  return ssl;
}

const getPool = () => {
  if (!pool) {
    const ssl = getSslOptions();
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 1,
      ...(ssl && Object.keys(ssl).length ? { ssl } : {})
    });
  }
  return pool;
};

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '';

/** Helper: Upload to ImgBB */
async function uploadToImgBB(base64String) {
  if (!IMGBB_API_KEY || !base64String || !base64String.startsWith('data:')) return base64String;
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
    console.error('ImgBB Upload Error:', err.message);
    return null;
  }
}

/** User-friendly message when DB connection fails (e.g. MySQL not running or wrong MYSQL_HOST). */
function dbErrorMessage(err) {
  if (err && (err.code === 'ECONNREFUSED' || (err.message && err.message.includes('ECONNREFUSED')))) {
    return 'Database connection failed. For local dev: ensure MySQL is running and .env has MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE (or use your Cloud SQL host).';
  }
  return err && err.message ? err.message : 'Database error';
}

function sanitizeRow(body) {
  const allowed = new Set([
    'name', 'description', 'mtrStation', 'mtrExit', 'walkingDistance', 'address',
    'ceilingHeight', 'startingPrice', 'pricing', 'images', 'amenities', 'whatsapp',
    'socialLink', 'orgIcon', 'coordinates', 'sort_order',
  ]);
  const row = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (allowed.has(k)) {
        // Map undefined to null for SQL compatibility
        row[k] = (v === undefined) ? null : v;
    }
  }
  return row;
}

// --- CORS ---
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// --- ROUTES ---

app.get('/api/sports', async (req, res) => {
  try {
    const db = getPool();
    let rows;
    try {
      [rows] = await db.execute('SELECT id, name, name_zh, slug FROM sports ORDER BY name ASC');
    } catch (e) {
      if (e.code === 'ER_BAD_FIELD_ERROR') {
        const [r] = await db.execute('SELECT id, name, slug FROM sports ORDER BY name ASC');
        rows = (r || []).map((s) => ({ ...s, name_zh: null }));
      } else throw e;
    }
    res.json(rows);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.json([]);
    res.status(500).json({ error: dbErrorMessage(err) });
  }
});

function slugify(text) {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

app.post('/api/sports', async (req, res) => {
  try {
    const db = getPool();
    const { name, name_en, name_zh } = req.body || {};
    const n = (name || name_en || '').toString().trim();
    if (!n) return res.status(400).json({ error: 'name or name_en required' });
    const zh = (name_zh || '').toString().trim() || null;
    const slug = slugify(n) || 'sport';
    const [result] = await db.execute(
      'INSERT INTO sports (name, name_zh, slug) VALUES (?, ?, ?)',
      [n, zh, slug]
    );
    return res.status(201).json({ id: result.insertId, name: n, name_zh: zh, slug });
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR' && err.message && err.message.includes('name_zh')) {
      return res.status(500).json({ error: 'Run migration: add name_zh to sports. See scripts/add-sports-name_zh.sql' });
    }
    res.status(500).json({ error: dbErrorMessage(err) });
  }
});

app.get('/api/venues', async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(
      `SELECT * FROM venues ORDER BY sort_order IS NULL, sort_order ASC, name ASC`
    );
    try {
      let sportsRows;
      try {
        [sportsRows] = await db.execute('SELECT id, name, name_zh, slug FROM sports ORDER BY name');
      } catch (_) {
        const [r] = await db.execute('SELECT id, name, slug FROM sports ORDER BY name').catch(() => [[]]);
        sportsRows = (r || []).map((s) => ({ ...s, name_zh: null }));
      }
      const [vsRows] = await db.execute('SELECT venue_id, sport_id, sort_order FROM venue_sports');
      const sportsById = Object.fromEntries((sportsRows || []).map((s) => [s.id, s]));
      const byVenue = {};
      (vsRows || []).forEach((vs) => {
        if (!byVenue[vs.venue_id]) byVenue[vs.venue_id] = [];
        const s = sportsById[vs.sport_id];
        if (s) byVenue[vs.venue_id].push({ sport_id: s.id, name: s.name, name_zh: s.name_zh ?? null, slug: s.slug, sort_order: vs.sort_order });
      });
      rows.forEach((r) => { r.sport_data = byVenue[r.id] || []; });
    } catch (_) {}
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: dbErrorMessage(err) });
  }
});

app.post('/api/venues', async (req, res) => {
  try {
    const db = getPool();
    const row = sanitizeRow(req.body);

    // 1. Process Main Images
    if (row.images && Array.isArray(row.images)) {
      const imageUrls = await Promise.all(
        row.images.map(img => uploadToImgBB(img))
      );
      row.images = JSON.stringify(imageUrls.filter(url => url !== null));
    }

    // 2. Process orgIcon: upload data URLs to ImgBB, cap length for DB
    if (row.orgIcon != null && row.orgIcon !== '') {
      if (row.orgIcon.startsWith('data:')) {
        const uploadedUrl = await uploadToImgBB(row.orgIcon);
        row.orgIcon = uploadedUrl || null;
      }
      if (row.orgIcon && row.orgIcon.length > 2048) row.orgIcon = row.orgIcon.slice(0, 2048);
    }

    if (row.coordinates) row.coordinates = JSON.stringify(row.coordinates);

    const keys = Object.keys(row);
    const values = keys.map((k) => row[k]);
    const placeholders = keys.map(() => '?').join(', ');

    const [result] = await db.execute(
      `INSERT INTO venues (${keys.map(k => `\`${k}\``).join(', ')}) VALUES (${placeholders})`,
      values
    );
    const venueId = result.insertId;
    const sportData = req.body?.sport_data;
    if (Array.isArray(sportData) && sportData.length > 0) {
      try {
        await db.execute('DELETE FROM venue_sports WHERE venue_id = ?', [venueId]);
        for (let i = 0; i < sportData.length; i++) {
          const sid = sportData[i]?.sport_id;
          if (sid != null) await db.execute('INSERT INTO venue_sports (venue_id, sport_id, sort_order) VALUES (?, ?, ?)', [venueId, sid, sportData[i].sort_order ?? i]);
        }
      } catch (_) {}
    }
    if (sportData) row.sport_data = sportData;
    res.status(201).json({ id: venueId, ...row });
  } catch (err) {
    console.error('POST Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/venues/:id', async (req, res) => {
    try {
      const db = getPool();
      const id = parseInt(req.params.id, 10);
      const row = sanitizeRow(req.body);

      if (row.images && Array.isArray(row.images)) {
        const imageUrls = await Promise.all(row.images.map(img => uploadToImgBB(img)));
        row.images = JSON.stringify(imageUrls.filter(u => u !== null));
      }
      if (row.orgIcon != null && row.orgIcon !== '') {
        if (row.orgIcon.startsWith('data:')) {
          const uploadedUrl = await uploadToImgBB(row.orgIcon);
          row.orgIcon = uploadedUrl || null;
        }
        if (row.orgIcon && row.orgIcon.length > 2048) row.orgIcon = row.orgIcon.slice(0, 2048);
      }
      if (row.coordinates) row.coordinates = JSON.stringify(row.coordinates);

      const keys = Object.keys(row);
      const setClause = keys.map((k) => `\`${k}\` = ?`).join(', ');
      const values = [...Object.values(row), id];

      await db.execute(`UPDATE venues SET ${setClause} WHERE id = ?`, values);
      const sportData = req.body?.sport_data;
      if (Array.isArray(sportData)) {
        try {
          await db.execute('DELETE FROM venue_sports WHERE venue_id = ?', [id]);
          for (let i = 0; i < sportData.length; i++) {
            const sid = sportData[i]?.sport_id;
            if (sid != null) await db.execute('INSERT INTO venue_sports (venue_id, sport_id, sort_order) VALUES (?, ?, ?)', [id, sid, sportData[i].sort_order ?? i]);
          }
        } catch (_) {}
      }
      res.json({ id, ...row });
  } catch (err) {
    res.status(500).json({ error: dbErrorMessage(err) });
  }
});

app.patch('/api/venues/order', async (req, res) => {
  try {
    const db = getPool();
    const { orderedIds, sportId } = req.body || {};
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds array required' });
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      if (sportId != null && sportId !== '') {
        const sid = parseInt(sportId, 10);
        if (!Number.isNaN(sid)) {
          for (let i = 0; i < orderedIds.length; i++) {
            await connection.execute(
              'INSERT INTO venue_sports (venue_id, sport_id, sort_order) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE sort_order = ?',
              [orderedIds[i], sid, i, i]
            );
          }
          await connection.commit();
          return res.status(204).send();
        }
      }
      for (let i = 0; i < orderedIds.length; i++) {
        await connection.execute('UPDATE venues SET sort_order = ? WHERE id = ?', [i, orderedIds[i]]);
      }
      await connection.commit();
      return res.status(204).send();
    } finally {
      connection.release();
    }
  } catch (err) {
    res.status(500).json({ error: dbErrorMessage(err) });
  }
});

app.delete('/api/venues/:id', async (req, res) => {
  try {
    const db = getPool();
    const id = req.params.id;
    await db.execute('DELETE FROM venues WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: dbErrorMessage(err) });
  }
});

export default app;