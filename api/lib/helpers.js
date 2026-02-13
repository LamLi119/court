import axios from 'axios';
import FormData from 'form-data';

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '';

export function sanitizeRow(body) {
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

export async function uploadToImgBB(base64String) {
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
    console.error('ImgBB Upload Error:', err.response?.data || err.message);
    return null;
  }
}

export function setCorsHeaders(res, req) {
  const origin = req.headers?.origin;
  const allow = origin || process.env.CORS_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}
