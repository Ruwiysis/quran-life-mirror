from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.1-8b-instant"

async def extract_themes(situation: str) -> str:
    r = client.chat.completions.create(
        model=MODEL, max_tokens=60,
        messages=[{"role":"user","content":f"Extract core spiritual themes from this situation as a 10-15 word Quran search query. Return ONLY the query.\n\nSituation: {situation}"}]
    )
    return r.choices[0].message.content.strip()

async def generate_reflection(situation: str, verse_key: str, translation: str) -> str:
    r = client.chat.completions.create(
        model=MODEL, max_tokens=150,
        messages=[{"role":"user","content":f"Write a warm 2-3 sentence reflection connecting this Quran verse to the person's situation. Second person, hopeful, not preachy.\n\nSituation: {situation}\nVerse ({verse_key}): {translation}\n\nReflection:"}]
    )
    return r.choices[0].message.content.strip()

async def pick_verses(situation: str, candidates: list, count: int = 6) -> list:
    if not candidates:
        return []
    candidate_text = "\n".join([f"{v['verse_key']}: {v.get('translation','')[:100]}" for v in candidates])
    r = client.chat.completions.create(
        model=MODEL, max_tokens=60,
        messages=[{"role":"user","content":f"Pick the {count} most relevant verse keys for this situation. Return ONLY comma-separated verse keys.\n\nSituation: {situation}\n\nCandidates:\n{candidate_text}"}]
    )
    keys = [k.strip() for k in r.choices[0].message.content.strip().split(",")]
    return keys[:count]
