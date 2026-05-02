from fastapi import APIRouter, Header, HTTPException
from models import JournalEntryCreate, JournalEntryOut
from database import get_db
from typing import List, Optional
import httpx
from pydantic import BaseModel

router = APIRouter()
QURAN_USER_API = "https://api.qurancdn.com/api/v4"

class JournalEntryUpdate(BaseModel):
    personal_note: Optional[str] = None
    mood: Optional[str] = None

async def sync_to_quran_foundation(token: str, verse_key: str, reflection: str):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            await client.post(f"{QURAN_USER_API}/reflections", headers=headers,
                json={"verse_key": verse_key, "body": reflection, "is_public": False})
        except Exception: pass
        try:
            await client.post(f"{QURAN_USER_API}/bookmarks", headers=headers,
                json={"verse_key": verse_key, "key": 1})
        except Exception: pass
        try:
            await client.post(f"{QURAN_USER_API}/streaks/sync", headers=headers)
        except Exception: pass

@router.post("/journal", response_model=JournalEntryOut)
async def save_entry(entry: JournalEntryCreate, authorization: Optional[str] = Header(None)):
    db = get_db()
    cursor = db.execute(
        "INSERT INTO journal (situation, verse_key, arabic_text, translation, reflection, personal_note, mood) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (entry.situation, entry.verse_key, entry.arabic_text, entry.translation, entry.reflection, entry.personal_note or "", entry.mood or "reflective")
    )
    db.commit()
    row = db.execute("SELECT * FROM journal WHERE id = ?", (cursor.lastrowid,)).fetchone()
    db.close()
    if authorization and entry.user_token:
        token = entry.user_token or authorization.replace("Bearer ", "")
        await sync_to_quran_foundation(token, entry.verse_key, entry.reflection)
    return JournalEntryOut(**dict(row))

@router.get("/journal", response_model=List[JournalEntryOut])
async def get_journal():
    db = get_db()
    rows = db.execute("SELECT * FROM journal ORDER BY created_at DESC").fetchall()
    db.close()
    return [JournalEntryOut(**dict(r)) for r in rows]

@router.patch("/journal/{entry_id}", response_model=JournalEntryOut)
async def update_entry(entry_id: int, update: JournalEntryUpdate):
    db = get_db()
    row = db.execute("SELECT * FROM journal WHERE id = ?", (entry_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Entry not found")
    note = update.personal_note if update.personal_note is not None else row["personal_note"]
    mood = update.mood if update.mood is not None else row["mood"]
    db.execute("UPDATE journal SET personal_note = ?, mood = ? WHERE id = ?", (note, mood, entry_id))
    db.commit()
    row = db.execute("SELECT * FROM journal WHERE id = ?", (entry_id,)).fetchone()
    db.close()
    return JournalEntryOut(**dict(row))

@router.delete("/journal/{entry_id}")
async def delete_entry(entry_id: int):
    db = get_db()
    db.execute("DELETE FROM journal WHERE id = ?", (entry_id,))
    db.commit()
    db.close()
    return {"status": "deleted"}
