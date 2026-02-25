import 'dotenv/config';
import app from './index.js';

const PORT = process.env.PORT || 3001;
const host = process.env.MYSQL_HOST || '(not set)';
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`DB host: ${host} (from MYSQL_HOST)`);
});