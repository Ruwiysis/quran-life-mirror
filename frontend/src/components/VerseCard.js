import React, { useState, useContext } from 'react';
import axios from 'axios';
import { LangContext } from '../App';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '';

const T = {
  en: {
    reflection: 'Personal Reflection', saveJournal: '+ Save to Journal', saved: '✓ Saved',
    listen: '▶ Listen', stop: '⏸ Stop',
    didYouKnow: 'Did you know?', addNote: 'Add your own note...',
    saveBookmark: '+ Bookmark Verse', bookmarked: '✓ Bookmarked',
    tafsirLabel: '📖 Tafsir (Ibn Kathir)',
    howFeel: 'How does this make you feel?',
    loginToBookmark: 'Please log in to bookmark verses.',
  },
  ar: {
    reflection: 'تأمّل شخصي', saveJournal: '+ أضف للمذكّرة', saved: '✓ تم الحفظ',
    listen: '▶ استمع', stop: '⏸ إيقاف',
    didYouKnow: 'هل تعلم؟', addNote: 'أضف ملاحظتك الشخصية...',
    saveBookmark: '+ حفظ الآية', bookmarked: '✓ تم الحفظ',
    tafsirLabel: '📖 تفسير ابن كثير',
    howFeel: 'كيف تشعر الآن؟',
    loginToBookmark: 'يرجى تسجيل الدخول لحفظ العلامات.',
  }
};

const DID_YOU_KNOW = {
  en: {
    '94:5': 'This verse is repeated twice in a row — scholars say the repetition is deliberate: ease will come not just once, but again.',
    '2:286': 'The last verse of Surah Al-Baqarah. The Prophet said whoever recites the last two verses at night, they will suffice him.',
    '39:53': 'One of the most hope-filled verses in the Quran — revealed as a direct address to those who had sinned greatly.',
    '50:16': 'Allah says He is closer to you than your jugular vein — He knows every heartbeat, every thought.',
    '2:153': 'Patience and prayer together are a complete Quranic prescription for hardship.',
    '13:28': 'In the remembrance of Allah do hearts find rest — recited by millions when anxious or afraid.',
    '93:3': 'Surah Ad-Duha was revealed during a period when the Prophet was in deep distress.',
  },
  ar: {
    '94:5': 'هذه الآية تتكرر مرتين متتاليتين — يقول العلماء إن التكرار متعمّد: اليسر آتٍ مرة بعد مرة.',
    '2:286': 'آخر آية في سورة البقرة. قال النبي ﷺ: من قرأ الآيتين الأخيرتين في ليلة كفتاه.',
    '39:53': 'من أكثر الآيات إشراقاً بالأمل، نزلت خطاباً مباشراً لمن أذنبوا كثيراً.',
    '50:16': 'يقول الله تعالى إنه أقرب إليك من حبل الوريد — يعلم كل نبضة وكل خاطر.',
    '2:153': 'الصبر والصلاة معاً وصفة قرآنية كاملة لمواجهة الشدائد.',
    '13:28': 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ — يرددها الملايين عند القلق والخوف.',
    '93:3': 'نزلت سورة الضحى في فترة كان النبي ﷺ يمر فيها بضيق شديد.',
  }
};

