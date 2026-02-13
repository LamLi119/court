import { getPool } from '../lib/db.js';
import { sanitizeRow, setCorsHeaders } from '../lib/helpers.js';

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

export default async function handler(req, res) {
  setCorsHeaders(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = parseInt(req.query.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  if (!['GET', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = getPool();

    if (req.method === 'GET') {
      const [rows] = await pool.execute('SELECT * FROM venues WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).send();
      return res.json(rows[0]);
    }

    if (req.method === 'PUT') {
      const row = sanitizeRow(req.body);
      const keys = Object.keys(row);
      if (keys.length === 0) {
        const [rows] = await pool.execute('SELECT * FROM venues WHERE id = ?', [id]);
        if (Array.isArray(rows) && rows.length === 0) return res.status(404).json({ error: 'Not found' });
        return res.json(rows[0]);
      }
      const setClause = keys.map((k) => (k === 'sort_order' ? 'sort_order' : `\`${k}\``) + ' = ?').join(', ');
      const values = [...Object.values(row), id];
      const [result] = await pool.execute(`UPDATE venues SET ${setClause} WHERE id = ?`, values);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      const [rows] = await pool.execute('SELECT * FROM venues WHERE id = ?', [id]);
      return res.json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const [result] = await pool.execute('DELETE FROM venues WHERE id = ?', [id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      return res.status(204).send();
    }
  } catch (err) {
    console.error('api/venues/[id]', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
