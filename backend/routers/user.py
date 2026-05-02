"""
User router - requires authentication.
All endpoints require Authorization: Bearer {access_token}
Syncs data with Quran Foundation APIs.
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

QF_API_BASE = os.getenv("QF_API_BASE")


class BookmarkData(BaseModel):
    verse_key: str


class BookmarkResponse(BaseModel):
    id: str
    verse_key: str
    created_at: str


class ReflectionData(BaseModel):
    verse_key: str
    reflection_text: str
    situation: Optional[str] = None


class ReflectionResponse(BaseModel):
    id: str
    verse_key: str
    reflection_text: str
    created_at: str


class StreakInfo(BaseModel):
    current_streak: int
    longest_streak: int
    total_days: int


class JournalEntry(BaseModel):
    id: str
    verse_key: str
    situation: str
    reflection: str
    created_at: str
    source: str  # "local" or "qf"


def get_token_from_header(authorization: Optional[str]) -> str:
    """Extract bearer token from Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        token = authorization.replace("Bearer ", "")
        return token
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authorization format")


@router.post("/user/bookmark", response_model=BookmarkResponse)
async def create_bookmark(
    data: BookmarkData,
    authorization: Optional[str] = Header(None)
):
    """
    Create a bookmark in Quran Foundation.
    """
    token = get_token_from_header(authorization)
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{QF_API_BASE}/auth/api/v1/bookmarks",
                headers=headers,
                json={
                    "verse_key": data.verse_key
                }
            )
            
            if response.status_code not in [200, 201]:
                raise Exception(f"QF API error: {response.status_code}")
            
            result = response.json()
            
            return BookmarkResponse(
                id=result.get("id", data.verse_key),
                verse_key=result.get("verse_key", data.verse_key),
                created_at=result.get("created_at", "")
            )
    
    except Exception as e:
        print(f"Error creating bookmark: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to save bookmark"
        )


@router.get("/user/bookmarks", response_model=List[BookmarkResponse])
async def get_bookmarks(
    authorization: Optional[str] = Header(None)
):
    """
    Get user's bookmarks from Quran Foundation.
    """
    token = get_token_from_header(authorization)
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{QF_API_BASE}/auth/api/v1/bookmarks",
                headers=headers
            )
            
            if response.status_code not in [200, 204]:
                raise Exception(f"QF API error: {response.status_code}")
            
            if response.status_code == 204:
                return []
            
            data = response.json()
            bookmarks = data.get("bookmarks", data.get("data", []))
            
            return [
                BookmarkResponse(
                    id=b.get("id", b.get("verse_key")),
                    verse_key=b.get("verse_key"),
                    created_at=b.get("created_at", "")
                )
                for b in bookmarks
            ]
    
    except Exception as e:
        print(f"Error fetching bookmarks: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch bookmarks"
        )


@router.delete("/user/bookmark/{verse_key}")
async def delete_bookmark(
    verse_key: str,
    authorization: Optional[str] = Header(None)
):
    """
    Delete a bookmark from Quran Foundation.
    """
    token = get_token_from_header(authorization)
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.delete(
                f"{QF_API_BASE}/auth/api/v1/bookmarks/{verse_key}",
                headers=headers
            )
            
            if response.status_code not in [200, 204]:
                raise Exception(f"QF API error: {response.status_code}")
            
            return {"message": "Bookmark deleted"}
    
    except Exception as e:
        print(f"Error deleting bookmark: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete bookmark"
        )


@router.post("/user/reflection", response_model=ReflectionResponse)
async def create_reflection(
    data: ReflectionData,
    authorization: Optional[str] = Header(None)
):
    """
    Save a reflection/note for a verse to Quran Foundation.
    """
    token = get_token_from_header(authorization)
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{QF_API_BASE}/auth/api/v1/reflections",
                headers=headers,
                json={
                    "verse_key": data.verse_key,
                    "text": data.reflection_text
                }
            )
            
            if response.status_code not in [200, 201]:
                raise Exception(f"QF API error: {response.status_code}")
            
            result = response.json()
            
            return ReflectionResponse(
                id=result.get("id", data.verse_key),
                verse_key=result.get("verse_key", data.verse_key),
                reflection_text=result.get("text", data.reflection_text),
                created_at=result.get("created_at", "")
            )
    
    except Exception as e:
        print(f"Error creating reflection: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to save reflection"
        )


