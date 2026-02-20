import path from 'path';
import fs from 'fs';
import express from 'express';
import mysql from 'mysql2/promise';
import axios from 'axios';
import FormData from 'form-data';

// --- INITIALIZATION ---
const app = express();
app.use(express.json({ limit: '5mb' })); // Increased limit for image handling

// Global pool variable to persist across serverless "warm" starts
let pool;

const getPool = () => {
  if (!pool) {
    // On Vercel, files are usually in the root or a specific folder. 
    // Assuming .pem files are in /api/
    const certDir = path.join(process.cwd(), 'api');
    
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 1, // Crucial for Vercel: 1 connection per instance
      queueLimit: 0,
      ssl: {
        ca: fs.readFileSync(path.join(certDir, 'server-ca.pem')),
        cert: fs.readFileSync(path.join(certDir, 'client-cert.pem')),
        key: fs.readFileSync(path.join(certDir, 'client-key.pem')),
        rejectUnauthorized: false
      }
    });
  }
  return pool;
};

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '';

// --- HELPERS ---
async function uploadToImgBB(base64String) {
  if (!IMGBB_API_KEY) return null;
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
    console.error('ImgBB Error:', err.message);
    return null;
  }
}

function sanitizeRow(body) {
  const allowed = new Set([
    'name', 'description', 'mtrStation', 'mtrExit', 'walkingDistance', 'address',
    'ceilingHeight', 'startingPrice', 'pricing', 'images', 'amenities', 'whatsapp',
    'socialLink', 'orgIcon', 'coordinates', 'sort_order',
  ]);
  const row = {};
  for (const [k, v] of Object.entries(body || {})) {
    // Critical Fix: Change undefined to null for MySQL compatibility
    if (allowed.has(k)) {
        row[k] = (v === undefined) ? null : v;
    }
  }
  return row;
}

// --- CORS (Serverless Style) ---
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// --- ROUTES ---

app.get('/api/venues', async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(
      `SELECT * FROM venues ORDER BY sort_order IS NULL, sort_order ASC, name ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/venues', async (req, res) => {
  try {
    const db = getPool();
    const row = sanitizeRow(req.body);

    if (row.images && Array.isArray(row.images)) {
      const imageUrls = await Promise.all(
        row.images.map(img => img.startsWith('data:') ? uploadToImgBB(img) : img)
      );
      row.images = JSON.stringify(imageUrls.filter(url => url !== null));
    }
    
    // Ensure coordinates is a string
    if (row.coordinates) row.coordinates = JSON.stringify(row.coordinates);

    const keys = Object.keys(row);
    const values = keys.map((k) => row[k]);
    const placeholders = keys.map(() => '?').join(', ');

    const [result] = await db.execute(
      `INSERT INTO venues (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );

    res.status(201).json({ id: result.insertId, ...row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Make sure the ID is being parsed correctly
app.delete('/api/venues/:id', async (req, res) => {
  try {
    const db = getPool();
    const venueId = req.params.id; // This will be "35"

    // If venueId is a string, MySQL usually handles it, 
    // but let's be safe:
    const [result] = await db.execute(
      'DELETE FROM venues WHERE id = ?', 
      [parseInt(venueId, 10)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Venue not found" });
    }

    return res.status(204).end(); // 204 means Success, No Content
  } catch (err) {
    console.error("DELETE CRASH:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// IMPORTANT: Export for Vercel
export default app;