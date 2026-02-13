import { getPool } from '../lib/db.js';
import { setCorsHeaders } from '../lib/helpers.js';

export default async function handler(req, res) {
  setCorsHeaders(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds array required' });
  }

  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (let i = 0; i < orderedIds.length; i++) {
        await connection.execute('UPDATE venues SET sort_order = ? WHERE id = ?', [i, orderedIds[i]]);
      }
      await connection.commit();
      return res.status(204).send();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('api/venues/order', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
