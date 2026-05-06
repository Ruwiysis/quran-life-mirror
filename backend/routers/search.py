# -*- coding: utf-8 -*-
from fastapi import APIRouter, HTTPException
from models import SituationRequest, VerseResult
from services.claude_service import generate_reflection, pick_verses, generate_all_reflections
from services.quran_service import get_verse, get_audio_url, get_surah_name
from typing import List
import asyncio, random

router = APIRouter()

PHRASE_DB = [
    (["i cant stop thinking","overthinking","my mind wont stop","racing thoughts","what if","worst case"], ["anxiety","stress"]),
    (["anxious","anxiety","panic attack","chest tight","cant breathe","shaking"], ["anxiety"]),
    (["worried about","so worried","fear of","terrified","scared of","afraid of"], ["anxiety","fear"]),
    (["uncertain","uncertainty","unpredictable","what will happen","dont know what"], ["anxiety","trust_allah"]),
    (["exam","interview","presentation","public speaking","performance"], ["anxiety","stress"]),
    (["ما اقدر اوقف تفكيري","تفكير زايد","خايف","خوف","قلق","توتر","ضغط"], ["anxiety","stress"]),
    (["نوبة هلع","صدري ضيق","ما اقدر اتنفس","رعشة"], ["anxiety"]),
    (["خايف من","قلقان على","مو عارف شيصير","مو متأكد"], ["anxiety","trust_allah"]),
    (["feel so sad","deeply sad","overwhelming sadness","cant stop crying","burst into tears"], ["sad","grief"]),
    (["depressed","depression","no energy","empty inside","numb","feel nothing"], ["sad","depression"]),
    (["crying myself to sleep","cry every night","tears wont stop","sobbing"], ["sad","grief"]),
    (["life feels pointless","whats the point","why bother","nothing matters"], ["sad","purpose","depression"]),
    (["feel so heavy","cant get out of bed","no motivation","burden"], ["sad","depression"]),
    (["unhappy","miserable","joyless","no happiness","havent smiled"], ["sad"]),
    (["حزين","حزينة","زهقت","مو قادر","ما في طاقة","خدر","ما احس بشي"], ["sad","depression"]),
    (["ابكي كل ليلة","دموعي ما توقف","بكاء"], ["sad","grief"]),
    (["الحياة بلا معنى","ما في فايدة","ليش اكمل"], ["sad","purpose","depression"]),
    (["تعبان","ما قادر اقوم","ما في حماس","ثقيل"], ["sad","depression"]),
    (["someone died","passed away","lost my","death of","funeral","grieving"], ["grief","death"]),
    (["miss them so much","miss him","miss her","cant believe theyre gone"], ["grief"]),
    (["lost my job","got fired","laid off","unemployed","lost my business"], ["grief","failure","money"]),
    (["breakup","broke up","divorce","relationship ended","she left","he left"], ["grief","heartbreak","lonely"]),
    (["lost everything","lost my home","lost my savings","starting over"], ["grief","failure","trust_allah"]),
    (["مات","توفي","فقدت","وفاة","جنازة","حداد"], ["grief","death"]),
    (["اشتاقله","اشتاقلها","ليته هنا"], ["grief"]),
    (["فقدت شغلي","طردوني","بلا عمل","خسرت مشروعي"], ["grief","failure","money"]),
    (["انفصلنا","طلاق","تركتني","تركني"], ["grief","heartbreak","lonely"]),
    (["no one understands","nobody gets me","feel so alone","completely alone","isolated"], ["lonely"]),
    (["no friends","lost all my friends","friends abandoned","people left me"], ["lonely"]),
    (["no one to talk to","no one cares","nobody checks on me","invisible"], ["lonely"]),
    (["ما احد يفهمني","لحالي","وحيد","وحيدة","معزول"], ["lonely"]),
    (["ما عندي اصدقاء","الاصدقاء تركوني","الناس تخلوا عني"], ["lonely"]),
    (["محد يسأل عني","محد يهتم","غير مرئي"], ["lonely"]),
    (["i sinned","committed a sin","done something haram","feel so guilty","deeply regret"], ["shame","forgive"]),
    (["ashamed of myself","cant forgive myself","disgusted with myself","lowest point"], ["shame","forgive"]),
    (["addiction","pornography","gambling","drinking","drugs","cant stop sinning"], ["shame","forgive","patience"]),
    (["lied","cheated","betrayed","hurt someone","broke someones trust"], ["shame","forgive"]),
    (["zina","major sin","feel impure","feel dirty after sin"], ["shame","forgive","hope"]),
    (["اخطأت","ذنب","حرام","اشعر بالذنب","ندم شديد"], ["shame","forgive"]),
    (["اخجل من نفسي","ما اقدر اسامح نفسي","اشمئز من نفسي"], ["shame","forgive"]),
    (["ادمان","اباحي","قمار","كحول","مخدرات","ما اقدر اوقف"], ["shame","forgive","patience"]),
    (["كذبت","خنت","خيانة","آذيت احد","كسرت ثقة"], ["shame","forgive"]),
    (["زنا","كبيرة","احس بالنجاسة","وسخ بعد الذنب"], ["shame","forgive","hope"]),
    (["so angry","furious","rage","want to explode","losing my temper"], ["anger"]),
    (["frustrated","so frustrated","nothing works","fed up"], ["anger","patience"]),
    (["unfairly treated","oppressed","injustice","wronged","betrayed"], ["anger","patience","trust_allah"]),
    (["hate my life","hate everything","hate myself"], ["anger","sad"]),
    (["غاضب","غاضبة","غضب","بدي انفجر","فقدت اعصابي"], ["anger"]),
    (["محبط","محبطة","ما في شي يشتغل","كل شي فاشل","زهقت"], ["anger","patience"]),
    (["يعاملوني بظلم","مظلوم","ظلم","خانوني"], ["anger","patience","trust_allah"]),
    (["اكره حياتي","اكره كل شي","اكره نفسي"], ["anger","sad"]),
    (["i failed","failed again","keep failing","failure after failure"], ["failure","patience"]),
    (["not good enough","never good enough","worthless","useless","hopeless"], ["failure","sad"]),
    (["gave up","want to give up","about to quit","cant go on"], ["failure","patience","hope"]),
    (["rejected","rejection","turned down","not accepted","denied"], ["failure","patience"]),
    (["comparing myself","everyone else succeeds","why not me","others have more"], ["failure","grateful","purpose"]),
    (["فشلت","فشل مرة ثانية","اكمل الفشل"], ["failure","patience"]),
    (["ما اكفي","مو كافي ابدا","بلا قيمة","عديم الفائدة","بلا امل"], ["failure","sad"]),
    (["استسلمت","بدي استسلم","ما اقدر اكمل"], ["failure","patience","hope"]),
    (["رفضوني","رفض","ما قبلوني","رُفض طلبي"], ["failure","patience"]),
    (["اقارن نفسي","كل الناس تنجح","ليش مو انا","الناس عندهم اكثر"], ["failure","grateful","purpose"]),
    (["what is my purpose","why am i here","dont know my purpose","lost my direction"], ["purpose"]),
    (["feel lost","completely lost","no direction","dont know where to go"], ["purpose","lost"]),
    (["life has no meaning","meaningless","empty life","whats the point of life"], ["purpose","sad"]),
    (["dont know what to do","confused","at a crossroads","big decision"], ["purpose","trust_allah"]),
    (["wasted my life","wasted years","too late for me","missed my chance"], ["purpose","hope","regret"]),
    (["ما هو هدفي","ليش انا هنا","ما اعرف هدفي","ضيعت اتجاهي"], ["purpose"]),
    (["ضايع","ضايعة","بلا اتجاه","ما ادري وين اروح"], ["purpose","lost"]),
    (["الحياة بلا معنى","بلا هدف","حياة فارغة"], ["purpose","sad"]),
    (["ما ادري شو اسوي","محتار","على مفترق طرق","قرار صعب"], ["purpose","trust_allah"]),
    (["ضيعت حياتي","ضيعت سنين","فات الاوان","ضيعت الفرصة"], ["purpose","hope","regret"]),
    (["why is allah doing this","why me","why is god punishing me","what did i do wrong"], ["trust_allah","test"]),
    (["feel far from allah","disconnected from allah","lost my faith","weak iman"], ["trust_allah","spiritual"]),
    (["dua not answered","prayers not answered","allah doesnt hear me"], ["trust_allah","patience"]),
    (["losing hope in allah","doubt","questioning faith","is allah there"], ["trust_allah","hope"]),
    (["ليش الله يسوي كذا","ليش انا","ليش الله يعاقبني","شو غلطي"], ["trust_allah","test"]),
    (["بعيد عن الله","منقطع عن الله","ضعف الايمان","ايماني ضعيف"], ["trust_allah","spiritual"]),
    (["دعائي ما يتجاوب","صلاتي ما تتجاوب","احس الله ما يسمعني"], ["trust_allah","patience"]),
    (["فاقد الامل بالله","شك","اسأل عن ايماني","هل الله موجود"], ["trust_allah","hope"]),
    (["going through so much","too many problems","one thing after another","endless hardship"], ["test","patience"]),
    (["health problems","sick","illness","chronic pain","disability","hospital"], ["test","patience","trust_allah"]),
    (["financial crisis","cant pay bills","in debt","poverty","struggling financially"], ["money","test","patience"]),
    (["family problems","toxic family","abusive","difficult parents","family conflict"], ["family","patience","anger"]),
    (["marriage problems","spouse issues","unhappy marriage","considering divorce"], ["family","patience","trust_allah"]),
    (["مبتلى","مشاكل كثيرة","شي بعد شي","صعوبات لا تنتهي"], ["test","patience"]),
    (["مشاكل صحية","مريض","مرض","الم مزمن","اعاقة","مستشفى"], ["test","patience","trust_allah"]),
    (["ازمة مالية","ما اقدر ادفع","ديون","فقر","الوضع المادي صعب"], ["money","test","patience"]),
    (["مشاكل عيلية","عيلة سامة","عنف","والدين صعبين","خلاف عيلي"], ["family","patience","anger"]),
    (["مشاكل زواج","مشاكل مع الزوج","زواج تعيس","افكر في الطلاق"], ["family","patience","trust_allah"]),
    (["want to be better","want to improve","trying to change","want to grow"], ["hope","purpose"]),
    (["alhamdulillah","grateful","so blessed","thank allah","feel thankful"], ["grateful"]),
    (["things are getting better","starting to heal","feeling hopeful"], ["hope","grateful"]),
    (["want to get closer to allah","strengthen my faith","better muslim"], ["spiritual","hope"]),
    (["ramadan","fasting","prayer","salah","quran","islam"], ["spiritual","grateful"]),
    (["ابي اتحسن","ابي اتغير","احاول اتغير","ابي انمو"], ["hope","purpose"]),
    (["الحمد لله","شاكر","ممنون","شاكرين لله","اشعر بالامتنان"], ["grateful"]),
    (["الامور تتحسن","بدأت اتعافى","محس بامل"], ["hope","grateful"]),
    (["ابي اقترب من الله","اقوي ايماني","اكون مسلم احسن"], ["spiritual","hope"]),
    (["رمضان","صيام","صلاة","قرآن","إسلام"], ["spiritual","grateful"]),
    (["overwhelmed","too much on my plate","cant handle","juggling too much"], ["stress","anxiety"]),
    (["burnout","exhausted","drained","running on empty","no energy left"], ["stress","patience"]),
    (["work stress","job stress","boss","coworkers","workplace","career pressure"], ["stress","anxiety"]),
    (["student stress","failing classes","academic pressure","grades","university"], ["stress","anxiety","failure"]),
    (["مغلوب","ما اقدر اتحمل","فوق طاقتي","ما اقدر اتعامل"], ["stress","anxiety"]),
    (["محترق","منهك","فارغ","ما في طاقة","تعبت تعب زايد"], ["stress","patience"]),
    (["ضغط شغل","ضغط وظيفة","المدير","زملاء العمل","ضغط مهني"], ["stress","anxiety"]),
    (["ضغط دراسة","راسب","ضغط اكاديمي","درجات","جامعة"], ["stress","anxiety","failure"]),
]