function stripArabic(text) {
  if (!text) return '';
  return text
    .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g, '')
    .replace(/[\u00AB\u00BB\u2039\u203A]/g, '')
    .replace(/\s*:\s*\.\.\./g, '.')
    .replace(/\s*\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function VerseCard({ verse, situation, index }) {
  const { lang } = useContext(LangContext);
  const t = T[lang];
  const isAr = lang === 'ar';
  const { isLoggedIn, token, refreshAccessToken } = useAuth();

  const [saved, setSaved] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [note, setNote] = useState('');
  const [mood, setMood] = useState('reflective');
  const [hovered, setHovered] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [audio] = useState(() => verse.audio_url ? new Audio(verse.audio_url) : null);

  const fact = DID_YOU_KNOW[lang]?.[verse.verse_key];
  const rawTafsir = isAr ? verse.tafsir_ar : verse.tafsir_en;
  const tafsirText = isAr ? rawTafsir : (rawTafsir ? stripArabic(rawTafsir) : '');

  const MOODS = ['grateful', 'hopeful', 'reflective', 'at peace', 'still struggling'];
  const MOODS_AR = ['ممتنّ', 'متفائل', 'متأمّل', 'مطمئن', 'أحتاج مزيداً'];
  const fontFamily = isAr ? "'Noto Sans Arabic',sans-serif" : "'DM Sans',sans-serif";

  const handleSave = async () => {
    if (saved) return;
    try {
      await axios.post(API + '/api/journal', {
        situation, verse_key: verse.verse_key,
        arabic_text: verse.arabic_text, translation: verse.translation,
        reflection: verse.reflection, personal_note: note, mood,
      });
      if (isLoggedIn && token) {
        try {
          await axios.post(API + '/api/user/note',
            { verse_key: verse.verse_key, note_text: verse.reflection + (note ? '\n\n' + note : ''), situation },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (e) { console.log('QF note save skipped'); }
      }
      setSaved(true);
    } catch (e) {
      alert('Could not save: ' + (e?.response?.data?.detail || e.message));
    }
  };

  const handleBookmark = async () => {
    if (bookmarked) return;
    if (!isLoggedIn || !token) { alert(t.loginToBookmark); return; }
    let retries = 0;
    while (retries < 2) {
      try {
        await axios.post(API + '/api/user/bookmark',
          { verse_key: verse.verse_key },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBookmarked(true);
        return;
      } catch (e) {
        if (e.response?.status === 403 && e.response?.data?.message?.includes('invalid_token') && refreshAccessToken && retries === 0) {
          retries++;
          await refreshAccessToken();
          continue;
        }
        alert('Could not bookmark: ' + (e?.response?.data?.detail || e.message));
        break;
      }
    }
  };

  const handleAudio = () => {
    if (!audio) return;
    if (playing) { audio.pause(); audio.currentTime = 0; setPlaying(false); }
    else { audio.play(); setPlaying(true); audio.onended = () => setPlaying(false); }
  };

  return (
    <div className="fade-up" style={{
      background: 'linear-gradient(135deg,rgba(30,38,64,0.85) 0%,rgba(20,25,41,0.9) 100%)',
      border: `1px solid ${hovered ? 'rgba(201,168,76,0.45)' : 'rgba(201,168,76,0.2)'}`,
      borderRadius: '18px', padding: '36px', marginBottom: '20px',
      backdropFilter: 'blur(12px)', transition: 'all 0.3s',
      position: 'relative', overflow: 'hidden',
      boxShadow: hovered ? '0 8px 40px rgba(201,168,76,0.1)' : 'none',
      animationDelay: `${index * 0.1}s`,
      direction: isAr ? 'rtl' : 'ltr',
      fontFamily,
    }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>

      <span style={{ position: 'absolute', top: 16, right: isAr ? 'auto' : 20, left: isAr ? 20 : 'auto', fontSize: '1.4rem', opacity: 0.1 }}>✦</span>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#c9a84c', letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(201,168,76,0.12)', borderRadius: '20px', padding: '4px 12px' }}>
          {verse.surah_name} · {verse.verse_key}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'rgba(245,239,230,0.3)' }}>
          {Math.round(verse.relevance_score * 100)}% match
        </span>
      </div>

      <div style={{
        fontFamily: "'Amiri',serif", fontSize: '1.8rem', lineHeight: 2.2,
        color: 'rgba(245,239,230,0.95)', direction: 'rtl', textAlign: 'right',
        marginBottom: '20px', padding: '18px 22px',
        background: 'rgba(201,168,76,0.06)', borderRadius: '10px',
        borderRight: '3px solid rgba(201,168,76,0.4)',
      }}>{verse.arabic_text}</div>

      {!isAr && (
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.15rem', fontStyle: 'italic', color: 'rgba(245,239,230,0.8)', lineHeight: 1.8, marginBottom: '16px' }}>
          "{verse.translation}"
        </p>
      )}

      {fact && (
        <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', marginBottom: '6px' }}>{t.didYouKnow}</div>
          <p style={{ fontSize: '0.88rem', color: 'rgba(245,239,230,0.6)', lineHeight: 1.7, fontFamily, margin: 0 }}>{fact}</p>
        </div>
      )}

      {tafsirText && (
        <div style={{ marginBottom: '16px' }}>
          <button onClick={() => setShowTafsir(p => !p)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.75rem', color: 'rgba(201,168,76,0.7)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: 0, fontFamily, display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span>{showTafsir ? '▾' : '▸'}</span>
            {t.tafsirLabel}
          </button>
          {showTafsir && (
            <div style={{
              marginTop: '10px', background: 'rgba(201,168,76,0.04)',
              border: '1px solid rgba(201,168,76,0.12)', borderRadius: '10px',
              padding: '18px 20px',
              minHeight: '180px',
              maxHeight: 'none',
              height: 'auto',
              overflowY: 'visible',
            }}>
              <p style={{
                fontSize: '0.95rem', color: 'rgba(245,239,230,0.78)',
                lineHeight: 1.95, margin: 0, fontFamily,
                direction: isAr ? 'rtl' : 'ltr',
                textAlign: isAr ? 'right' : 'left',
                overflowWrap: 'anywhere',
                whiteSpace: 'pre-wrap',
              }}>{tafsirText}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent)', margin: '16px 0' }} />

      <div style={{ fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', marginBottom: '10px' }}>{t.reflection}</div>
      <p style={{ fontSize: '0.95rem', color: 'rgba(245,239,230,0.7)', lineHeight: 1.8, marginBottom: '20px', fontFamily }}>{verse.reflection}</p>

      {!saved && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,239,230,0.3)', marginBottom: '8px', fontFamily }}>{t.howFeel}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(isAr ? MOODS_AR : MOODS).map((m, i) => (
              <button key={m} onClick={() => setMood(MOODS[i])} style={{
                fontSize: '0.75rem', padding: '4px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                background: mood === MOODS[i] ? 'rgba(201,168,76,0.25)' : 'rgba(245,239,230,0.06)',
                color: mood === MOODS[i] ? '#c9a84c' : 'rgba(245,239,230,0.45)',
                fontFamily, transition: 'all 0.2s',
              }}>{m}</button>
            ))}
          </div>
        </div>
      )}

      {!saved && (
        <div style={{ marginBottom: '16px' }}>
          <textarea placeholder={t.addNote} value={note} onChange={e => setNote(e.target.value)} style={{
            width: '100%', minHeight: '70px', background: 'rgba(10,15,30,0.5)',
            border: '1px solid rgba(201,168,76,0.15)', borderRadius: '10px',
            padding: '12px 16px', color: '#f5efe6', fontSize: '0.88rem',
            fontFamily, resize: 'vertical', outline: 'none',
            direction: isAr ? 'rtl' : 'ltr',
          }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={handleSave} style={{
          fontSize: '0.8rem', fontWeight: 500, padding: '9px 20px', borderRadius: '20px',
          cursor: saved ? 'default' : 'pointer', border: 'none', fontFamily, transition: 'all 0.2s',
          background: saved ? 'rgba(201,168,76,0.25)' : 'rgba(201,168,76,0.15)',
          color: saved ? '#e8c97a' : '#c9a84c',
          outline: saved ? 'none' : '1px solid rgba(201,168,76,0.3)',
        }}>{saved ? t.saved : t.saveJournal}</button>

        {isLoggedIn && (
          <button onClick={handleBookmark} style={{
            fontSize: '0.8rem', fontWeight: 500, padding: '9px 20px', borderRadius: '20px',
            cursor: bookmarked ? 'default' : 'pointer', border: 'none', fontFamily, transition: 'all 0.2s',
            background: bookmarked ? 'rgba(100,180,100,0.25)' : 'rgba(100,180,100,0.15)',
            color: bookmarked ? '#a8e8a8' : '#7cb87c',
            outline: bookmarked ? 'none' : '1px solid rgba(100,180,100,0.3)',
          }}>{bookmarked ? t.bookmarked : t.saveBookmark}</button>
        )}

        {verse.audio_url && (
          <button onClick={handleAudio} style={{
            fontSize: '0.8rem', padding: '9px 20px', borderRadius: '20px',
            background: 'rgba(245,239,230,0.06)', color: 'rgba(245,239,230,0.6)',
            border: '1px solid rgba(245,239,230,0.12)', cursor: 'pointer',
            fontFamily, transition: 'all 0.2s',
          }}>{playing ? t.stop : t.listen}</button>
        )}
      </div>
    </div>
  );
}