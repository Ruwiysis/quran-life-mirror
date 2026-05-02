import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { LangContext } from '../App';
import { useAuth } from '../context/AuthContext';
import { T, DID_YOU_KNOW } from '../translations';

const MOOD_EMOJI = {
  grateful: '🌿', hopeful: '🌅', reflective: '🌙',
  'at peace': '☁️', 'still struggling': '🌊',
};
const MOOD_COLOR = {
  grateful: 'rgba(100,180,100,0.15)', hopeful: 'rgba(255,200,80,0.12)',
  reflective: 'rgba(100,120,200,0.15)', 'at peace': 'rgba(150,200,220,0.12)',
  'still struggling': 'rgba(150,100,200,0.12)',
};

/* ── Entry card ── */
function EntryCard({ entry, onUpdate, onDelete, lang, isFromQF }) {
  const t = T[lang].journal;
  const isAr = lang === 'ar';
  const fontFamily = isAr ? "'Noto Sans Arabic', 'DM Sans', sans-serif" : "'DM Sans', sans-serif";

  const [editing, setEditing] = useState(false);
  const [noteText, setNoteText] = useState(entry.personal_note || entry.reflection || '');
  const [saving, setSaving] = useState(false);

  const fact = DID_YOU_KNOW[lang]?.[entry.verse_key];
  const moodColor = MOOD_COLOR[entry.mood] || 'rgba(201,168,76,0.06)';
  const moodEmoji = MOOD_EMOJI[entry.mood] || '🌙';

  // Translated mood label
  const cardT = T[lang].card;
  const moodLabel = entry.mood
    ? (cardT.moodLabels[entry.mood] || entry.mood)
    : (isFromQF ? (entry.source || 'QF') : (isAr ? 'متأمّل' : 'reflective'));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isFromQF) {
        alert(t.editingQF);
      } else {
        const { data } = await axios.patch(`/api/journal/${entry.id}`, { personal_note: noteText });
        onUpdate(data);
        setEditing(false);
      }
    } catch (e) { alert(t.saveError); }
    setSaving(false);
  };

  // Format date with locale
  const formattedDate = (() => {
    try {
      return format(new Date(entry.created_at), isAr ? 'd MMM yyyy · h:mm a' : 'MMM d, yyyy · h:mm a', {
        locale: isAr ? arSA : undefined,
      });
    } catch { return entry.created_at; }
  })();

  return (
    <div
      style={{
        background: 'linear-gradient(135deg,rgba(20,25,41,0.95) 0%,rgba(15,20,35,0.98) 100%)',
        border: '1px solid rgba(201,168,76,0.18)', borderRadius: '20px',
        marginBottom: '24px', overflow: 'hidden',
        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
        direction: isAr ? 'rtl' : 'ltr',
        opacity: isFromQF ? 0.95 : 1,
        fontFamily,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.18)'}
    >
      {/* Top bar */}
      <div style={{
        background: moodColor, padding: '14px 28px',
        borderBottom: '1px solid rgba(201,168,76,0.1)',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>{moodEmoji}</span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(245,239,230,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily }}>
            {moodLabel}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.72rem', color: 'rgba(201,168,76,0.6)', letterSpacing: '0.1em', fontFamily }}>
            {formattedDate}
          </span>
          <span style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c', borderRadius: '12px', padding: '2px 10px', fontSize: '0.72rem', fontFamily: 'monospace' }}>
            {entry.verse_key}
          </span>
          {!isFromQF && (
            <button
              onClick={() => window.confirm(t.deleteConfirm) && onDelete(entry.id)}
              style={{ background: 'transparent', border: 'none', color: 'rgba(180,60,60,0.45)', cursor: 'pointer', fontSize: '1rem', padding: '0 4px', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'rgba(220,80,80,0.8)'}
              onMouseLeave={e => e.target.style.color = 'rgba(180,60,60,0.45)'}
            >✕</button>
          )}
        </div>
      </div>

      <div style={{ padding: '28px' }}>

        {/* Situation */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,239,230,0.3)', marginBottom: '8px', fontFamily }}>
            {t.situation}
          </div>
          <p style={{
            fontSize: '0.92rem', color: 'rgba(245,239,230,0.55)',
            fontStyle: 'italic', lineHeight: 1.7,
            borderLeft: isAr ? 'none' : '2px solid rgba(201,168,76,0.2)',
            borderRight: isAr ? '2px solid rgba(201,168,76,0.2)' : 'none',
            paddingLeft: isAr ? 0 : 14, paddingRight: isAr ? 14 : 0,
            fontFamily,
          }}>
            "{entry.situation || entry.reflection || t.noDescription}"
          </p>
        </div>

        {/* Arabic verse text */}
        {entry.arabic_text && (
          <div style={{
            fontFamily: "'Amiri', serif", direction: 'rtl', textAlign: 'right',
            fontSize: '1.5rem', lineHeight: 2.1, color: 'rgba(245,239,230,0.9)',
            padding: '16px 20px', background: 'rgba(201,168,76,0.05)',
            borderRadius: '10px', borderRight: '3px solid rgba(201,168,76,0.35)',
            marginBottom: '14px',
          }}>
            {entry.arabic_text}
          </div>
        )}

        {/* Translation */}
        {entry.translation && (
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.08rem', fontStyle: 'italic',
            color: 'rgba(245,239,230,0.7)', lineHeight: 1.75, marginBottom: '16px',
          }}>
            "{entry.translation}"
          </p>
        )}

        {/* Reflection */}
        {entry.reflection && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.5)', marginBottom: '8px', fontFamily }}>
              {t.reflection}
            </div>
            <p style={{ fontSize: '0.9rem', color: 'rgba(245,239,230,0.6)', lineHeight: 1.75, fontFamily }}>
              {entry.reflection}
            </p>
          </div>
        )}

        {/* Quran Insight / Did You Know */}
        {fact && (
          <div style={{
            background: 'rgba(100,120,200,0.08)', border: '1px solid rgba(100,120,200,0.15)',
            borderRadius: '10px', padding: '14px 18px', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(150,170,255,0.6)', marginBottom: '6px', fontFamily }}>
              {t.quranInsight}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'rgba(245,239,230,0.55)', lineHeight: 1.7, fontFamily }}>
              {fact}
            </p>
          </div>
        )}

        {/* Personal note (local only) */}
        {!isFromQF && (
          <div style={{ borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.4)', fontFamily }}>
                {t.yourNote}
              </span>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  style={{ fontSize: '0.75rem', color: 'rgba(201,168,76,0.6)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily }}
                >
                  {entry.personal_note ? t.edit : t.addNote}
                </button>
              )}
            </div>

            {editing ? (
              <div>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder={t.editNote}
                  style={{
                    width: '100%', minHeight: '80px',
                    background: 'rgba(10,15,30,0.6)',
                    border: '1px solid rgba(201,168,76,0.25)', borderRadius: '8px',
                    padding: '10px 14px', color: '#f5efe6',
                    fontSize: '0.88rem', fontFamily, resize: 'vertical', outline: 'none',
                    direction: isAr ? 'rtl' : 'ltr',
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={handleSave} disabled={saving}
                    style={{ fontSize: '0.8rem', padding: '7px 18px', borderRadius: '15px', background: 'rgba(201,168,76,0.2)', color: '#c9a84c', border: 'none', cursor: 'pointer', fontFamily }}
                  >
                    {saving ? '...' : t.saveNote}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setNoteText(entry.personal_note || ''); }}
                    style={{ fontSize: '0.8rem', padding: '7px 18px', borderRadius: '15px', background: 'rgba(245,239,230,0.06)', color: 'rgba(245,239,230,0.5)', border: 'none', cursor: 'pointer', fontFamily }}
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <p style={{
                fontSize: '0.9rem',
                color: entry.personal_note ? 'rgba(245,239,230,0.65)' : 'rgba(245,239,230,0.2)',
                lineHeight: 1.7, fontStyle: entry.personal_note ? 'normal' : 'italic', fontFamily,
              }}>
                {entry.personal_note || t.noNote}
              </p>
            )}
          </div>
        )}

        {isFromQF && (
          <div style={{ fontSize: '0.75rem', color: 'rgba(201,168,76,0.5)', fontStyle: 'italic', marginTop: '12px', textAlign: 'center', fontFamily }}>
            ✓ {t.localData}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Journal page ── */
export default function Journal() {
  const { lang } = useContext(LangContext);
  const t = T[lang].journal;
  const isAr = lang === 'ar';
  const fontFamily = isAr ? "'Noto Sans Arabic', 'DM Sans', sans-serif" : "'DM Sans', sans-serif";
  const { isLoggedIn, token } = useAuth();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0, total_days: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isLoggedIn && token) {
          try {
            const { data } = await axios.get('/api/user/journal', {
              headers: { Authorization: `Bearer ${token}` },
            });
            try {
              const streakData = await axios.get('/api/user/streaks', {
                headers: { Authorization: `Bearer ${token}` },
              });
              setStreak(streakData.data);
            } catch { /* silent */ }
            setEntries(data);
          } catch {
            const { data } = await axios.get('/api/journal');
            setEntries(data);
          }
        } else {
          const { data } = await axios.get('/api/journal');
          setEntries(data);
        }
      } catch (e) {
        console.error('Error fetching journal:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isLoggedIn, token]);

  const handleUpdate = (updated) => setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
  const handleDelete = async (id) => {
    await axios.delete(`/api/journal/${id}`);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const uniqueVerses = [...new Set(entries.map(e => e.verse_key))].length;
  const daysJourney = streak.current_streak || (entries.length > 0
    ? Math.max(1, Math.ceil((Date.now() - new Date(entries[entries.length - 1].created_at)) / 86400000))
    : 0);
  const streakMsg = entries.length > 0 ? t.streakMsg(daysJourney) : '';

  // Month/year label with locale
  const formatMonthYear = (dateStr) => {
    try {
      return format(new Date(dateStr), isAr ? 'MMMM yyyy' : 'MMMM yyyy', { locale: isAr ? arSA : undefined });
    } catch { return dateStr; }
  };

  return (
    <main style={{
      minHeight: '100vh', padding: '110px 24px 80px',
      maxWidth: '780px', margin: '0 auto',
      direction: isAr ? 'rtl' : 'ltr',
      fontFamily,
    }}>

      {/* Header */}
      <div style={{ marginBottom: '40px' }} className="fade-up">
        <span style={{
          display: 'inline-block', fontSize: '0.72rem', fontWeight: 500,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'rgba(201,168,76,0.7)', marginBottom: '12px', fontFamily,
        }}>
          {t.eyebrow}
        </span>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 300,
          color: '#f5efe6', lineHeight: 1.2, marginBottom: '10px',
        }}>
          {t.h1a}<br />
          <span style={{ color: '#c9a84c' }}>{t.h1b}</span>
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'rgba(245,239,230,0.4)', fontFamily }}>
          {t.subtitle}
        </p>
      </div>

      {/* Stats */}
      {!loading && entries.length > 0 && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }} className="fade-up-delay-1">
          {[
            { num: entries.length, label: t.reflections },
            { num: uniqueVerses, label: t.versesDiscovered },
            { num: daysJourney, label: t.dayJourney },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '14px', padding: '18px 24px', flex: '1', minWidth: '110px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.2rem', fontWeight: 300, color: '#c9a84c', lineHeight: 1 }}>
                {s.num}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(245,239,230,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '6px', fontFamily }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Streak */}
      {streakMsg && (
        <div style={{ textAlign: 'center', marginBottom: '32px', fontSize: '0.9rem', color: 'rgba(201,168,76,0.7)', fontStyle: 'italic', fontFamily }}>
          {streakMsg}
        </div>
      )}

      {/* Chapter divider */}
      {entries.length > 0 && (
        <div style={{ textAlign: 'center', marginBottom: '32px', fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(245,239,230,0.2)', fontFamily }}>
          ✦ ─────── {t.journey} ─────── ✦
        </div>
      )}

      {/* Loading / Empty */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(245,239,230,0.3)', fontFamily: isAr ? "'Noto Sans Arabic', serif" : "'Cormorant Garamond', serif", fontSize: '1.1rem', fontStyle: 'italic' }}>
          {t.loading}
        </div>
      )}
      {!loading && entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(245,239,230,0.3)', fontFamily: isAr ? "'Noto Sans Arabic', serif" : "'Cormorant Garamond', serif", fontSize: '1.1rem', fontStyle: 'italic' }}>
          {t.empty}
        </div>
      )}

      {/* Entries */}
      {entries.map((entry, i) => (
        <div key={entry.id} className="fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
          {/* Month separator */}
          {(i === 0 || formatMonthYear(entries[i - 1].created_at) !== formatMonthYear(entry.created_at)) && (
            <div style={{ textAlign: 'center', margin: '24px 0 20px', fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.4)', fontFamily }}>
              ── {formatMonthYear(entry.created_at)} ──
            </div>
          )}
          <EntryCard
            entry={entry}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            lang={lang}
            isFromQF={entry.source === 'qf'}
          />
        </div>
      ))}
    </main>
  );
}