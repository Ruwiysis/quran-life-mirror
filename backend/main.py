from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import search, journal, auth, user
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

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/")
async def root():
    return {"status": "Quran Life Mirror API running"}

@app.get("/health")
async def health():
    return {"status": "ok"}

