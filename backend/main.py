from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import search, journal, auth, user, content
from routers import local_bookmarks
from database import init_db
import asyncio

app = FastAPI(title="Quran Life Mirror API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api")
app.include_router(journal.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(user.router, prefix="/api")
app.include_router(content.router, prefix="/api")
app.include_router(local_bookmarks.router, prefix="/api")

# All verse keys used in VERSE_THEMES — pre-warm at startup
ALL_VERSE_KEYS = list(set([
    "2:286","2:155","9:51","13:28","3:173","2:45","2:153","65:3",
    "94:5","94:6","3:139","93:3","84:6","11:88","93:5",
    "2:156","2:157","21:83","12:86","94:1","39:53",
    "50:16","2:186","57:4","58:7","9:40","16:128",
    "4:110","3:135","25:70","66:8","11:114","2:37","7:23","11:90","25:68",
    "51:56","67:2","23:115","3:191","6:162","98:5","2:201",
    "6:116","2:2","10:57","16:64","27:77","17:9",
    "18:10","14:7","2:152","16:18","31:12","76:3","55:13",
    "3:142","29:2","3:134","42:37","7:199","16:126","41:34","2:263",
    "39:10","16:96","103:3","2:261","3:92","9:60","64:16","2:267",
    "4:36","17:23","31:14","46:15","2:177","4:1",
]))

@app.on_event("startup")
async def startup():
    init_db()

@app.on_event("startup")
async def warm_verse_cache():
    """Pre-fetch all verses into memory cache at startup so searches are instant."""
    from services.quran_service import get_verse
    async def fetch_batch():
        batch_size = 8
        for i in range(0, len(ALL_VERSE_KEYS), batch_size):
            batch = ALL_VERSE_KEYS[i:i+batch_size]
            await asyncio.gather(*[get_verse(k) for k in batch], return_exceptions=True)
            await asyncio.sleep(0.3)
        print(f"[cache] Done warming {len(ALL_VERSE_KEYS)} verses.")
    asyncio.create_task(fetch_batch())
    print(f"[startup] Warming {len(ALL_VERSE_KEYS)} verses in background...")

@app.get("/")
async def root():
    return {"status": "Quran Life Mirror API running"}

@app.api_route("/health", methods=["GET", "HEAD"])
async def health():
    return {"status": "ok"}

@app.on_event("startup")
async def keep_warm():
    async def ping():
        while True:
            await asyncio.sleep(840)
            try:
                import httpx
                async with httpx.AsyncClient() as client:
                    await client.get("https://quran-life-mirror-production.up.railway.app/health", timeout=5)
            except:
                pass
    asyncio.create_task(ping())