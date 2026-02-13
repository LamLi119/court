/**
 * Shared MySQL pool for Vercel serverless.
 * Uses env: MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE,
 * and for SSL: MYSQL_CA, MYSQL_CERT, MYSQL_KEY (PEM string content, or leave empty to skip client cert).
 */
import mysql from 'mysql2/promise';

let pool = null;

function getSslOptions() {
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

export function getPool() {
  if (pool) return pool;
  const ssl = getSslOptions();
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '35.202.128.228',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'courts-db',
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0,
    ...(ssl && Object.keys(ssl).length ? { ssl } : {}),
  });
  return pool;
}
