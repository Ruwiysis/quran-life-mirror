# Deployment Guide — Quran Life Mirror

Complete guide to deploy backend + frontend so you have a live demo URL for submission.

---

## Option A — Railway (Recommended for Backend)

Railway is the easiest way to deploy a Python FastAPI backend with a database. Free tier available.

### Steps

1. **Create account** at https://railway.app

2. **Install Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

3. **Deploy backend**
```bash
cd backend
railway init          # creates new project
railway up            # deploys
```

4. **Set environment variable** in Railway dashboard:
   - Go to your project → Variables
   - Add: `ANTHROPIC_API_KEY` = your key

5. **Get your backend URL** — Railway gives you something like:
   `https://quran-life-mirror-production.up.railway.app`

6. **Test it:**
```bash
curl https://your-railway-url.up.railway.app/health
# Should return: {"status": "ok"}
```

---

## Option B — Render (Backend Alternative)

1. Push code to GitHub (see GitHub section below)
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable: `ANTHROPIC_API_KEY`
6. Deploy

---

## Option C — Vercel (Frontend)

### Steps

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Update API URL in frontend**

Before deploying frontend, update the API base URL. In `frontend/src/pages/Home.js` and `Journal.js`, axios calls use `/api/...` which works locally via proxy. For production, set an environment variable:

Create `frontend/.env.production`:
```
REACT_APP_API_URL=https://your-railway-url.up.railway.app
```

Then in `Home.js` and `Journal.js`, replace:
```js
axios.post('/api/search', ...)
```
with:
```js
axios.post(`${process.env.REACT_APP_API_URL}/api/search`, ...)
```

3. **Deploy**
```bash
cd frontend
npm run build
vercel --prod
```

4. Your frontend URL: `https://quran-life-mirror.vercel.app`

---

## GitHub Setup

### Push to GitHub

```bash
# In the root quran-life-mirror/ folder:
git init
git add .
git commit -m "Initial commit — Quran Life Mirror"

# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/quran-life-mirror.git
git branch -M main
git push -u origin main
```

### .gitignore (already included)

Make sure these are ignored:
```
backend/.env
backend/journal.db
backend/venv/
frontend/node_modules/
frontend/build/
```

---

## Submission Checklist

Once deployed, you have everything needed:

- Live demo URL: your Vercel frontend URL
- GitHub repo: your GitHub URL
- Record a 2–3 minute demo video showing:
  1. Type a situation (e.g. "I feel like nothing I do matters")
  2. See 3 verses returned with Arabic, translation, reflection
  3. Save one to journal
  4. Open Journal page and show the entry

Submit at: https://tally.so/r/PdEWAP before May 20, 2026.

---

## Production Tips

- **PostgreSQL on Railway:** In Railway dashboard, add a PostgreSQL plugin. Then update `database.py` to use `DATABASE_URL` env var with SQLAlchemy.
- **CORS:** The backend already allows all origins. For production, restrict to your Vercel domain.
- **Rate limiting:** Add `slowapi` to prevent abuse on the search endpoint.
