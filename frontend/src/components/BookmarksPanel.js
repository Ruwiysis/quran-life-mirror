import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { LangContext } from '../App';
import VerseCard from './VerseCard';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '';

export default function BookmarksPanel({ isOpen, onClose, refreshTrigger }) {
  const { token } = useAuth();
  const { lang } = useContext(LangContext);
  const isAr = lang === 'ar';
  const fontFamily = isAr ? "'Noto Sans Arabic',sans-serif" : "'DM Sans',sans-serif";

  const [verses, setVerses] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !token) return;
    setLoading(true);
    const fetchBookmarks = async () => {
      try {
        const { data } = await axios.get(API + '/api/user/bookmarks-with-verses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const verseMap = {};
        data.forEach(b => {
          if (b.verse) {
            verseMap[b.verse_key] = b.verse;
          }
        });
        setVerses(verseMap);
      } catch (e) {
        console.log('Bookmarks fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [isOpen, token, refreshTrigger]);

  const groupedVerses = {};
  Object.values(verses).forEach(v => {
    const surah = v.surah_name || v.verse_key.split(':')[0];
    if (!groupedVerses[surah]) groupedVerses[surah] = [];
    groupedVerses[surah].push(v);
  });

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      {/* Overlay */}
      <div 
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />
      {/* Panel */}
      <div 
        style={{
          position: 'fixed', top: 0, right: 0,
          width: 'min(90vw, 420px)', height: '100vh',
          background: 'var(--bg)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 1000,
          animation: 'slideInRight 0.3s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
          overflowY: 'auto',
          fontFamily,
          direction: isAr ? 'rtl' : 'ltr',
        }}
      >
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 400, color: 'var(--text)' }}>
              Saved Bookmarks
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
              ×
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {Object.keys(verses).length} verses
          </p>
        </div>

        <div style={{ padding: '24px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Loading bookmarks...
            </div>
          ) : Object.keys(groupedVerses).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No bookmarks yet. Start saving verses!
            </div>
          ) : (
            Object.entries(groupedVerses).map(([surah, surahVerses]) => (
              <div key={surah} style={{ marginBottom: '32px' }}>
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: '20px', 
                  fontSize: '0.85rem', 
                  letterSpacing: '0.2em', 
                  textTransform: 'uppercase', 
                  color: 'var(--text-secondary)' 
                }}>
                  ── {surah} ──
                </div>
                {surahVerses.map((verse, i) => (
                  <div key={verse.verse_key} style={{ marginBottom: '16px' }}>
                    <VerseCard verse={verse} index={i} lang={lang} />
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
