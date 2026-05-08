from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
import httpx, os, sqlite3
from datetime import datetime
from dotenv import load_dotenv

from services.quran_service import get_verse

load_dotenv()

router = APIRouter()

QF_API_BASE = os.getenv("QF_API_BASE")
QF_CLIENT_ID = os.getenv("QF_CLIENT_ID", "")

DB_PATH = "./journal.db"


class BookmarkData(BaseModel):
    verse_key: str


class NoteData(BaseModel):
    verse_key: str
    note_text: str
    situation: Optional[str] = None


class StreakInfo(BaseModel):
    current_streak: int = 0
    longest_streak: int = 0
    total_days: int = 0


def get_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    return authorization.replace("Bearer ", "").strip()


def qf_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "x-auth-token": token,
        "x-client-id": QF_CLIENT_ID,
        "Content-Type": "application/json",
    }


def ensure_tables():
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            verse_key TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, verse_key)
        )"""
    )
    conn.commit()
    conn.close()


ensure_tables()


def get_user_id_from_token(token: str) -> str:
    """Best-effort partition key for local fallback bookmarks.

    Ideally this should come from a stable user/sub claim in the token.
    To avoid adding dependencies, we fallback to a deterministic prefix.
    """

    return token[:24]


@router.post("/user/bookmark")
async def create_bookmark(
    data: BookmarkData,
    authorization: Optional[str] = Header(None),
):
    token = get_token(authorization)
    user_id = get_user_id_from_token(token)

    # Try QF API first
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"{QF_API_BASE}/auth/api/v1/bookmarks",
                headers=qf_headers(token),
                json={"verse_key": data.verse_key},
            )
            print(f"QF Bookmark: {r.status_code} {r.text[:200]}")

            if r.status_code in [200, 201]:
                result = r.json()
                return {
                    "id": str(result.get("id", data.verse_key)),
                    "verse_key": data.verse_key,
                    "created_at": result.get("created_at", ""),
                }
    except Exception as e:
        # fall back to local
        print(f"QF Bookmark error (falling back to local): {e}")

    # Fallback to local
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            """INSERT OR IGNORE INTO bookmarks (user_id, verse_key, created_at)
               VALUES (?, ?, ?)""",
            (user_id, data.verse_key, datetime.now().isoformat()),
        )
        conn.commit()

        # If ignored due to UNIQUE constraint, lastrowid might be 0.
        bookmark_id = cursor.lastrowid
        if not bookmark_id:
            row = cursor.execute(
                "SELECT id FROM bookmarks WHERE user_id = ? AND verse_key = ?",
                (user_id, data.verse_key),
            ).fetchone()
            bookmark_id = row[0] if row else None

        conn.close()

        return {
            "id": str(bookmark_id) if bookmark_id else "",
            "verse_key": data.verse_key,
            "created_at": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/bookmarks")
async def get_bookmarks(authorization: Optional[str] = Header(None)):
    token = get_token(authorization)
    user_id = get_user_id_from_token(token)

    # Try QF API first
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{QF_API_BASE}/auth/api/v1/bookmarks",
                headers=qf_headers(token),
            )
            print(f"QF Get bookmarks: {r.status_code} ({r.text[:300]})")

            if r.status_code == 200:
                data = r.json()
                bookmarks = data if isinstance(data, list) else data.get(
                    "bookmarks", data.get("data", [])
                )
                return [
                    {
                        "id": str(b.get("id", "")),
                        "verse_key": b.get("verse_key", ""),
                        "created_at": b.get("created_at", ""),
                    }
                    for b in bookmarks
                ]
    except Exception as e:
        print(f"QF bookmarks error (falling back to local): {e}")

    # Fallback to local (user-partitioned)
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            """SELECT id, verse_key, created_at
               FROM bookmarks
               WHERE user_id = ?
               ORDER BY created_at DESC""",
            (user_id,),
        )
        rows = cursor.fetchall()
        conn.close()

        return [
            {"id": str(r[0]), "verse_key": r[1], "created_at": r[2]}
            for r in rows
        ]
    except Exception as e:
        print(f"Local bookmarks error: {e}")
        return []


@router.get("/user/bookmarks-with-verses")
async def get_bookmarks_with_verses(authorization: Optional[str] = Header(None)):
    """Get bookmarks with full verse data in one call — avoids N+1 queries"""

    import asyncio

    token = get_token(authorization)
    user_id = get_user_id_from_token(token)

    # Try QF API first
    bookmarks: list = []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{QF_API_BASE}/auth/api/v1/bookmarks",
                headers=qf_headers(token),
            )
            if r.status_code == 200:
                data = r.json()
                bookmarks = data if isinstance(data, list) else data.get(
                    "bookmarks", data.get("data", [])
                )
    except Exception as e:
        print(f"QF bookmarks-with-verses error (will use local): {e}")

    # Fallback to local if QF has none or failed
    if not bookmarks:
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                """SELECT id, verse_key, created_at
                   FROM bookmarks
                   WHERE user_id = ?
                   ORDER BY created_at DESC""",
                (user_id,),
            )
            rows = cursor.fetchall()
            conn.close()

            bookmarks = [
                {"id": str(r[0]), "verse_key": r[1], "created_at": r[2]}
                for r in rows
            ]
        except Exception as e:
            print(f"Local bookmarks-with-verses error: {e}")
            return []

    verse_keys = [b.get("verse_key") for b in bookmarks]
    verses = {}

    async def fetch_verse(key: str):
        try:
            verse = await get_verse(key)
            return key, verse
        except Exception as e:
            print(f"Verse fetch error for {key}: {e}")
            return key, None

    tasks = [fetch_verse(key) for key in verse_keys]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for result in results:
        if isinstance(result, tuple):
            key, verse = result
            if verse:
                verses[key] = verse

    return [
        {
            "id": str(b.get("id", "")),
            "verse_key": b.get("verse_key", ""),
            "created_at": b.get("created_at", ""),
            "verse": verses.get(b.get("verse_key")),
        }
        for b in bookmarks
    ]


@router.delete("/user/bookmark/{bookmark_id}")
async def delete_bookmark(
    bookmark_id: str,
    authorization: Optional[str] = Header(None),
):
    token = get_token(authorization)
    user_id = get_user_id_from_token(token)

    # Try QF delete first
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.delete(
                f"{QF_API_BASE}/auth/api/v1/bookmarks/{bookmark_id}",
                headers=qf_headers(token),
            )
            if r.status_code in [200, 204]:
                return {"message": "Deleted"}
    except Exception as e:
        print(f"QF delete error (falling back to local): {e}")

    # Local delete (protect with user_id)
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute(
            "DELETE FROM bookmarks WHERE id = ? AND user_id = ?",
            (bookmark_id, user_id),
        )
        conn.commit()
        conn.close()
        return {"message": "Deleted locally"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/user/note")
async def create_note(
    data: NoteData,
    authorization: Optional[str] = Header(None),
):
    token = get_token(authorization)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"{QF_API_BASE}/auth/api/v1/notes",
                headers=qf_headers(token),
                json={
                    "verse_key": data.verse_key,
                    "body": data.note_text,
                    "ranges": [data.verse_key],
                },
            )
            print(f"Note response: {r.status_code} {r.text[:200]}")
            if r.status_code in [200, 201]:
                result = r.json()
                return {
                    "id": str(result.get("id", "")),
                    "verse_key": data.verse_key,
                    "note_text": data.note_text,
                    "created_at": result.get("created_at", ""),
                }
    except Exception as e:
        print(f"Note error: {e}")

    return {
        "id": "local",
        "verse_key": data.verse_key,
        "note_text": data.note_text,
        "created_at": datetime.now().isoformat(),
    }


@router.get("/user/notes")
async def get_notes(authorization: Optional[str] = Header(None)):
    token = get_token(authorization)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{QF_API_BASE}/auth/api/v1/notes",
                headers=qf_headers(token),
            )
            if r.status_code == 200:
                data = r.json()
                notes = data if isinstance(data, list) else data.get(
                    "notes", data.get("data", [])
                )
                return [
                    {
                        "id": str(n.get("id", "")),
                        "verse_key": n.get("verse_key", ""),
                        "note_text": n.get("body", n.get("text", "")),
                        "created_at": n.get("created_at", ""),
                    }
                    for n in notes
                ]
    except Exception as e:
        print(f"Notes error: {e}")
    return []


@router.get("/user/streaks", response_model=StreakInfo)
async def get_streaks(authorization: Optional[str] = Header(None)):
    token = get_token(authorization)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{QF_API_BASE}/auth/api/v1/streaks",
                headers=qf_headers(token),
            )
            if r.status_code == 200:
                data = r.json()
                return StreakInfo(
                    current_streak=data.get(
                        "current_streak", data.get("currentStreak", 0)
                    ),
                    longest_streak=data.get(
                        "longest_streak", data.get("longestStreak", 0)
                    ),
                    total_days=data.get("total_days", data.get("totalDays", 0)),
                )
    except Exception as e:
        print(f"Streaks error: {e}")
    return StreakInfo()


@router.get("/user/journal")
async def get_journal(authorization: Optional[str] = Header(None)):
    token = get_token(authorization)
    entries = []

    # Notes (treated as journal entries)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{QF_API_BASE}/auth/api/v1/bookmarks",
                headers=qf_headers(token),
            )
            if r.status_code == 200:
                data = r.json()
                bookmarks = data if isinstance(data, list) else data.get(
                    "bookmarks", data.get("data", [])
                )
                for b in bookmarks:
                    entries.append(
                        {
                            "id": str(b.get("id", "")),
                            "verse_key": b.get("verse_key", ""),
                            "situation": "",
                            "note_text": "",
                            "created_at": b.get("created_at", ""),
                            "entry_type": "bookmark",
                        }
                    )
    except Exception as e:
        print(f"Journal bookmarks error: {e}")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{QF_API_BASE}/auth/api/v1/notes",
                headers=qf_headers(token),
            )
            if r.status_code == 200:
                data = r.json()
                notes = data if isinstance(data, list) else data.get(
                    "notes", data.get("data", [])
                )
                for n in notes:
                    entries.append(
                        {
                            "id": str(n.get("id", "")),
                            "verse_key": n.get("verse_key", ""),
                            "situation": "",
                            "note_text": n.get("body", n.get("text", "")),
                            "created_at": n.get("created_at", ""),
                            "entry_type": "note",
                        }
                    )
    except Exception as e:
        print(f"Journal notes error: {e}")

    entries.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return entries

