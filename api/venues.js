import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// --- DATABASE CONNECTION POOL ---
// We define the pool outside the handler to reuse it across warm invocations
let pool;

const getPool = () => {
  if (!pool) {
    const certDir = path.join(process.cwd(), 'api');
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: 3306,
      ssl: {
        ca: fs.readFileSync(path.join(certDir, 'server-ca.pem')),
        cert: fs.readFileSync(path.join(certDir, 'client-cert.pem')),
        key: fs.readFileSync(path.join(certDir, 'client-key.pem')),
        rejectUnauthorized: false
      },
      waitForConnections: true,
      connectionLimit: 1, // Critical for Vercel: avoids "too many connections"
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    });
  }
  return pool;
};

// --- HELPER: IMGBB UPLOAD ---
async function uploadToImgBB(base64Image) {
  try {
    const body = new FormData();
    // Remove the data:image/...;base64, prefix
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    body.append('image', cleanBase64);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
      method: 'POST',
      body
    });
    const result = await response.json();
    return result.data.url;
  } catch (error) {
    console.error('ImgBB Upload Failed:', error);
    return null;
  }
}

// --- MAIN HANDLER ---
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getPool();

  try {
    // 1. GET ALL VENUES
    if (req.method === 'GET') {
      const [rows] = await db.execute('SELECT * FROM venues ORDER BY id DESC');
      
      // Parse JSON strings back to arrays/objects if they exist
      const formatted = rows.map(row => ({
        ...row,
        images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
        coordinates: typeof row.coordinates === 'string' ? JSON.parse(row.coordinates) : row.coordinates
      }));
      
      return res.status(200).json(formatted);
    }

    // 2. CREATE NEW VENUE (POST)
    if (req.method === 'POST') {
      const data = req.body;
      console.log('Incoming POST data:', data.name);

      // Handle Image Uploads to ImgBB first
      let imageUrls = [];
      if (data.images && Array.isArray(data.images)) {
        console.log('Processing images...');
        imageUrls = await Promise.all(
          data.images.map(img => img.startsWith('data:') ? uploadToImgBB(img) : img)
        );
        imageUrls = imageUrls.filter(url => url !== null);
      }

      const query = `
        INSERT INTO venues (name, address, type, price, rating, reviews, coordinates, images, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        data.name,
        data.address,
        data.type,
        data.price,
        data.rating || 0,
        data.reviews || 0,
        JSON.stringify(data.coordinates || {}),
        JSON.stringify(imageUrls),
        data.description || ''
      ];

      // THE CRITICAL AWAIT: Ensuring DB saves before function ends
      const [result] = await db.execute(query, values);
      console.log('Database saved successfully, ID:', result.insertId);

      return res.status(201).json({ id: result.insertId, ...data, images: imageUrls });
    }

    // 3. DELETE VENUE
    if (req.method === 'DELETE') {
      const { id } = req.query; // For URLs like /api/venues?id=123
      // If your URL is /api/venues/123, you might need to parse req.url
      
      if (!id || id === 'undefined') {
        return res.status(400).json({ error: 'Missing or invalid ID' });
      }

      await db.execute('DELETE FROM venues WHERE id = ?', [id]);
      return res.status(200).json({ message: 'Deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Server Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}