from fastapi import APIRouter, HTTPException
from models import SituationRequest, VerseResult
from services.claude_service import extract_themes, generate_reflection, pick_verses
from services.quran_service import get_verse, get_audio_url, get_surah_name
from typing import List
import asyncio, httpx, random, re

router = APIRouter()

THEMED_VERSES = {
    "anxiety": ["2:286","2:155","3:139","9:51","65:3","94:5","94:6","13:28","3:173"],
    "grief":   ["2:156","2:157","93:3","93:5","21:83","39:53","12:86","94:1"],
    "hope":    ["39:53","94:5","94:6","65:3","93:5","2:286","3:139","18:10"],
    "lonely":  ["50:16","2:186","57:4","58:7","9:40","16:128","2:153"],
    "shame":   ["39:53","4:110","3:135","25:70","66:8","9:102","11:114"],
    "failure": ["94:5","94:6","3:139","2:286","65:3","11:88","39:10"],
    "patience":["2:153","2:155","3:200","39:10","16:96","103:3","2:45"],
    "purpose": ["51:56","67:2","23:115","3:191","6:162","98:5"],
    "sad":     ["94:5","93:3","2:286","39:53","65:3","84:6","11:88"],
    "forgive": ["39:53","4:110","3:135","2:37","7:23","11:90","25:68"],
}

async def fetch_verse(client, verse_key: str) -> dict:
    surah, ayah = verse_key.split(":")
    url = f"https://api.qurancdn.com/api/qdc/verses/by_key/{surah}:{ayah}"
    r = await client.get(url, params={"translations": "131", "fields": "text_uthmani"})
    if r.status_code != 200:
        url2 = f"https://api.alquran.cloud/v1/ayah/{surah}:{ayah}/en.asad"
        r2 = await client.get(url2)
        if r2.status_code == 200:
            d = r2.json()["data"]
            return {"verse_key": verse_key, "translation": d.get("text",""), "arabic": d.get("text","")}
        return None
    d = r.json().get("verse", {})
    tr = re.sub(r"<[^>]+>", "", (d.get("translations") or [{}])[0].get("text",""))
    arabic = d.get("text_uthmani", "")
    return {"verse_key": verse_key, "translation": tr, "arabic": arabic}

async def get_verses_for_situation(situation: str, count: int = 12) -> List[dict]:
    sit = situation.lower()
    pool = []
    if any(w in sit for w in ["anxi","worry","fear","stress","panic","scared"]):
        pool += THEMED_VERSES["anxiety"]
    if any(w in sit for w in ["grief","loss","die","death","miss","mourn"]):
        pool += THEMED_VERSES["grief"]
    if any(w in sit for w in ["alone","lonely","isolat","nobody","no one"]):
        pool += THEMED_VERSES["lonely"]
    if any(w in sit for w in ["shame","ashamed","guilt","mistake","regret","sin"]):
        pool += THEMED_VERSES["shame"]
    if any(w in sit for w in ["fail","worthless","nothing","useless","loser"]):
        pool += THEMED_VERSES["failure"]
    if any(w in sit for w in ["patient","wait","tired","exhaust"]):
        pool += THEMED_VERSES["patience"]
    if any(w in sit for w in ["purpose","why","meaning","point","reason","direction"]):
        pool += THEMED_VERSES["purpose"]
    if any(w in sit for w in ["forgive","repent","tawbah"]):
        pool += THEMED_VERSES["forgive"]
    if any(w in sit for w in ["sad","cry","depress","unhappy","tears"]):
        pool += THEMED_VERSES["sad"]
    pool += THEMED_VERSES["hope"] + THEMED_VERSES["patience"]
    seen = set()
    unique = [v for v in pool if not (seen.add(v) if v not in seen else True)]
    random.shuffle(unique)
    verses = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        tasks = [fetch_verse(client, vk) for vk in unique[:count+4]]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for res in results:
            if isinstance(res, dict) and res and res.get("translation"):
                verses.append(res)
                if len(verses) >= count:
                    break
    return verses

@router.post("/search", response_model=List[VerseResult])
async def search_verses(request: SituationRequest):
    if len(request.situation.strip()) < 10:
        raise HTTPException(400, "Please describe your situation in more detail.")
    try:
        candidates = await get_verses_for_situation(request.situation, count=12)
        if not candidates:
            raise HTTPException(503, "Could not load verses. Check your internet connection.")
        try:
            picked_keys = await pick_verses(request.situation, candidates, count=6)
        except Exception:
            random.shuffle(candidates)
            picked_keys = [c["verse_key"] for c in candidates[:6]]
        results = []
        async with httpx.AsyncClient(timeout=15.0) as client:
            for verse_key in picked_keys:
                try:
                    v = await fetch_verse(client, verse_key)
                    if not v:
                        continue
                    audio_url = await get_audio_url(verse_key)
                    surah_name = await get_surah_name(verse_key)
                    reflection = await generate_reflection(
                        request.situation, verse_key, v["translation"]
                    )
                    results.append(VerseResult(
                        verse_key=verse_key,
                        surah_name=surah_name,
                        arabic_text=v.get("arabic",""),
                        translation=v["translation"],
                        audio_url=audio_url,
                        reflection=reflection,
                        relevance_score=0.9
                    ))
                except Exception:
                    continue
        if not results:
            raise HTTPException(500, "Could not build results. Please try again.")
        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")
