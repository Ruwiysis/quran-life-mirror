import httpx
import re
import asyncio
from typing import Dict, Optional

# AlQuran.cloud — works reliably for Arabic text and translations
ALQURAN_API = "https://api.alquran.cloud/v1"

# Quran.com v4 — works for tafsir only
QURAN_COM_API = "https://api.quran.com/api/v4"

# Mishary Rashid Al-Afasy audio (cdn.islamic.network)
AUDIO_BASE = "https://cdn.islamic.network/quran/audio/128/ar.alafasy"

SURAH_NAMES = {
    "1": "Al-Fatihah", "2": "Al-Baqarah", "3": "Ali Imran", "4": "An-Nisa", "5": "Al-Maidah",
    "6": "Al-Anam", "7": "Al-Araf", "8": "Al-Anfal", "9": "At-Tawbah", "10": "Yunus",
    "11": "Hud", "12": "Yusuf", "13": "Ar-Rad", "14": "Ibrahim", "15": "Al-Hijr",
    "16": "An-Nahl", "17": "Al-Isra", "18": "Al-Kahf", "19": "Maryam", "20": "Ta-Ha",
    "21": "Al-Anbiya", "22": "Al-Hajj", "23": "Al-Muminun", "24": "An-Nur", "25": "Al-Furqan",
    "26": "Ash-Shuara", "27": "An-Naml", "28": "Al-Qasas", "29": "Al-Ankabut", "30": "Ar-Rum",
    "31": "Luqman", "32": "As-Sajdah", "33": "Al-Ahzab", "34": "Saba", "35": "Fatir",
    "36": "Yaseen", "37": "As-Saffat", "38": "Sad", "39": "Az-Zumar", "40": "Ghafir",
    "41": "Fussilat", "42": "Ash-Shura", "43": "Az-Zukhruf", "44": "Ad-Dukhan", "45": "Al-Jathiyah",
    "46": "Al-Ahqaf", "47": "Muhammad", "48": "Al-Fath", "49": "Al-Hujurat", "50": "Qaf",
    "51": "Adh-Dhariyat", "52": "At-Tur", "53": "An-Najm", "54": "Al-Qamar", "55": "Ar-Rahman",
    "56": "Al-Waqi'ah", "57": "Al-Hadid", "58": "Al-Mujadila", "59": "Al-Hashr", "60": "Al-Mumtahanah",
    "61": "As-Saff", "62": "Al-Jumu'ah", "63": "Al-Munafiqun", "64": "At-Taghabun", "65": "At-Talaq",
    "66": "At-Tahrim", "67": "Al-Mulk", "68": "Al-Qalam", "69": "Al-Haqqah", "70": "Al-Ma'arij",
    "71": "Nuh", "72": "Al-Jinn", "73": "Al-Muzzammil", "74": "Al-Muddaththir", "75": "Al-Qiyamah",
    "76": "Ad-Dahr", "77": "Al-Mursalat", "78": "An-Naba", "79": "An-Nazi'at", "80": "Abasa",
    "81": "At-Takwir", "82": "Al-Infitar", "83": "Al-Mutaffifin", "84": "Al-Inshiqaq", "85": "Al-Buruj",
    "86": "At-Tariq", "87": "Al-A'la", "88": "Al-Ghashiyah", "89": "Al-Fajr", "90": "Al-Balad",
    "91": "Ash-Shams", "92": "Al-Lail", "93": "Ad-Duhaa", "94": "Ash-Sharh", "95": "At-Tin",
    "96": "Al-Alaq", "97": "Al-Qadr", "98": "Al-Bayyina", "99": "Az-Zalzalah", "100": "Al-Adiyat",
    "101": "Al-Qari'ah", "102": "At-Takathur", "103": "Al-Asr", "104": "Al-Humazah", "105": "Al-Fil",
    "106": "Quraysh", "107": "Al-Ma'un", "108": "Al-Kawthar", "109": "Al-Kafirun", "110": "An-Nasr",
    "111": "Al-Lahab", "112": "Al-Ikhlas", "113": "Al-Falaq", "114": "An-Nas"
}

# Ayah number lookup table: verse_key -> global ayah number for audio URLs
# We'll compute it dynamically from surah/ayah
SURAH_AYAH_COUNTS = [
    0, 7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99,
    128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34,
    30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18,
    45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30,
    52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22,
    17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5,
    4, 7, 3, 6, 3, 5, 4, 5, 6
]

_verse_cache: Dict[str, Dict] = {}
_tafsir_cache: Dict[str, str] = {}


def _strip_html(text: str) -> str:
    return re.sub(r'<[^>]+>', '', text)


def _truncate(text: str, max_chars: int = 450) -> str:
    return text


def _verse_key_to_ayah_number(verse_key: str) -> Optional[int]:
    """Convert '2:286' to global ayah number for audio URLs."""
    try:
        parts = verse_key.split(":")
        surah = int(parts[0])
        ayah = int(parts[1])
        if surah < 1 or surah > 114:
            return None
        total = sum(SURAH_AYAH_COUNTS[:surah]) + ayah
        return total
    except Exception:
        return None


