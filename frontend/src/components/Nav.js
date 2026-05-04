import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LangContext } from '../App';
import { useTheme } from '../context/ThemeContext';
import { T } from '../translations';

export default function Nav() {
  const { pathname } = useLocation();
  const { lang, setLang } = useContext(LangContext);
  const { theme, toggleTheme } = useTheme();
  const t = T[lang].nav;
  const isAr = lang === 'ar';

  const navLinks = [['/', t.reflect], ['/journal', t.journal]];
  if (pathname !== '/') {
    navLinks.push(['/bookmarks', '🗂️ Bookmarks']);
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 40px',
      background: `linear-gradient(180deg, rgba(var(--ink-rgb, 10,15,30), 0.97) 0%, transparent 100%)`,
      backdropFilter: 'blur(8px)',
      direction: isAr ? 'rtl' : 'ltr',
    }}>
      <Link
        to="/"
        style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: '1.3rem', fontWeight: 400,
          color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.05em',
        }}
      >
        {t.brand}
      </Link>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {navLinks.map(([path, label]) => (
          <Link key={path} to={path} style={{
            fontFamily: "'DM Sans',sans-serif",
            fontSize: '0.85rem', fontWeight: 400,
            color: pathname === path ? 'var(--gold)' : 'var(--muted)',
            textDecoration: 'none', letterSpacing: '0.08em',
            textTransform: 'uppercase', transition: 'color 0.2s',
          }}>
            {label}
          </Link>
        ))}

        <button
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          style={{
            background: 'var(--gold-dim)',
            border: '1px solid var(--border)',
            color: 'var(--gold)', borderRadius: '20px', padding: '5px 14px',
            fontSize: '0.8rem', cursor: 'pointer',
            fontFamily: isAr ? "'Noto Sans Arabic',sans-serif" : "'DM Sans',sans-serif",
            transition: 'all 0.2s',
          }}
        >
          {t.toggle}
        </button>

        {/* Cute Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            position: 'relative',
            width: '44px', height: '24px',
            background: 'var(--gold-dim)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.3s ease',
            boxShadow: 'var(--glow)',
          }}
          title="Toggle theme"
        >
          <span style={{
            position: 'absolute',
            fontSize: '0.75rem',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: theme === 'dark' ? 0.3 : 1,
            transform: theme === 'dark' ? 'translateX(4px)' : 'translateX(0)',
          }}>
            ☀️
          </span>
          <span style={{
            position: 'absolute',
            fontSize: '0.75rem',
            right: '4px',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: theme === 'light' ? 0.3 : 1,
            transform: theme === 'light' ? 'translateX(-4px)' : 'translateX(0)',
          }}>
            🌙
          </span>
          <div style={{
            position: 'absolute',
            left: theme === 'dark' ? '4px' : '20px',
            width: '16px', height: '16px',
            background: 'var(--gold)',
            borderRadius: '50%',
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 8px rgba(201,168,76,0.4)',
          }} />
        </button>
      </div>
    </nav>
  );
}
