import React, { useState, useContext } from 'react';
import axios from 'axios';
import { LangContext } from '../App';
import { useAuth } from '../context/AuthContext';
import { T, DID_YOU_KNOW } from '../translations';

export default function VerseCard({ verse, situation, index }) {
  const { lang } = useContext(LangContext);
  const t = T[lang].card;
  const isAr = lang === 'ar';
  const fontFamily = isAr ? "'Noto Sans Arabic', 'DM Sans', sans-serif" : "'DM Sans', sans-serif";
  const { isLoggedIn, token } = useAuth();

  const [saved, setSaved] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [note, setNote] = useState('');
  const [mood, setMood] = useState('reflective');
  const [hovered, setHovered] = useState(false);
  const [audio] = useState(() => verse.audio_url ? new Audio(verse.audio_url) : null);

  // Pull DID_YOU_KNOW from translations (language-aware)
  const fact = DID_YOU_KNOW[lang]?.[verse.verse_key];

  const handleSave = async () => {
    if (saved) return;
    try {
      if (isLoggedIn && token) {
        await axios.post(
          '/api/user/reflection',
          {
            verse_key: verse.verse_key,
            reflection_text: verse.reflection + (note ? '\n\n' + note : ''),
            situation,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      await axios.post('/api/journal', {
        situation, verse_key: verse.verse_key,
        arabic_text: verse.arabic_text, translation: verse.translation,
        reflection: verse.reflection, personal_note: note, mood,
      });
      setSaved(true);
    } catch (e) {
      alert('Could not save: ' + (e?.response?.data?.detail || e.message));
    }
  };

  const handleBookmark = async () => {
    if (bookmarked) return;
    try {
      if (isLoggedIn && token) {
        await axios.post(
          '/api/user/bookmark',
          { verse_key: verse.verse_key },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBookmarked(true);
      } else {
        alert(isAr ? 'يرجى تسجيل الدخول أولاً.' : 'Please log in to bookmark verses.');
      }
    } catch (e) {
      alert('Could not bookmark: ' + (e?.response?.data?.detail || e.message));
    }
  };

  const handleAudio = () => {
    if (!audio) return;
    if (playing) { audio.pause(); audio.currentTime = 0; setPlaying(false); }
    else { audio.play(); setPlaying(true); audio.onended = () => setPlaying(false); }
  };

  // Mood keys stay in English for data storage; labels flip per language
  const MOOD_KEYS = ['grateful', 'hopeful', 'reflective', 'at peace', 'still struggling'];

  // Bookmark label
  const bookmarkLabel = isAr
    ? (bookmarked ? '✓ تم الحفظ' : '+ حفظ')
    : (bookmarked ? '✓ Bookmarked' : '+ Bookmark');

  // Match % label
  const matchLabel = isAr
    ? `${Math.round(verse.relevance_score * 100)}% تطابق`
    : `${Math.round(verse.relevance_score * 100)}% match`;

  return (
    <div
      className="fade-up"
      style={{
        background: 'linear-gradient(135deg,rgba(30,38,64,0.85) 0%,rgba(20,25,41,0.9) 100%)',
        border: `1px solid ${hovered ? 'rgba(201,168,76,0.45)' : 'rgba(201,168,76,0.2)'}`,
        borderRadius: '18px', padding: '36px', marginBottom: '20px',
        backdropFilter: 'blur(12px)', transition: 'all 0.3s',
        position: 'relative', overflow: 'hidden',
        boxShadow: hovered ? '0 8px 40px rgba(201,168,76,0.1)' : 'none',
        animationDelay: `${index * 0.1}s`,
        direction: isAr ? 'rtl' : 'ltr',
        fontFamily,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Ornament */}
      <span style={{
        position: 'absolute', top: 16,
        right: isAr ? 'auto' : 20,
        left: isAr ? 20 : 'auto',
        fontSize: '1.4rem', opacity: 0.1,
      }}>✦</span>

      {/* Surah tag + match */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-block', fontSize: '0.72rem', fontWeight: 500,
          color: '#c9a84c', letterSpacing: '0.12em', textTransform: 'uppercase',
          background: 'rgba(201,168,76,0.12)', borderRadius: '20px', padding: '4px 12px',
          fontFamily,
        }}>
          {verse.surah_name} · {verse.verse_key}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'rgba(245,239,230,0.3)', letterSpacing: '0.06em', fontFamily }}>
          {matchLabel}
        </span>
      </div>

      {/* Arabic text — always RTL regardless of UI language */}
      <div style={{
        fontFamily: "'Amiri', serif", fontSize: '1.8rem', lineHeight: 2.2,
        color: 'rgba(245,239,230,0.95)', direction: 'rtl', textAlign: 'right',
        marginBottom: '20px', padding: '18px 22px',
        background: 'rgba(201,168,76,0.06)', borderRadius: '10px',
        borderRight: '3px solid rgba(201,168,76,0.4)',
      }}>
        {verse.arabic_text}
      </div>

      {/* Translation */}
      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: '1.15rem', fontStyle: 'italic',
        color: 'rgba(245,239,230,0.8)', lineHeight: 1.8, marginBottom: '16px',
      }}>
        "{verse.translation}"
      </p>

      {/* Did you know — language-aware from translations.js */}
      {fact && (
        <div style={{
          background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: '10px', padding: '14px 18px', marginBottom: '16px',
        }}>
          <div style={{
            fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.6)', marginBottom: '6px', fontFamily,
          }}>
            {isAr ? 'هل تعلم؟' : 'Did you know?'}
          </div>
          <p style={{ fontSize: '0.88rem', color: 'rgba(245,239,230,0.6)', lineHeight: 1.7, fontFamily }}>
            {fact}
          </p>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent)', margin: '16px 0' }} />

      {/* Reflection label */}
      <div style={{
        fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)',
        marginBottom: '10px', fontFamily,
      }}>
        {isAr ? 'تأمّل شخصي' : 'Personal Reflection'}
      </div>
      <p style={{ fontSize: '0.95rem', color: 'rgba(245,239,230,0.7)', lineHeight: 1.8, marginBottom: '20px', fontFamily }}>
        {verse.reflection}
      </p>

      {/* Mood selector */}
      {!saved && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'rgba(245,239,230,0.3)', marginBottom: '8px', fontFamily,
          }}>
            {t.howFeeling}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {MOOD_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setMood(key)}
                style={{
                  fontSize: '0.75rem', padding: '4px 12px', borderRadius: '20px',
                  border: 'none', cursor: 'pointer',
                  background: mood === key ? 'rgba(201,168,76,0.25)' : 'rgba(245,239,230,0.06)',
                  color: mood === key ? '#c9a84c' : 'rgba(245,239,230,0.45)',
                  fontFamily, transition: 'all 0.2s',
                }}
              >
                {t.moodLabels[key]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Personal note */}
      {!saved && (
        <div style={{ marginBottom: '16px' }}>
          <textarea
            placeholder={isAr ? 'أضف ملاحظتك الشخصية...' : 'Add your own note...'}
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{
              width: '100%', minHeight: '70px',
              background: 'rgba(10,15,30,0.5)',
              border: '1px solid rgba(201,168,76,0.15)', borderRadius: '10px',
              padding: '12px 16px', color: '#f5efe6',
              fontSize: '0.88rem', fontFamily, resize: 'vertical', outline: 'none',
              direction: isAr ? 'rtl' : 'ltr',
              textAlign: isAr ? 'right' : 'left',
            }}
          />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {/* Save to Journal */}
        <button
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.06em',
            padding: '9px 20px', borderRadius: '20px',
            cursor: saved ? 'default' : 'pointer',
            border: 'none', fontFamily, transition: 'all 0.2s',
            background: saved ? 'rgba(201,168,76,0.25)' : 'rgba(201,168,76,0.15)',
            color: saved ? '#e8c97a' : '#c9a84c',
            outline: saved ? 'none' : '1px solid rgba(201,168,76,0.3)',
          }}
        >
          {saved ? t.saved : t.save}
        </button>

        {/* Bookmark (logged-in only) */}
        {isLoggedIn && (
          <button
            onClick={handleBookmark}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.06em',
              padding: '9px 20px', borderRadius: '20px',
              cursor: bookmarked ? 'default' : 'pointer',
              border: 'none', fontFamily, transition: 'all 0.2s',
              background: bookmarked ? 'rgba(100,180,100,0.25)' : 'rgba(100,180,100,0.15)',
              color: bookmarked ? '#a8e8a8' : '#7cb87c',
              outline: bookmarked ? 'none' : '1px solid rgba(100,180,100,0.3)',
            }}
          >
            {bookmarkLabel}
          </button>
        )}

        {/* Audio */}
        {verse.audio_url && (
          <button
            onClick={handleAudio}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '0.8rem', padding: '9px 20px', borderRadius: '20px',
              background: 'rgba(245,239,230,0.06)', color: 'rgba(245,239,230,0.6)',
              border: '1px solid rgba(245,239,230,0.12)', cursor: 'pointer',
              fontFamily, transition: 'all 0.2s',
            }}
          >
            {playing ? t.pause : t.listen}
          </button>
        )}
      </div>
    </div>
  );
}