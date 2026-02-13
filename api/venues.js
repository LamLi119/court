import path from 'path';
import { getPool } from './lib/db.js';
import { sanitizeRow, uploadToImgBB, setCorsHeaders } from './lib/helpers.js';

function getApiFilePath(...segments) {
  return path.join(process.cwd(), 'api', ...segments);
}

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

export default async function handler(req, res) {
  setCorsHeaders(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = getPool();

    if (req.method === 'GET') {
      const [rows] = await pool.execute(
        `SELECT * FROM venues ORDER BY sort_order IS NULL, sort_order ASC, name ASC`
      );
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const row = sanitizeRow(req.body);
      if (row.images && Array.isArray(row.images)) {
        const imageUrls = await Promise.all(
          row.images.map((img) =>
            typeof img === 'string' && img.startsWith('data:') ? uploadToImgBB(img) : img
          )
        );
        row.images = JSON.stringify(imageUrls.filter((url) => url != null));
      }
      const keys = Object.keys(row);
      const values = keys.map((k) => row[k]);
      const placeholders = keys.map(() => '?').join(', ');
      const cols = keys.map((k) => (k === 'sort_order' ? 'sort_order' : `\`${k}\``)).join(', ');
      await pool.execute(`INSERT INTO venues (${cols}) VALUES (${placeholders})`, values);
      const [result] = await pool.execute('SELECT * FROM venues WHERE id = LAST_INSERT_ID()');
      return res.status(201).json(result[0]);
    }
  } catch (err) {
    console.error('api/venues', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
