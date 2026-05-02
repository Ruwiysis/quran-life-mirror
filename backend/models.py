from pydantic import BaseModel
from typing import Optional, List

class SituationRequest(BaseModel):
    situation: str
    user_token: Optional[str] = None

class VerseResult(BaseModel):
    verse_key: str
    surah_name: str
    arabic_text: str
    translation: str
    audio_url: Optional[str] = None
    reflection: str
    relevance_score: float

class JournalEntryCreate(BaseModel):
    situation: str
    verse_key: str
    arabic_text: str
    translation: str
    reflection: str
    personal_note: Optional[str] = ""
    mood: Optional[str] = "reflective"
    user_token: Optional[str] = None

class JournalEntryOut(BaseModel):
    id: int
    situation: str
    verse_key: str
    arabic_text: str
    translation: str
    reflection: str
    personal_note: Optional[str] = ""
    mood: Optional[str] = "reflective"
    created_at: str
