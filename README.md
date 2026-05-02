# Quran Life Mirror 🌙

> Describe a life situation or emotion — discover Quranic verses that speak directly to where you are.

Built for the **Quran Foundation Hackathon 2026** — $10,000 Prize Pool.

---

## ✅ COMPLETE BEGINNER SETUP GUIDE

Follow every step exactly, in order.

---

### STEP 1 — Unzip the file

Double-click `quran_life_mirror_v3.zip` to unzip it.
You will see a folder called `quran-life-mirror`.

---

### STEP 2 — Open Terminal

- **Mac:** Press `Cmd + Space`, type `Terminal`, press Enter
- **Windows:** Press `Windows key`, type `cmd`, press Enter
- **Linux:** Right-click desktop → Open Terminal

---

### STEP 3 — Navigate into the project folder

Type this exactly (replace `Downloads` with wherever you unzipped it):

**Mac/Linux:**
```bash
cd ~/Downloads/quran-life-mirror
```

**Windows:**
```bash
cd %USERPROFILE%\Downloads\quran-life-mirror
```

---

### STEP 4 — Check Python is installed

```bash
python3 --version
```

You should see something like `Python 3.11.0`.
If you get "command not found", download Python from https://python.org/downloads

---

### STEP 5 — Check Node.js is installed

```bash
node --version
```

You should see something like `v20.0.0`.
If you get "command not found", download Node from https://nodejs.org (click the LTS version)

---

### STEP 6 — Start the Backend

```bash
cd backend
python3 -m venv venv
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

Then:
```bash
pip3 install -r requirements.txt
```

Your API key is already set. Just run:
```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO: Uvicorn running on http://127.0.0.1:8000
```

✅ Leave this terminal open!

---

### STEP 7 — Start the Frontend (open a NEW terminal window)

Navigate back to the project root:

**Mac/Linux:**
```bash
cd ~/Downloads/quran-life-mirror/frontend
```

**Windows:**
```bash
cd %USERPROFILE%\Downloads\quran-life-mirror\frontend
```

Then:
```bash
npm install
npm start
```

Your browser will open automatically at http://localhost:3000 🎉

---

### STEP 8 — Use the app!

1. Type how you're feeling in the text box
2. Click "Find Verses ✦"
3. Read the verses, reflections, and educational facts
4. Click "+ Save to Journal" to save entries
5. Click "Journal" in the top nav to see your saved entries
6. Click "العربية" button to switch to Arabic

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python + FastAPI |
| Semantic Search | Quran MCP (mcp.quran.ai) |
| AI Reflection | Gemini API (gemini-2.0-flash) |
| Frontend | React |
| Database | SQLite |

---

## APIs Used

**Content APIs:** Quran MCP · Translation API · Audio API

**User APIs:** Post/Reflections · Bookmarks · Streak Tracking · Activity & Goals

---

## Environment Variables

```env
GEMINI_API_KEY=your_key_here
```

Get a free key at: https://aistudio.google.com/app/apikey

---

## Deployment

See `docs/DEPLOYMENT.md` for Railway + Vercel publishing guide.

---

## License

MIT — Quran Foundation Hackathon 2026.
