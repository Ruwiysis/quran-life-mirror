import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './pages/Home';
import Journal from './pages/Journal';
import { AuthProvider, useAuth } from './context/AuthContext';

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
      background: '#0a0f1e',
      color: '#f5efe6',
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
              border: '3px solid rgba(201,168,76,0.3)',
              borderTop: '3px solid #c9a84c',
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
              color: '#c9a84c',
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

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/callback" element={<CallbackPage />} />
        </Routes>
      </BrowserRouter>
    </LangContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

