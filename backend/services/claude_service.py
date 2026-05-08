import os
import json
import re
from anthropic import Anthropic

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
MODEL = "claude-sonnet-4-20250514"

_client = Anthropic(api_key=ANTHROPIC_API_KEY)


def _extract_json_array(text: str):
    """
    Extract a JSON array from model output. Accepts cases where the model
    wraps/embeds JSON in surrounding text.
    """
    text = text.strip()
    # Try direct parse first
    try:
        val = json.loads(text)
        if isinstance(val, list):
            return val
    except Exception:
        pass

    # Fallback: find first [...] block
    m = re.search(r"\[[\s\S]*\]", text)
    if not m:
        return None
    try:
        val = json.loads(m.group(0))
        if isinstance(val, list):
            return val
    except Exception:
        return None
    return None


async def pick_verses(situation: str, verse_pool, count: int = 6) -> list:
    """
    Spec contract:
    - Respond with ONLY a JSON array of verse_key strings.
    - Input verse_pool is expected to be a list of verse_key strings.
    """
    if not verse_pool:
        return []

    # Ensure verse_pool is list[str]
    verse_pool_strings = [str(v) for v in verse_pool]

    prompt = (
        "You are a Quran scholar. Given this situation: "
        f"\"{situation}\"\n"
        "From these verse keys: "
        f"{verse_pool_strings}\n"
        f"Pick the {count} most spiritually relevant verse keys for this person.\n"
        "Respond with ONLY a JSON array of verse_key strings, e.g. "
        "[\"2:286\",\"94:5\",\"13:28\",\"39:53\",\"2:153\",\"3:173\"]\n"
        "No explanation. Just the JSON array."
    )

    try:
        resp = _client.messages.create(
            model=MODEL,
            max_tokens=200,
            temperature=0.2,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = resp.content[0].text if resp.content else ""
        parsed = _extract_json_array(raw)
        if not isinstance(parsed, list):
            raise ValueError("Failed to parse JSON array")

        # Normalize to strings and deduplicate preserving order
        out = []
        seen = set()
        for x in parsed:
            k = str(x).strip()
            if k and k not in seen:
                seen.add(k)
                out.append(k)
        return out[:count]
    except Exception as e:
        # Fallback: first N from pool
        return [str(v) for v in verse_pool_strings[:count]]


def _generic_reflection() -> str:
    return "This verse speaks to your situation — may it bring you peace and clarity."


async def generate_reflection(
    situation: str,
    verse_key: str,
    translation: str,
    tafsir_en: str = "",
    tafsir_ar: str = "",
) -> str:
    """
    Spec contract (English behavior required by master prompt):
    Prompt:
    You are a compassionate Islamic scholar and spiritual guide.
    ...
    Just the reflection.
    """
    prompt = (
        "You are a compassionate Islamic scholar and spiritual guide.\n"
        f"A person is going through this: \"{situation}\"\n"
        f"This Quran verse was selected for them ({verse_key}): \"{translation}\"\n"
        "Write a 2-3 sentence personal reflection connecting the verse to their situation.\n"
        "Warm, empathetic, Islamic in tone. Not too long. Speak directly to them.\n"
        "Do not quote the verse again. Do not add Islamic greetings.\n"
        "Just the reflection."
    )

    try:
        # Tafsir is currently included in spec for context; we pass it implicitly.
        # If provided, include in the prompt after the instruction, without changing required output style.
        if tafsir_en or tafsir_ar:
            tafsir_context = f"\n\nTafsir context (for scholarly guidance):\nEN: {tafsir_en or ''}\nAR: {tafsir_ar or ''}\n"
            prompt = prompt + tafsir_context + "\nRemember: write only the reflection."

        resp = _client.messages.create(
            model=MODEL,
            max_tokens=220,
            temperature=0.4,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = resp.content[0].text.strip() if resp.content else ""
        # Basic sanity
        if not raw:
            return _generic_reflection()
        return raw
    except Exception:
        return _generic_reflection()


async def generate_all_reflections(situation: str, verses: list) -> list:
    """
    Not used by the current /api/search implementation, but keep for compatibility.
    Returns generic reflections per verse on failure.
    """
    out = []
    for v in verses or []:
        try:
            out.append(await generate_reflection(
                situation=situation,
                verse_key=v.get("verse_key", ""),
                translation=v.get("translation", ""),
                tafsir_en=v.get("tafsir_en", "") or "",
                tafsir_ar=v.get("tafsir_ar", "") or "",
            ))
        except Exception:
            out.append(_generic_reflection())
    return out
