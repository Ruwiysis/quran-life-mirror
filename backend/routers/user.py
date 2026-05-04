from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
import httpx, os
from dotenv import load_dotenv
from services.qf_auth_service import get_user_api_headers, refresh_user_token
QF_AUTH_ENDPOINT = "https://auth.api.qurancdn.com"  # Add if not defined

load_dotenv()
router = APIRouter()
QF_API_BASE = os.getenv("QF_API_BASE")

class BookmarkData(BaseModel):
    verse_key: str
    refresh_token: Optional[str] = None

class BookmarkResponse(BaseModel):
    id: str
    verse_key: str
    created_at: str = ""

class NoteData(BaseModel):
    verse_key: str
    note_text: str
    situation: Optional[str] = None
    refresh_token: Optional[str] = None

class NoteResponse(BaseModel):
    id: str
    verse_key: str
    note_text: str
    created_at: str = ""

class StreakInfo(BaseModel):
    current_streak: int = 0
    longest_streak: int = 0
    total_days: int = 0

class JournalEntry(BaseModel):
    id: str
    verse_key: str
    situation: str = ""
    note_text: str = ""
    created_at: str = ""
    entry_type: str = "bookmark"

def get_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    return authorization.replace("Bearer ", "").strip()

async def _qf_call_with_retry(client, method: str, url: str, headers: dict, json=None, refresh_token: Optional[str] = None):
    r = await client.request(method, url, headers=headers, json=json)
    if r.status_code in [401, 403] and refresh_token and 'invalid_token' in r.text.lower():
        try:
            new_tokens = await refresh_user_token(refresh_token)
            headers = headers.copy()
            headers['x-auth-token'] = new_tokens['access_token']
            r = await client.request(method, url, headers=headers, json=json)
        except Exception as refresh_e:
            print(f'Refresh failed: {refresh_e}')
    return r

@router.post("/user/bookmark")
async def create_bookmark(data: BookmarkData, authorization: Optional[str] = Header(None)):
    token = get_token(authorization)
    print(f"Attempting bookmark save for verse_key: {data.verse_key}")
    print(f"Token present: {bool(token)}")
    print(f"QF_API_BASE: {QF_API_BASE}")
    if not QF_API_BASE:
        print("QF_API_BASE not set, falling back to local storage")
        # Fallback to local
        from .local_bookmarks import create_local_bookmark
        return create_local_bookmark({"verse_key": data.verse_key})
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = get_user_api_headers(token)
            url = f"{QF_API_BASE}/auth/api/v1/bookmarks"
            print(f"Proxying to QF URL: {url}")
            print(f"Headers keys: {list(headers.keys())}")
            r = await _qf_call_with_retry(client, 'POST', url, headers, json={"verse_key": data.verse_key}, refresh_token=data.refresh_token)
            print(f"QF Bookmark response: {r.status_code} {r.text[:300]}")
            if r.status_code in [200, 201]:
                result = r.json()
                return {"id": str(result.get("id", data.verse_key)), "verse_key": data.verse_key, "created_at": result.get("created_at", "")}
            else:
                print(f"QF failed ({r.status_code}), falling back to local")
                from .local_bookmarks import create_local_bookmark
                return create_local_bookmark({"verse_key": data.verse_key})
    except Exception as e:
        print(f"Bookmark proxy error (falling back to local): {e}")
        from .local_bookmarks import create_local_bookmark
        return create_local_bookmark({"verse_key": data.verse_key})

@router.get("/user/bookmarks")
async def get_bookmarks(authorization: Optional[str] = Header(None)):
    print("Fetching bookmarks - trying QF first")
    if QF_API_BASE:
        token = get_token(authorization)
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(f"{QF_API_BASE}/auth/api/v1/bookmarks", headers=get_user_api_headers(token))
                print(f"QF Get bookmarks: {r.status_code} {r.text[:300]}")
                if r.status_code == 200:
                    data = r.json()
                    bookmarks = data if isinstance(data, list) else data.get("bookmarks", data.get("data", []))
                    return [{"id": str(b.get("id", b.get("verse_key",""))), "verse_key": b.get("verse_key",""), "created_at": b.get("created_at","")} for b in bookmarks]
        except Exception as e:
            print(f"QF Get bookmarks failed: {e}")
    
    # Fallback to local
    print("Falling back to local bookmarks")
    from .local_bookmarks import get_local_bookmarks
    return await get_local_bookmarks()

