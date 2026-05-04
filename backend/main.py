from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import search, journal, auth, user, content
from routers import local_bookmarks
from database import init_db

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

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/")
async def root():
    return {"status": "Quran Life Mirror API running"}

@app.api_route("/health", methods=["GET", "HEAD"])
async def health():
    return {"status": "ok"}

@app.on_event("startup")
async def keep_warm():
    import asyncio, httpx
    async def ping():
        while True:
            await asyncio.sleep(840)
            try:
                async with httpx.AsyncClient() as client:
                    await client.get("https://quran-life-mirror-backend.onrender.com/health", timeout=5)
            except:
                pass
    asyncio.create_task(ping())

