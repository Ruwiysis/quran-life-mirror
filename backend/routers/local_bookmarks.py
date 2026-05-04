from fastapi import APIRouter, HTTPException
import sqlite3
from datetime import datetime
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/local", tags=["local"])

DB_PATH = "./journal.db"

class LocalBookmark(BaseModel):
    verse_key: str
    created_at: str = ""

def ensure_table():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        verse_key TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(verse_key)
    )""")
    conn.commit()
    conn.close()

ensure_table()

@router.post("/bookmark")
async def create_local_bookmark(bookmark: LocalBookmark):
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO bookmarks (verse_key, created_at) VALUES (?, ?)",
            (bookmark.verse_key, bookmark.created_at or datetime.now().isoformat())
        )
        conn.commit()
        return {"id": cursor.lastrowid, "verse_key": bookmark.verse_key, "created_at": bookmark.created_at}
    finally:
        conn.close()

@router.get("/bookmarks")
async def get_local_bookmarks() -> List[LocalBookmark]:
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, verse_key, created_at FROM bookmarks ORDER BY created_at DESC")
        return [{"id": row[0], "verse_key": row[1], "created_at": row[2]} for row in cursor.fetchall()]
    finally:
        conn.close()

@router.delete("/bookmark/{bookmark_id}")
async def delete_local_bookmark(bookmark_id: int):
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM bookmarks WHERE id = ?", (bookmark_id,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Bookmark not found")
        return {"message": "Deleted"}
    finally:
        conn.close()