@router.delete("/user/bookmark/{bookmark_id}")
async def delete_bookmark(bookmark_id: str, authorization: Optional[str] = Header(None)):
    token = get_token(authorization)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.delete(f"{QF_API_BASE}/auth/api/v1/bookmarks/{bookmark_id}", headers=get_user_api_headers(token))
            print(f"Delete bookmark: {r.status_code}")
            return {"message": "Bookmark deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/user/note")
async def create_note(data: NoteData, authorization: Optional[str] = Header(None)):
    token = get_token(authorization)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"{QF_API_BASE}/auth/api/v1/notes",
                headers=get_user_api_headers(token),
                json={"verse_key": data.verse_key, "body": data.note_text, "ranges": [data.verse_key]}
            )
            print(f"Note response: {r.status_code} {r.text[:200]}")
            if r.status_code in [200, 201]:
                result = r.json()
                return {"id": str(result.get("id", data.verse_key)), "verse_key": data.verse_key, "note_text": data.note_text, "created_at": result.get("created_at","")}
            raise Exception(f"QF API error: {r.status_code} {r.text[:100]}")
    except Exception as e:
        print(f"Note error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/notes")
async def get_notes(authorization: Optional[str] = Header(None)):
    token = get_token(authorization)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{QF_API_BASE}/auth/api/v1/notes", headers=get_user_api_headers(token))
            print(f"Get notes: {r.status_code} {r.text[:300]}")
            if r.status_code == 200:
                data = r.json()
                notes = data if isinstance(data, list) else data.get("notes", data.get("data", []))
                return [{"id": str(n.get("id","")), "verse_key": n.get("verse_key",""), "note_text": n.get("body", n.get("text","")), "created_at": n.get("created_at","")} for n in notes]
            return []
    except Exception as e:
        print(f"Get notes error: {e}")
        return []

@router.get("/user/streaks", response_model=StreakInfo)
async def get_streaks(authorization: Optional[str] = Header(None)):
    token = get_token(authorization)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{QF_API_BASE}/auth/api/v1/streaks", headers=get_user_api_headers(token))
            print(f"Streaks: {r.status_code} {r.text[:300]}")
            if r.status_code == 200:
                data = r.json()
                return StreakInfo(
                    current_streak=data.get("current_streak", data.get("currentStreak", 0)),
                    longest_streak=data.get("longest_streak", data.get("longestStreak", 0)),
                    total_days=data.get("total_days", data.get("totalDays", 0))
                )
    except Exception as e:
        print(f"Streaks error: {e}")
    return StreakInfo()

@router.get("/user/journal")
async def get_journal(authorization: Optional[str] = Header(None)):
    token = get_token(authorization)
    entries = []
    headers = get_user_api_headers(token)
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.get(f"{QF_API_BASE}/auth/api/v1/bookmarks", headers=headers)
            if r.status_code == 200:
                data = r.json()
                bookmarks = data if isinstance(data, list) else data.get("bookmarks", data.get("data", []))
                for b in bookmarks:
                    entries.append({"id": str(b.get("id","")), "verse_key": b.get("verse_key",""), "situation": "", "note_text": "", "created_at": b.get("created_at",""), "entry_type": "bookmark"})
        except Exception as e:
            print(f"Journal bookmarks error: {e}")
        try:
            r = await client.get(f"{QF_API_BASE}/auth/api/v1/notes", headers=headers)
            if r.status_code == 200:
                data = r.json()
                notes = data if isinstance(data, list) else data.get("notes", data.get("data", []))
                for n in notes:
                    entries.append({"id": str(n.get("id","")), "verse_key": n.get("verse_key",""), "situation": "", "note_text": n.get("body", n.get("text","")), "created_at": n.get("created_at",""), "entry_type": "note"})
        except Exception as e:
            print(f"Journal notes error: {e}")
    entries.sort(key=lambda x: x.get("created_at",""), reverse=True)
    return entries