VERSE_THEMES = {
    "anxiety":      ["2:286","2:155","9:51","13:28","3:173","2:45","2:153","65:3"],
    "stress":       ["94:5","94:6","2:286","13:28","65:3","2:153","3:139"],
    "sad":          ["94:5","93:3","2:286","39:53","84:6","11:88","93:5"],
    "depression":   ["94:5","94:6","39:53","93:3","2:286","13:28","3:139"],
    "grief":        ["2:156","2:157","21:83","12:86","93:3","39:53","94:1"],
    "death":        ["2:156","3:185","29:57","21:35","39:42","2:286"],
    "heartbreak":   ["94:5","94:6","2:286","39:53","93:3","13:28","2:153"],
    "lonely":       ["50:16","2:186","57:4","58:7","9:40","16:128","2:153"],
    "shame":        ["39:53","4:110","3:135","25:70","66:8","11:114","2:37"],
    "forgive":      ["39:53","4:110","3:135","2:37","7:23","11:90","25:68"],
    "failure":      ["94:5","94:6","3:139","2:286","11:88","39:10","65:3"],
    "patience":     ["2:153","2:155","3:200","39:10","16:96","103:3","2:45"],
    "anger":        ["3:134","42:37","7:199","16:126","41:34","2:263"],
    "purpose":      ["51:56","67:2","23:115","3:191","6:162","98:5","2:201"],
    "lost":         ["6:116","2:2","10:57","16:64","27:77","17:9"],
    "hope":         ["39:53","94:5","94:6","93:5","2:286","65:3","18:10"],
    "grateful":     ["14:7","2:152","16:18","31:12","76:3","55:13"],
    "test":         ["2:155","2:156","2:157","3:142","29:2","67:2","94:5"],
    "trust_allah":  ["65:3","9:51","13:28","2:286","3:173","9:40","58:7"],
    "spiritual":    ["51:56","2:186","50:16","13:28","2:152","7:205"],
    "money":        ["2:261","3:92","9:60","64:16","65:3","2:267"],
    "family":       ["4:36","17:23","31:14","46:15","2:177","4:1"],
    "fear":         ["2:286","9:51","3:173","13:28","65:3","2:153"],
    "regret":       ["39:53","4:110","3:135","25:70","2:37","93:3"],
}

