from fastapi import APIRouter, HTTPException
from services.quran_service import get_verse, get_audio_url, get_surah_name, get_tafsir
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

class VerseResponse(BaseModel):
    verse_key: str
    surah_name: str
    arabic_text: str
    translation: str
    audio_url: str
    tafsir_en: Optional[str] = None
    tafsir_ar: Optional[str] = None

@router.get("/verse/{verse_key}", response_model=VerseResponse)
async def get_single_verse(verse_key: str):
    verse_data = await get_verse(verse_key)
    if not verse_data:
        raise HTTPException(status_code=404, detail="Verse not found")
    
    audio_url = await get_audio_url(verse_key)
    surah_name = await get_surah_name(verse_key)
    
    return VerseResponse(
        verse_key=verse_key,
        surah_name=surah_name,
        arabic_text=verse_data.get("arabic", ""),
        translation=verse_data.get("translation", ""),
        audio_url=audio_url,
        tafsir_en=verse_data.get("tafsir_en"),
        tafsir_ar=verse_data.get("tafsir_ar")
    )

