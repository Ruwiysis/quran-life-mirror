import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './pages/Home';
import Journal from './pages/Journal';

export const LangContext = React.createContext({ lang: 'en', setLang: () => {} });

export default function App() {
  const [lang, setLang] = useState('en');
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/journal" element={<Journal />} />
        </Routes>
      </BrowserRouter>
    </LangContext.Provider>
  );
}
