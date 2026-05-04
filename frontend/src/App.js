import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './pages/Home';
import Journal from './pages/Journal';
import Bookmarks from './pages/Bookmarks';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

export const LangContext = React.createContext({ lang: 'en', setLang: () => {} });

// OAuth callback handler
function CallbackPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      login(code)
        .then(() => {
          // Redirect to home page after successful login
          window.location.href = '/';
        })
        .catch((err) => {
          setError('Login failed: ' + err.message);
          setLoading(false);
        });
    } else {
      setError('No authorization code received');
      setLoading(false);
    }
  }, [login]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg, #0a0f1e)',
      color: 'var(--text, #f5efe6)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        {loading ? (
          <>
            <div style={{ marginBottom: '16px', fontSize: '1.2rem' }}>
              Logging you in...
            </div>
            <div style={{
              display: 'inline-block',
              width: '30px',
              height: '30px',
              border: '3px solid var(--gold-dim)',
              borderTop: '3px solid var(--gold)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </>
        ) : (
          <div>
            <div style={{ fontSize: '1.1rem', marginBottom: '16px' }}>❌ {error}</div>
            <a href="/" style={{
              color: 'var(--gold)',
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}>
              Back to home
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const [lang, setLang] = useState('en');
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/callback" element={<CallbackPage />} />
        </Routes>
      </BrowserRouter>
    </LangContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
