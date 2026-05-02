from groq import Groq
import os
from dotenv import load_dotenv
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.1-8b-instant"

def detect_language(text: str) -> str:
    arabic_chars = sum(1 for c in text if "؀" <= c <= "ۿ")
    return "ar" if arabic_chars > len(text) * 0.2 else "en"

async def extract_themes(situation: str) -> str:
    r = client.chat.completions.create(
        model=MODEL, max_tokens=60,
        messages=[{"role":"user","content":f"Extract core spiritual themes from this situation as a 10-15 word Quran search query. Return ONLY the query.

Situation: {situation}"}]
    )
    return r.choices[0].message.content.strip()

async def generate_reflection(situation: str, verse_key: str, translation: str) -> str:
    lang = detect_language(situation)
    if lang == "ar":
        prompt = f"اكتب تأمل دافئ من 2-3 جمل يربط هذه الآية القرآنية بحالة الشخص. بضمير المخاطب، بأسلوب مشجع وليس وعظي. باللغة العربية فقط.

الحالة: {situation}
الآية ({verse_key}): {translation}

التأمل:"
    else:
        prompt = f"Write a warm 2-3 sentence reflection connecting this Quran verse to the person situation. Second person, hopeful, not preachy.

Situation: {situation}
Verse ({verse_key}): {translation}

Reflection:"
    r = client.chat.completions.create(
        model=MODEL, max_tokens=150,
        messages=[{"role":"user","content":prompt}]
    )
    return r.choices[0].message.content.strip()

async def pick_verses(situation: str, candidates: list, count: int = 6) -> list:
    if not candidates:
        return []
    candidate_text = "
".join([f"{v['verse_key']}: {v.get('translation','')[:80]}" for v in candidates])
    lang = detect_language(situation)
    if lang == "ar":
        prompt = f"اختر {count} مفاتيح آيات الأكثر صلة بهذه الحالة. أعد مفاتيح الآيات مفصولة بفواصل فقط.

الحالة: {situation}

المرشحون:
{candidate_text}"
    else:
        prompt = f"Pick the {count} most relevant verse keys for this situation. Return ONLY comma-separated verse keys ranked from most to least relevant.

Situation: {situation}

Candidates:
{candidate_text}"
    r = client.chat.completions.create(
        model=MODEL, max_tokens=60,
        messages=[{"role":"user","content":prompt}]
    )
    keys = [k.strip() for k in r.choices[0].message.content.strip().split(",")]
    return keys[:count]
