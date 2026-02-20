# Deploy to Vercel (no local server needed)

After deploying, the app and API run on Vercel. You don’t need to run the Node server locally.

## 1. Deploy

- Connect the repo to Vercel and deploy (Vercel will use `vercel.json` and build the Vite app + API routes).
- **Do not** set `VITE_API_URL` in Vercel (or leave it empty). The frontend will call `/api/*` on the same domain.

## 2. Environment variables (Vercel project → Settings → Environment Variables)

Set these for **Production** (and optionally Preview):

| Variable | Description |
|----------|-------------|
| `MYSQL_HOST` | Cloud SQL host (e.g. `35.202.128.228`) |
| `MYSQL_PORT` | `3306` |
| `MYSQL_USER` | DB user |
| `MYSQL_PASSWORD` | DB password |
| `MYSQL_DATABASE` | DB name (e.g. `courts-db`) |
| `MYSQL_CA` | Full PEM content of `server-ca.pem` (paste the whole file, including `-----BEGIN ...` and `-----END ...`) |
| `MYSQL_CERT` | Full PEM content of `client-cert.pem` |
| `MYSQL_KEY` | Full PEM content of `client-key.pem` |
| `IMGBB_API_KEY` | (Optional) ImgBB API key for image uploads |
| `CORS_ORIGIN` | (Optional) Allowed origin; default `*` |

To get PEM content for `MYSQL_CA` / `MYSQL_CERT` / `MYSQL_KEY`: open each file (e.g. `server/server-ca.pem`), copy everything (including the BEGIN/END lines), and paste into the corresponding Vercel env value. You can paste multi-line as-is.

## 3. Redeploy

After saving env vars, trigger a new deployment (Redeploy from the Vercel dashboard) so the new values are used.

## 4. Local dev without running the Node server

- Run only the frontend: `npm run dev`.
- In `.env`, set `VITE_API_URL` to your Vercel app URL, e.g. `VITE_API_URL=https://your-app.vercel.app`.
- The app will use the deployed API on Vercel for DB data.

## 5. Local dev with the Node server (unchanged)

- In `.env`: `VITE_API_URL=http://localhost:3001`.
- Terminal 1: `npm run server`
- Terminal 2: `npm run dev`
