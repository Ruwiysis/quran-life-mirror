import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { LangContext } from '../App';
import { useAuth } from '../context/AuthContext';
import VerseCard from '../components/VerseCard';

const API = process.env.REACT_APP_API_URL || '';

export default function Bookmarks() {
  const { lang } = useContext(LangContext);
  const isAr = lang === 'ar';
  const { isLoggedIn, token } = useAuth();
  const fontFamily = isAr ? "'Noto Sans Arabic',sans-serif" : "'DM Sans',sans-serif";

  const [verses, setVerses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn || !token) {
      setLoading(false);
      return;
    }
    const fetchBookmarks = async () => {
      try {
        const { data } = await axios.get(API + '/api/user/bookmarks-with-verses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const verseMap = {};
        data.forEach(b => {
          if (b.verse) {
            // Normalize fields to match what VerseCard expects
            verseMap[b.verse_key] = {
              verse_key: b.verse_key,
              surah_name: b.verse.surah_name || b.verse_key.split(':')[0],
              arabic_text: b.verse.arabic || b.verse.arabic_text || '',
              translation: b.verse.translation || '',
              audio_url: b.verse.audio_url || '',
              reflection: b.verse.reflection || '',
              relevance_score: b.verse.relevance_score || 1.0,
              tafsir_en: b.verse.tafsir_en || null,
              tafsir_ar: b.verse.tafsir_ar || null,
            };
          }
        });
        setVerses(verseMap);
      } catch (e) {
        setError('Could not load bookmarks');
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [isLoggedIn, token]);

  const groupedVerses = {};
  Object.values(verses).forEach(v => {
    const surah = v.surah_name || v.verse_key.split(':')[0];
    if (!groupedVerses[surah]) groupedVerses[surah] = [];
    groupedVerses[surah].push(v);
  });

  if (!isLoggedIn) {
    return (
      <main style={{ minHeight: '100vh', padding: '110px 24px 80px', maxWidth: '780px', margin: '0 auto', textAlign: 'center', color: 'var(--text-secondary)', fontFamily }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--text)', marginBottom: '20px' }}>Bookmarks</h1>
        <p>Please log in to see your bookmarks from Quran.com.</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '110px 24px 80px', maxWidth: '780px', margin: '0 auto', direction: isAr ? 'rtl' : 'ltr', fontFamily }}>
      <div style={{ marginBottom: '40px' }}>
        <span style={{ fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px', display: 'inline-block' }}>
          🗂️ Bookmarks
        </span>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 300, color: 'var(--text)', lineHeight: 1.2, marginBottom: '10px' }}>
          Your Quran Library
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text)', maxWidth: '600px' }}>
          Quick reference verses you've bookmarked. Synced with your Quran.com account. Organized by surah.
        </p>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>Loading your bookmarks...</div>}
      {error && <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>{error}</div>}
      {!loading && !error && Object.keys(groupedVerses).length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          No bookmarks yet. Start bookmarking verses you want to return to!
        </div>
      )}

      {Object.entries(groupedVerses).map(([surah, surahVerses]) => (
        <div key={surah} style={{ marginBottom: '48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)' }}>
            ── {surah} ──
          </div>
          {surahVerses.map((verse, i) => (
            <VerseCard key={verse.verse_key} verse={verse} index={i} lang={lang} />
          ))}
        </div>
      ))}
    </main>
  );
}