def detect_emotions_smart(situation: str) -> List[str]:
    sit = situation.lower()
    scores = {}
    for phrases, emotions in PHRASE_DB:
        match_count = sum(1 for phrase in phrases if phrase in sit)
        if match_count > 0:
            for emotion in emotions:
                scores[emotion] = scores.get(emotion, 0) + match_count
    if not scores:
        fallback = {
            "sad":         ["sad","حزين","حزينة","زهقت"],
            "anxiety":     ["anxious","worried","قلق","خايف"],
            "hope":        ["hope","better","امل","تحسن"],
            "patience":    ["tired","wait","تعبت","صبر"],
            "shame":       ["shame","guilt","ذنب","غلطة"],
            "purpose":     ["lost","confused","ضايع","هدف"],
            "trust_allah": ["allah","dua","الله","دعاء","ايمان"],
            "test":        ["hardship","trial","ابتلاء","صعوبة"],
        }
        for emotion, kws in fallback.items():
            for kw in kws:
                if kw in sit:
                    scores[emotion] = scores.get(emotion, 0) + 1
    if not scores:
        return ["hope","patience","trust_allah"]
    sorted_emotions = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [e for e, _ in sorted_emotions[:4]]

def build_verse_pool(emotions: List[str]) -> List[str]:
    pool = []
    for emotion in emotions:
        pool += VERSE_THEMES.get(emotion, [])
    pool += VERSE_THEMES["hope"]
    seen = set()
    unique = [v for v in pool if not (v in seen or seen.add(v))]
    random.shuffle(unique)
    return unique[:16]

