from groq import Groq
import os
import re
from dotenv import load_dotenv
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.1-8b-instant"

def detect_language(text: str) -> str:
    arabic_chars = sum(1 for c in text if "\u0600" <= c <= "\u06FF")
    return "ar" if arabic_chars > len(text) * 0.2 else "en"

def extract_verse_keys(raw: str) -> list:
    """
    Robustly extract verse keys like 2:153 or 2/153 from any LLM response,
    ignoring all surrounding Arabic/English text, labels, and punctuation.
    """
    pattern = r'\b(\d{1,3})[:/](\d{1,3})\b'
    matches = re.findall(pattern, raw)
    keys = []
    for surah, ayah in matches:
        s, a = int(surah), int(ayah)
        if 1 <= s <= 114 and 1 <= a <= 300:
            keys.append(f"{s}:{a}")
    # Deduplicate while preserving order
    seen = set()
    result = []
    for k in keys:
        if k not in seen:
            seen.add(k)
            result.append(k)
    return result

async def extract_themes(situation: str) -> str:
    query = (
        "Extract core spiritual themes from this situation as a 10-15 word "
        "Quran search query. Return ONLY the query, nothing else.\n\nSituation: "
        + situation
    )
    r = client.chat.completions.create(
        model=MODEL,
        max_tokens=60,
        messages=[{"role": "user", "content": query}]
    )
    return r.choices[0].message.content.strip()

async def generate_reflection(
    situation: str,
    verse_key: str,
    translation: str,
    tafsir_en: str = "",
    tafsir_ar: str = ""
) -> str:
    lang = detect_language(situation)
    if lang == "ar":
        tafsir_context = ("السياق التفسيري: " + tafsir_ar + "\n\n") if tafsir_ar else ""
        prompt = (
            "أنت عالم إسلامي رحيم. "
            + tafsir_context
            + "اكتب تأملاً دافئاً من 3 جمل يربط هذه الآية القرآنية بحالة الشخص. "
            "بضمير المخاطب، بأسلوب مشجع وليس وعظي. لا تتعارض مع التفسير. باللغة العربية فقط.\n\n"
            "الحالة: " + situation + "\n"
            "الآية (" + verse_key + "): " + translation + "\n\n"
            "التأمل:"
        )
    else:
        tafsir_context = ("Tafsir context: " + tafsir_en + "\n\n") if tafsir_en else ""
        prompt = (
            "You are a compassionate Islamic scholar. "
            + tafsir_context
            + "Using this tafsir as your scholarly foundation, write a warm personal "
            "3-sentence reflection connecting this verse to the person's situation. "
            "Second person. Hopeful, not preachy. Do not contradict the tafsir.\n\n"
            "Situation: " + situation + "\n"
            "Verse (" + verse_key + "): " + translation + "\n\n"
            "Reflection:"
        )
    r = client.chat.completions.create(
        model=MODEL,
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}]
    )
    return r.choices[0].message.content.strip()

async def pick_verses(situation: str, candidates: list, count: int = 6) -> list:
    if not candidates:
        return []

    candidate_text = "\n".join([
        v["verse_key"] + ": " + v.get("translation", "")[:80]
        for v in candidates
    ])

    prompt = (
        "You are a verse selector. Return ONLY a comma-separated list of verse keys.\n"
        "Format example: 2:153,94:5,13:28,39:53,2:286,3:200\n"
        "No labels. No explanation. No numbering. No Arabic text. No extra words. "
        "Just the keys separated by commas.\n\n"
        "Situation: " + situation + "\n\n"
        "Pick the " + str(count) + " most relevant from these candidates:\n"
        + candidate_text
        + "\n\nReturn ONLY comma-separated verse keys:"
    )

    r = client.chat.completions.create(
        model=MODEL,
        max_tokens=80,
        messages=[{"role": "user", "content": prompt}]
    )
    raw = r.choices[0].message.content.strip()

    # Robust parser handles any format: "2:153,94:5" or "2/153\n94/5" or garbage Arabic text
    keys = extract_verse_keys(raw)

    # Fallback: if nothing parsed, use first N candidates directly
    if not keys:
        keys = [v["verse_key"] for v in candidates[:count]]

    return keys[:count]
async def generate_all_reflections(situation: str, verses: list) -> list:
    """Generate all reflections in ONE API call instead of 6 separate ones."""
    verses_text = ""
    for i, v in enumerate(verses):
        verses_text += f"{i+1}. Verse {v['verse_key']}: {v['translation'][:120]}\n"
    
    lang = detect_language(situation)
    if lang == "ar":
        prompt = f"""اكتب {len(verses)} تأملات قصيرة (2-3 جمل لكل واحدة) تربط هذه الآيات بحالة الشخص. بضمير المخاطب، مشجع وليس وعظي. باللغة العربية.

الحالة: {situation}

الآيات:
{verses_text}

اكتب الإجابة بهذا الشكل بالضبط:
1: [التأمل الأول]
2: [التأمل الثاني]
وهكذا..."""
    else:
        prompt = f"""Write {len(verses)} short reflections (2-3 sentences each) connecting these Quran verses to the person's situation. Second person, hopeful, not preachy.

Situation: {situation}

Verses:
{verses_text}

Reply in this exact format:
1: [reflection for verse 1]
2: [reflection for verse 2]
etc."""

    r = client.chat.completions.create(
        model=MODEL, max_tokens=800,
        messages=[{"role": "user", "content": prompt}]
    )
    
    raw = r.choices[0].message.content.strip()
    reflections = []
    for i in range(1, len(verses) + 1):
        import re
        match = re.search(rf"{i}:\s*(.+?)(?=\n{i+1}:|$)", raw, re.DOTALL)
        if match:
            reflections.append(match.group(1).strip())
        else:
            reflections.append("This verse speaks directly to your heart in this moment.")
    return reflections