async def _fetch_arabic_and_translation(verse_key: str):
    """
    Fetch both Arabic (Uthmani) and Saheeh International translation
    from AlQuran.cloud in one call using the editions param.
    Returns (arabic_text, translation_text)
    """
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            r = await client.get(
                f"{ALQURAN_API}/ayah/{verse_key}/editions/quran-uthmani,en.sahih"
            )
            if r.status_code == 200:
                data = r.json().get("data", [])
                arabic = ""
                translation = ""
                for edition in data:
                    identifier = edition.get("edition", {}).get("identifier", "")
                    if identifier == "quran-uthmani":
                        arabic = edition.get("text", "")
                    elif identifier == "en.sahih":
                        translation = edition.get("text", "")
                        # Strip footnote markers like <sup> tags
                        translation = re.sub(r'<[^>]+>', '', translation)
                return arabic or None, translation or None
    except Exception as e:
        print(f"Error fetching Arabic/translation for {verse_key}: {e}")
    return None, None


async def _fetch_tafsir_en(verse_key: str) -> Optional[str]:
    """Ibn Kathir English tafsir from Quran.com (id=169)."""
    cache_key = f"tafsir_en:{verse_key}"
    if cache_key in _tafsir_cache:
        return _tafsir_cache[cache_key]
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            r = await client.get(f"{QURAN_COM_API}/tafsirs/169/by_ayah/{verse_key}")
            if r.status_code == 200:
                text = r.json().get("tafsir", {}).get("text", "")
                if text:
                    text = _truncate(_strip_html(text))
                    _tafsir_cache[cache_key] = text
                    return text
    except Exception as e:
        print(f"Error fetching English tafsir for {verse_key}: {e}")
    return None


async def _fetch_tafsir_ar(verse_key: str) -> Optional[str]:
    """Al-Muyassar Arabic tafsir from Quran.com (id=91)."""
    cache_key = f"tafsir_ar:{verse_key}"
    if cache_key in _tafsir_cache:
        return _tafsir_cache[cache_key]
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            r = await client.get(f"{QURAN_COM_API}/tafsirs/91/by_ayah/{verse_key}")
            if r.status_code == 200:
                text = r.json().get("tafsir", {}).get("text", "")
                if text:
                    text = _truncate(_strip_html(text))
                    _tafsir_cache[cache_key] = text
                    return text
    except Exception as e:
        print(f"Error fetching Arabic tafsir for {verse_key}: {e}")
    return None


async def get_verse(verse_key: str) -> Optional[Dict]:
    """
    Fetch full verse data. Returns:
    { arabic, translation, tafsir_en, tafsir_ar }
    """
    if verse_key in _verse_cache:
        return _verse_cache[verse_key]

    try:
        (arabic, translation), tafsir_en, tafsir_ar = await asyncio.gather(
            _fetch_arabic_and_translation(verse_key),
            _fetch_tafsir_en(verse_key),
            _fetch_tafsir_ar(verse_key),
        )

        if not arabic or not translation:
            print(f"Missing arabic or translation for {verse_key}")
            return None

        result = {
            "arabic": arabic,
            "translation": translation,
            "tafsir_en": tafsir_en,
            "tafsir_ar": tafsir_ar,
        }
        _verse_cache[verse_key] = result
        return result

    except Exception as e:
        print(f"Error in get_verse for {verse_key}: {e}")
        return None


async def get_audio_url(verse_key: str) -> str:
    """
    Build Mishary Al-Afasy audio URL directly from CDN.
    Format: https://cdn.islamic.network/quran/audio/128/ar.alafasy/{ayah_number}.mp3
    """
    try:
        ayah_num = _verse_key_to_ayah_number(verse_key)
        if ayah_num:
            return f"{AUDIO_BASE}/{ayah_num}.mp3"
    except Exception as e:
        print(f"Error building audio URL for {verse_key}: {e}")
    return ""


async def get_surah_name(verse_key: str) -> str:
    surah = verse_key.split(":")[0]
    return SURAH_NAMES.get(surah, f"Surah {surah}")


async def search_verses(query: str, size: int = 20) -> list:
    """Search verses using Quran.com search endpoint."""
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            r = await client.get(
                f"{QURAN_COM_API}/search",
                params={"q": query, "size": size, "language": "en"}
            )
            if r.status_code == 200:
                results = r.json().get("results", [])
                verses = []
                for result in results:
                    for verse in result.get("verses", []):
                        verses.append({
                            "verse_key": verse.get("verse_key"),
                            "translation": verse.get("text", "")
                        })
                    if len(verses) >= size:
                        break
                return verses[:size]
    except Exception as e:
        print(f"Error searching verses: {e}")
    return []
async def get_tafsir(verse_key: str, lang: str = 'en') -> str:
    # Ibn Kathir English = 169, Al-Muyassar Arabic = 381
    resource_id = 381 if lang == 'ar' else 169
    try:
        token = await get_content_token()
        headers = get_content_headers(token)
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{QF_API_BASE}/content/api/v4/tafsirs/{resource_id}/by_ayah/{verse_key}",
                headers=headers
            )
            if r.status_code == 200:
                data = r.json().get('tafsir', {})
                text = data.get('text', '')
                # Remove HTML tags
                import re
                text = re.sub(r'<[^>]+>', '', text)
                text = re.sub(r'\s+', ' ', text).strip()
                return text[:2000] + '...' if len(text) > 2000 else text
    except Exception as e:
        print(f'Tafsir error for {verse_key}: {e}')
    return ''
