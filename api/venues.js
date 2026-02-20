import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

let pool;

export default async function handler(req, res) {
  if (!pool) {
    const certDir = path.join(process.cwd(), 'api');
    
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: 3306,
      ssl: {
        // 確保你的 .pem 文件真的在 api/ 資料夾內並已 Git Push
        ca: fs.readFileSync(path.join(certDir, 'server-ca.pem')),
        cert: fs.readFileSync(path.join(certDir, 'client-cert.pem')),
        key: fs.readFileSync(path.join(certDir, 'client-key.pem')),
        rejectUnauthorized: false
      },
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
      enableKeepAlive: true, 
      keepAliveInitialDelay: 10000,
      idleTimeout: 30000,
    });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM venues');
    
    const data = rows.map(row => ({
      ...row,
      images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
      coordinates: typeof row.coordinates === 'string' ? JSON.parse(row.coordinates) : row.coordinates
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: error.message });
  }
}