import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LangContext } from '../App';
import { T } from '../translations';

export default function Nav() {
  const { pathname } = useLocation();
  const { lang, setLang } = useContext(LangContext);
  const t = T[lang].nav;
  const isAr = lang === 'ar';

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 40px',
      background: 'linear-gradient(180deg,rgba(10,15,30,0.97) 0%,transparent 100%)',
      backdropFilter: 'blur(8px)',
      direction: isAr ? 'rtl' : 'ltr',
    }}>
      <Link
        to="/"
        style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: '1.3rem', fontWeight: 400,
          color: '#c9a84c', textDecoration: 'none', letterSpacing: '0.05em',
        }}
      >
        {t.brand}
      </Link>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
{[['/', t.reflect], ['/journal', t.journal], ['/bookmarks', '🗂️ Bookmarks']].map(([path, label]) => (
          <Link key={path} to={path} style={{
            fontFamily: "'DM Sans',sans-serif",
            fontSize: '0.85rem', fontWeight: 400,
            color: pathname === path ? '#c9a84c' : 'rgba(245,239,230,0.55)',
            textDecoration: 'none', letterSpacing: '0.08em',
            textTransform: 'uppercase', transition: 'color 0.2s',
          }}>
            {label}
          </Link>
        ))}

        <button
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          style={{
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.3)',
            color: '#c9a84c', borderRadius: '20px', padding: '5px 14px',
            fontSize: '0.8rem', cursor: 'pointer',
            fontFamily: isAr ? "'Noto Sans Arabic',sans-serif" : "'DM Sans',sans-serif",
            transition: 'all 0.2s',
          }}
        >
          {t.toggle}
        </button>
      </div>
    </nav>
  );
}