@router.get("/user/reflections", response_model=List[ReflectionResponse])
async def get_reflections(
    authorization: Optional[str] = Header(None)
):
    """
    Get user's reflections from Quran Foundation.
    """
    token = get_token_from_header(authorization)
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{QF_API_BASE}/auth/api/v1/reflections",
                headers=headers
            )
            
            if response.status_code not in [200, 204]:
                raise Exception(f"QF API error: {response.status_code}")
            
            if response.status_code == 204:
                return []
            
            data = response.json()
            reflections = data.get("reflections", data.get("data", []))
            
            return [
                ReflectionResponse(
                    id=r.get("id", r.get("verse_key")),
                    verse_key=r.get("verse_key"),
                    reflection_text=r.get("text", ""),
                    created_at=r.get("created_at", "")
                )
                for r in reflections
            ]
    
    except Exception as e:
        print(f"Error fetching reflections: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch reflections"
        )


@router.get("/user/streaks", response_model=StreakInfo)
async def get_streaks(
    authorization: Optional[str] = Header(None)
):
    """
    Get user's streak information from Quran Foundation.
    """
    token = get_token_from_header(authorization)
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{QF_API_BASE}/auth/api/v1/streaks",
                headers=headers
            )
            
            if response.status_code not in [200, 204]:
                raise Exception(f"QF API error: {response.status_code}")
            
            if response.status_code == 204:
                return StreakInfo(current_streak=0, longest_streak=0, total_days=0)
            
            data = response.json()
            
            return StreakInfo(
                current_streak=data.get("current_streak", 0),
                longest_streak=data.get("longest_streak", 0),
                total_days=data.get("total_days", 0)
            )
    
    except Exception as e:
        print(f"Error fetching streaks: {e}")
        # Return empty streak info instead of error
        return StreakInfo(current_streak=0, longest_streak=0, total_days=0)


@router.get("/user/journal", response_model=List[JournalEntry])
async def get_combined_journal(
    authorization: Optional[str] = Header(None)
):
    """
    Get combined journal from QF APIs (bookmarks, reflections, activity).
    Returns entries sorted by most recent first.
    """
    token = get_token_from_header(authorization)
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        entries = []
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Fetch bookmarks
            try:
                response = await client.get(
                    f"{QF_API_BASE}/auth/api/v1/bookmarks",
                    headers=headers
                )
                if response.status_code == 200:
                    bookmarks = response.json().get("bookmarks", [])
                    for b in bookmarks:
                        entries.append(JournalEntry(
                            id=b.get("id", b.get("verse_key")),
                            verse_key=b.get("verse_key"),
                            situation="Bookmarked verse",
                            reflection="",
                            created_at=b.get("created_at", ""),
                            source="qf"
                        ))
            except Exception as e:
                print(f"Error fetching bookmarks for journal: {e}")
            
            # Fetch reflections
            try:
                response = await client.get(
                    f"{QF_API_BASE}/auth/api/v1/reflections",
                    headers=headers
                )
                if response.status_code == 200:
                    reflections = response.json().get("reflections", [])
                    for r in reflections:
                        entries.append(JournalEntry(
                            id=r.get("id", r.get("verse_key")),
                            verse_key=r.get("verse_key"),
                            situation="Personal reflection",
                            reflection=r.get("text", ""),
                            created_at=r.get("created_at", ""),
                            source="qf"
                        ))
            except Exception as e:
                print(f"Error fetching reflections for journal: {e}")
        
        # Sort by created_at (most recent first)
        entries.sort(key=lambda x: x.created_at, reverse=True)
        
        return entries
    
    except Exception as e:
        print(f"Error fetching combined journal: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch journal"
        )
