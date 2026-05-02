import httpx, re, os
from dotenv import load_dotenv
from services.qf_auth_service import get_content_token, get_content_headers

load_dotenv()
QF_API_BASE = os.getenv("QF_API_BASE")

SURAH_NAMES = {
    "1":"Al-Fatihah","2":"Al-Baqarah","3":"Ali Imran","4":"An-Nisa","5":"Al-Maidah",
    "6":"Al-Anam","7":"Al-Araf","8":"Al-Anfal","9":"At-Tawbah","10":"Yunus",
    "11":"Hud","12":"Yusuf","13":"Ar-Rad","14":"Ibrahim","15":"Al-Hijr",
    "16":"An-Nahl","17":"Al-Isra","18":"Al-Kahf","19":"Maryam","20":"Ta-Ha",
    "21":"Al-Anbiya","22":"Al-Hajj","23":"Al-Muminun","24":"An-Nur","25":"Al-Furqan",
    "26":"Ash-Shuara","27":"An-Naml","28":"Al-Qasas","29":"Al-Ankabut","30":"Ar-Rum",
    "39":"Az-Zumar","50":"Qaf","51":"Adh-Dhariyat","57":"Al-Hadid","58":"Al-Mujadila",
    "65":"At-Talaq","66":"At-Tahrim","67":"Al-Mulk","84":"Al-Inshiqaq",
    "93":"Ad-Duhaa","94":"Ash-Sharh","98":"Al-Bayyina","103":"Al-Asr"
}

_verse_cache = {}
_audio_cache = {}

async def get_verse(verse_key: str) -> dict:
    if verse_key in _verse_cache:
        return _verse_cache[verse_key]

    surah, ayah = verse_key.split(":")
    ayah_num = int(ayah)

    # Try QF API first
    try:
        token = await get_content_token()
        headers = get_content_headers(token)
        per_page = 50
        page = ((ayah_num - 1) // per_page) + 1
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{QF_API_BASE}/content/api/v4/verses/by_chapter/{surah}",
                params={"translations": "131", "fields": "text_uthmani", "per_page": str(per_page), "page": str(page)},
                headers=headers
            )
            if r.status_code == 200:
                verses = r.json().get("verses", [])
                for v in verses:
                    if v.get("verse_number") == ayah_num:
                        tr = re.sub(r"<[^>]+>", "", (v.get("translations") or [{}])[0].get("text", ""))
                        result = {"arabic": v.get("text_uthmani", ""), "translation": tr}
                        _verse_cache[verse_key] = result
                        return result
    except Exception:
        pass

    # Fallback: alquran.cloud (gets arabic, translation, AND audio in one call)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"https://api.alquran.cloud/v1/ayah/{surah}:{ayah}/editions/quran-uthmani,en.asad,ar.alafasy"
            )
            if r.status_code == 200:
                data = r.json().get("data", [])
                arabic = data[0].get("text", "") if len(data) > 0 else ""
                translation = data[1].get("text", "") if len(data) > 1 else ""
                audio = data[2].get("audio", "") if len(data) > 2 else ""
                if audio:
                    _audio_cache[verse_key] = audio
                result = {"arabic": arabic, "translation": translation}
                _verse_cache[verse_key] = result
                return result
    except Exception:
        pass

    raise Exception(f"Could not fetch verse {verse_key}")

async def get_audio_url(verse_key: str) -> str:
    # Return cached audio from get_verse call if available
    if verse_key in _audio_cache:
        return _audio_cache[verse_key]

    # Fetch audio specifically
    try:
        surah, ayah = verse_key.split(":")
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"https://api.alquran.cloud/v1/ayah/{surah}:{ayah}/ar.alafasy"
            )
            if r.status_code == 200:
                audio = r.json().get("data", {}).get("audio", "")
                if audio:
                    _audio_cache[verse_key] = audio
                    return audio
    except Exception:
        pass
    return ""

async def get_surah_name(verse_key: str) -> str:
    surah = verse_key.split(":")[0]
    return SURAH_NAMES.get(surah, f"Surah {surah}")

async def search_verses(query: str, size: int = 20) -> list:
    try:
        token = await get_content_token()
        headers = get_content_headers(token)
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(
                f"{QF_API_BASE}/search/api/v1/search",
                params={"q": query, "size": size, "language": "en"},
                headers=headers
            )
            if r.status_code == 200:
                results = r.json().get("search", {}).get("results", [])
                return [{"verse_key": res["verse_key"], "translation": re.sub(r"<[^>]+>", "", res.get("text", ""))} for res in results]
    except Exception:
        pass
    return []
