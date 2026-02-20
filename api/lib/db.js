/**
 * Shared MySQL pool for Vercel serverless.
 * Uses env: MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE.
 * SSL: prefers cert files in api/ (server-ca.pem, client-cert.pem, client-key.pem);
 *      fallback to env MYSQL_CA, MYSQL_CERT, MYSQL_KEY (PEM string content).
 */
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

let pool = null;

function getSslOptions() {
  // Prefer cert files in api/ (same as api/venues.js) so [id].js and venues.js behave the same
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
        rejectUnauthorized: false,
      };
    }
  } catch (_) {
    // ignore, fall back to env
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

export function getPool() {
  if (pool) return pool;
  const ssl = getSslOptions();
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
    ...(ssl && Object.keys(ssl).length ? { ssl } : {}),
  });
  return pool;
}
