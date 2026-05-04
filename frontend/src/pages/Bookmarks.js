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
        const { data } = await axios.get(API + '/api/user/bookmarks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Fetch verse data parallel
        const versePromises = data.map(async (b) => {
          try {
            const { data } = await axios.get(API + '/api/verse/' + b.verse_key);
            return data;
          } catch (e) {
            console.log('Verse fetch error:', b.verse_key, e);
            return null;
          }
        });
        const verseDatas = await Promise.all(versePromises);
        const verseMap = {};
        verseDatas.forEach((v) => {
          if (v) verseMap[v.verse_key] = v;
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
      <main style={{ minHeight: '100vh', padding: '110px 24px 80px', maxWidth: '780px', margin: '0 auto', textAlign: 'center', color: 'rgba(245,239,230,0.6)', fontFamily }}>
        <h1 style={{ fontSize: '2rem', color: '#f5efe6', marginBottom: '20px' }}>Bookmarks</h1>
        <p>Please log in to see your bookmarks from Quran.com.</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '110px 24px 80px', maxWidth: '780px', margin: '0 auto', direction: isAr ? 'rtl' : 'ltr', fontFamily }}>
      <div style={{ marginBottom: '40px' }}>
        <span style={{ fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', marginBottom: '12px', display: 'inline-block' }}>
          🗂️ Bookmarks
        </span>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 300, color: '#f5efe6', lineHeight: 1.2, marginBottom: '10px' }}>
          Your Quran Library
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(245,239,230,0.8)', maxWidth: '600px' }}>
          Quick reference verses you've bookmarked. Synced with your Quran.com account. Organized by surah.
        </p>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(245,239,230,0.5)' }}>Loading your bookmarks...</div>}
      {error && <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(245,239,230,0.5)' }}>{error}</div>}
      {!loading && !error && Object.keys(groupedVerses).length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(245,239,230,0.5)', fontStyle: 'italic' }}>
          No bookmarks yet. Start bookmarking verses you want to return to!
        </div>
      )}

      {Object.entries(groupedVerses).map(([surah, surahVerses]) => (
        <div key={surah} style={{ marginBottom: '48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)' }}>
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
