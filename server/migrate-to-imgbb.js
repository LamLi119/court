import mysql from 'mysql2/promise';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '';
const certFiles = {
    ca: path.join(__dirname, 'server-ca.pem'),
    cert: path.join(__dirname, 'client-cert.pem'),
    key: path.join(__dirname, 'client-key.pem')
};

async function uploadToImgBB(base64String) {
    try {
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
        const formData = new FormData();
        formData.append('image', base64Data);

        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData);
        return response.data.data.url;
    } catch (err) {
        console.error('   ❌ ImgBB 上傳失敗:', err.response?.data?.error?.message || err.message);
        return null;
    }
}

async function migrate() {
    const pool = mysql.createPool({
        host: process.env.MYSQL_HOST || '35.202.128.228',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE || 'courts-db',
        ssl: {
            ca: fs.readFileSync(certFiles.ca),
            cert: fs.readFileSync(certFiles.cert),
            key: fs.readFileSync(certFiles.key),
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🚀 開始從 Cloud SQL 讀取數據...');
        const [venues] = await pool.execute('SELECT id, name, images FROM venues');
        console.log(`統計：共有 ${venues.length} 個場館需要檢查。`);

        for (const venue of venues) {
            let images = venue.images;
            
            // 嘗試解析 JSON
            if (typeof images === 'string') {
                try { images = JSON.parse(images); } catch (e) { continue; }
            }

            if (!Array.isArray(images)) continue;

            const newImageUrls = [];
            let needUpdate = false;

            console.log(`📦 正在處理場館 [${venue.id}] ${venue.name}...`);

            for (let img of images) {
                if (img.startsWith('data:image')) {
                    console.log(`   正在上傳 Base64 圖片到 ImgBB...`);
                    const url = await uploadToImgBB(img);
                    if (url) {
                        newImageUrls.push(url);
                        needUpdate = true;
                    } else {
                        newImageUrls.push(img);
                    }
                } else {
                    newImageUrls.push(img);
                }
            }

            if (needUpdate) {
                const jsonUrls = JSON.stringify(newImageUrls);
                await pool.execute('UPDATE venues SET images = ? WHERE id = ?', [jsonUrls, venue.id]);
                console.log(`   ✅ 更新成功！`);
            } else {
                console.log(`   ⏩ 無需更新 (已是網址或無圖片)`);
            }
        }

        console.log('\n✨ 所有數據搬運完成！你的資料庫現在非常輕量了。');
    } catch (err) {
        console.error('❌ 遷移過程中出錯:', err);
    } finally {
        await pool.end();
    }
}

migrate();