@router.get("/search", response_model=List[VerseResult])
async def search_situation_get(q: str):
    if not q or len(q.strip()) < 5:
        raise HTTPException(400, "Please provide a search query with at least 5 characters (?q=your_situation)")
    request = SituationRequest(situation=q)
    return await search_situation(request)

@router.post("/search", response_model=List[VerseResult])
async def search_situation(request: SituationRequest):
    if not request.situation or len(request.situation.strip()) < 5:
        raise HTTPException(400, "Please describe your situation in more detail.")
    try:
        emotions = detect_emotions_smart(request.situation)
        verse_pool = build_verse_pool(emotions)
        try:
            picked_keys = await pick_verses(request.situation, [{"verse_key": k} for k in verse_pool], count=6)
        except Exception:
            picked_keys = verse_pool[:6]

        relevance_scores = {}
        for i, key in enumerate(picked_keys):
            relevance_scores[key] = round(1.0 - (i * 0.08), 2)

        async def fetch_and_reflect(verse_key: str):
            try:
                # ✅ No tafsir here — fetched lazily on demand via /api/verse/{key}/tafsir
                verse_data, audio_url, surah_name = await asyncio.gather(
                    get_verse(verse_key),
                    get_audio_url(verse_key),
                    get_surah_name(verse_key)
                )
                if not verse_data or not verse_data.get("translation"):
                    return None
                reflection = await generate_reflection(
                    request.situation,
                    verse_key,
                    verse_data.get("translation", ""),
                    tafsir_en="",
                    tafsir_ar=""
                )
                return VerseResult(
                    verse_key=verse_key,
                    surah_name=surah_name,
                    arabic_text=verse_data.get("arabic", ""),
                    translation=verse_data.get("translation", ""),
                    audio_url=audio_url or "",
                    reflection=reflection,
                    relevance_score=relevance_scores.get(verse_key, 0.5),
                    tafsir_en=None,
                    tafsir_ar=None,
                )
            except Exception as e:
                print(f"Error processing verse {verse_key}: {e}")
                return None

        tasks = [fetch_and_reflect(key) for key in picked_keys]
        results_raw = await asyncio.gather(*tasks, return_exceptions=True)
        results = [r for r in results_raw if isinstance(r, VerseResult)]
        results.sort(key=lambda x: x.relevance_score, reverse=True)
        if not results:
            raise HTTPException(500, "Could not fetch verses. Please try again.")
        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")

@router.get("/verse/{verse_key:path}/tafsir")
async def get_verse_tafsir(verse_key: str, lang: str = "en"):
    """Lazy tafsir endpoint — called only when user clicks the tafsir button."""
    from services.quran_service import _fetch_tafsir_en, _fetch_tafsir_ar
    try:
        if lang == "ar":
            text = await _fetch_tafsir_ar(verse_key)
        else:
            text = await _fetch_tafsir_en(verse_key)
        return {"verse_key": verse_key, "lang": lang, "tafsir": text or ""}
    except Exception as e:
        raise HTTPException(500, f"Could not fetch tafsir: {e}")