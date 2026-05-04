import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import VerseCard from '../components/VerseCard';
import BookmarksPanel from '../components/BookmarksPanel';
import { LangContext } from '../App';
import { useAuth } from '../context/AuthContext';
import { T, EXAMPLES } from '../translations';

export default function Home() {
  const { lang } = useContext(LangContext);
  const t = T[lang].home;
  const isAr = lang === 'ar';
  const { isLoggedIn, logout, token } = useAuth();

  const [situation, setSituation] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  // Fetch bookmark count periodically
  useEffect(() => {
    if (!isLoggedIn || !token) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get((process.env.REACT_APP_API_URL || '') + '/api/user/bookmarks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookmarkCount(data.length);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [isLoggedIn, token]);

  const handleSearch = async () => {
    if (!situation.trim() || situation.length < 10) { setError(t.errorShort); return; }
    setError(''); setLoading(true); setResults([]);
    try {
      const { data } = await axios.post((process.env.REACT_APP_API_URL || '') + '/api/search', { situation });
      setResults(data);
    } catch (e) {
      setError(e?.response?.data?.detail || t.errorGeneral);
    } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const response = await axios.get((process.env.REACT_APP_API_URL || '') + '/api/auth/login');
      window.location.href = response.data.auth_url;
    } catch (e) {
      setError(t.loginError + (e?.response?.data?.detail || e.message));
      setAuthLoading(false);
    }
  };

  const fontFamily = isAr ? "'Noto Sans Arabic', 'DM Sans', sans-serif" : "'DM Sans', sans-serif";

  return (
    <>
      <main style={{
        minHeight: '100vh', padding: '110px 24px 80px',
        maxWidth: '780px', margin: '0 auto',
        direction: isAr ? 'rtl' : 'ltr',
        fontFamily,
      }}>

        {/* ── Auth bar ── */}
        {!isLoggedIn ? (
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <button
              onClick={handleLogin}
              disabled={authLoading}
              style={{
                background: 'linear-gradient(135deg,rgba(100,180,100,0.8),rgba(80,160,80,0.8))',
                color: 'var(--text)', border: 'none', padding: '10px 24px',
                borderRadius: '20px', fontSize: '0.85rem', fontWeight: 500,
                fontFamily, letterSpacing: '0.06em',
                cursor: authLoading ? 'not-allowed' : 'pointer',
                opacity: authLoading ? 0.7 : 1, transition: 'all 0.2s',
              }}
            >
              {authLoading ? t.loginLoading : t.login}
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: '32px', textAlign: 'center', color: 'rgba(100,180,100,0.8)', fontSize: '0.85rem', fontFamily }}>
            <span style={{ [isAr ? 'marginLeft' : 'marginRight']: '12px' }}>{t.loggedIn}</span>
            <button
              onClick={logout}
              style={{
                background: 'transparent', color: 'rgba(100,180,100,0.7)',
                border: '1px solid rgba(100,180,100,0.3)', padding: '6px 16px',
                borderRadius: '16px', fontSize: '0.8rem', fontFamily, cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.target.style.borderColor = 'rgba(100,180,100,0.6)'; e.target.style.color = 'rgba(100,180,100,0.9)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'rgba(100,180,100,0.3)'; e.target.style.color = 'rgba(100,180,100,0.7)'; }}
            >
              {t.logout}
            </button>
          </div>
        )}

        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }} className="fade-up">
          <span style={{
            display: 'inline-block', fontSize: '0.72rem', fontWeight: 500,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--gold)', marginBottom: '18px',
            fontFamily,
          }}>
            {t.eyebrow}
          </span>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(2.4rem,6vw,3.8rem)', fontWeight: 300,
            lineHeight: 1.15, color: 'var(--text)', marginBottom: '18px',
          }}>
            {t.h1a}<br />
            <span style={{ color: 'var(--gold)' }}>{t.h1b}</span>
          </h1>
          <p style={{
            fontSize: '1rem', color: 'var(--text-secondary)',
            maxWidth: '480px', margin: '0 auto', lineHeight: 1.8, fontFamily,
          }}>
            {t.subtitle}
          </p>
        </div>

        {/* ── Input card ── */}
        <div
          className="fade-up-delay-1"
          style={{
            background: 'var(--ink-soft)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '32px', backdropFilter: 'blur(16px)',
            marginBottom: '40px', boxShadow: 'var(--shadow-md)',
          }}
        >
          <label style={{
            display: 'block', fontSize: '0.75rem', fontWeight: 500,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'var(--gold)', marginBottom: '12px', fontFamily,
          }}>
            {t.label}
          </label>

          <textarea
            value={situation}
            onChange={e => setSituation(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSearch(); }}
            placeholder={t.placeholder}
            style={{
              width: '100%', minHeight: '120px',
              background: 'rgba(var(--text-rgb), 0.06)',
              border: `1px solid ${focused ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: '12px', padding: '16px 20px', color: 'var(--text)',
              fontSize: '1rem', fontFamily, fontWeight: 300,
              lineHeight: 1.7, resize: 'vertical', outline: 'none',
              transition: 'border-color 0.2s',
              direction: isAr ? 'rtl' : 'ltr',
              textAlign: isAr ? 'right' : 'left',
            }}
          />

          {/* Example chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
            {EXAMPLES[lang].map((ex, i) => (
              <button
                key={i}
                onClick={() => setSituation(ex)}
                style={{
                  fontSize: '0.78rem', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', borderRadius: '20px',
                  padding: '5px 13px', cursor: 'pointer', transition: 'all 0.2s',
                  background: 'transparent', fontFamily,
                }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)'; }}
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Bottom row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '18px',
            flexWrap: 'wrap',
            gap: '10px',
            flexDirection: isAr ? 'row-reverse' : 'row',
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily }}>
              {t.tip}
            </span>
            <button
              onClick={handleSearch}
              disabled={loading || situation.length < 10}
              style={{
                background: 'var(--gold)', color: 'var(--bg)',
                border: 'none', padding: '12px 32px',
                borderRadius: '30px', fontSize: '0.9rem', fontWeight: 500,
                fontFamily, letterSpacing: '0.06em',
                cursor: situation.length < 10 ? 'not-allowed' : 'pointer',
                opacity: loading || situation.length < 10 ? 0.6 : 1,
                boxShadow: 'var(--glow)', transition: 'all 0.2s',
              }}
            >
              {loading ? t.btnLoading : t.btn}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(var(--text-rgb), 0.08)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '16px 20px',
            color: 'var(--text)', fontSize: '0.9rem',
            marginBottom: '24px', fontFamily,
          }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{
            textAlign: 'center', padding: '48px 0',
            color: 'var(--gold)',
            fontFamily: isAr ? "'Noto Sans Arabic', serif" : "'Cormorant Garamond', serif",
            fontSize: '1.1rem', fontStyle: 'italic',
          }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {[0, 0.2, 0.4].map((d, i) => (
                <span key={i} style={{
                  display: 'inline-block', width: '8px', height: '8px',
                  borderRadius: '50%', background: 'var(--gold)',
                  animation: `shimmer 1.4s ${d}s ease-in-out infinite`,
                }} />
              ))}
            </div>
            {t.searching}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div>
            <div style={{
              fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'var(--gold)',
              marginBottom: '24px', textAlign: 'center', fontFamily,
            }}>
              {t.found(results.length)}
            </div>
            {results.map((verse, i) => (
              <VerseCard key={verse.verse_key} verse={verse} situation={situation} index={i} lang={lang} />
            ))}
          </div>
        )}

        {/* Floating Bookmark Button */}
        {isLoggedIn && (
          <button
            onClick={() => setIsBookmarksOpen(true)}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--gold)',
              border: 'none',
              color: 'var(--bg)',
              fontSize: '1.4rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md)',
              zIndex: 998,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Bookmarks"
          >
            📌
            {bookmarkCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--bg)',
                color: 'var(--text)',
                borderRadius: '50%',
                minWidth: '20px',
                height: '20px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {bookmarkCount}
              </span>
            )}
          </button>
        )}

      </main>
      <BookmarksPanel isOpen={isBookmarksOpen} onClose={() => setIsBookmarksOpen(false)} />
    </>
  );
}
