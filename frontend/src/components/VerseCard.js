import React, { useState, useContext } from 'react';
import axios from 'axios';
import { LangContext } from '../App';
import { useAuth } from '../context/AuthContext';

const T = {
  en: {
    reflection: 'Personal Reflection', saveJournal: '+ Save to Journal', saved: '✓ Saved',
    listen: '▶ Listen', stop: '⏸ Stop', whyThis: 'Why this verse?',
    didYouKnow: 'Did you know?', addNote: 'Add your own note...',
    saveNote: 'Save Note', noteSaved: 'Note saved ✓',
    saveBookmark: '+ Bookmark',
  },
  ar: {
    reflection: 'تأمّل شخصي', saveJournal: '+ أضف للمذكّرة', saved: '✓ تم الحفظ',
    listen: '▶ استمع', stop: '⏸ إيقاف', whyThis: 'لماذا هذه الآية؟',
    didYouKnow: 'هل تعلم؟', addNote: 'أضف ملاحظتك الشخصية...',
    saveNote: 'حفظ الملاحظة', noteSaved: 'تم الحفظ ✓',
    saveBookmark: '+ حفظ العلامة',
  }
};

const DID_YOU_KNOW = {
  '94:5': 'This verse is repeated twice in a row (94:5 and 94:6) — scholars say the repetition is deliberate: ease will come not just once, but again.',
  '2:286': 'This is the last verse of Surah Al-Baqarah. The Prophet ﷺ said whoever recites the last two verses at night, they will suffice him.',
  '39:53': 'This verse is considered one of the most hope-filled verses in the entire Quran. It was revealed as a direct address to those who had sinned greatly.',
  '50:16': 'Allah says He is closer to you than your jugular vein — this is not just a metaphor, it means Allah knows every heartbeat, every thought.',
  '2:153': 'Seeking help through patience and prayer (sabr + salah) is a Quranic prescription for hardship — a complete spiritual medicine.',
  '13:28': 'Verily, in the remembrance of Allah do hearts find rest — this verse is recited by millions around the world when anxious or afraid.',
  '93:3': 'Surah Ad-Duha was revealed during a period when the Prophet ﷺ was going through deep distress and had not received revelation for weeks.',
};

export default function VerseCard({ verse, situation, index }) {
  const { lang } = useContext(LangContext);
  const t = T[lang];
  
  const { isLoggedIn, token } = useAuth();
  
  const [saved, setSaved] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [note, setNote] = useState('');
  const [mood, setMood] = useState('reflective');
  const [hovered, setHovered] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [audio] = useState(() => verse.audio_url ? new Audio(verse.audio_url) : null);
  const fact = DID_YOU_KNOW[verse.verse_key];

  const tafsirText = lang === 'ar' ? verse.tafsir_ar : verse.tafsir_en;
  const tafsirLabel = lang === 'ar' ? '📖 تفسير ابن كثير' : '📖 Tafsir (Ibn Kathir)';

  const handleSave = async () => {
    if (saved) return;
    try {
      if (isLoggedIn && token) {
        await axios.post(
          '/api/user/reflection',
          {
            verse_key: verse.verse_key,
            reflection_text: verse.reflection + (note ? '\n\n' + note : ''),
            situation,
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
      }
      await axios.post((process.env.REACT_APP_API_URL || '') + '/api/journal', {
        situation, verse_key: verse.verse_key,
        arabic_text: verse.arabic_text, translation: verse.translation,
        reflection: verse.reflection, personal_note: note, mood,
      });
      setSaved(true);
    } catch (e) {
      alert('Could not save: ' + (e?.response?.data?.detail || e.message));
    }
  };

  const handleBookmark = async () => {
    if (bookmarked) return;
    try {
      if (isLoggedIn && token) {
        await axios.post(
          '/api/user/bookmark',
          { verse_key: verse.verse_key },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setBookmarked(true);
      } else {
        alert('Please log in to bookmark verses.');
      }
    } catch (e) {
      alert('Could not bookmark: ' + (e?.response?.data?.detail || e.message));
    }
  };

  const handleAudio = () => {
    if (!audio) return;
    if (playing) { audio.pause(); audio.currentTime = 0; setPlaying(false); }
    else { audio.play(); setPlaying(true); audio.onended = () => setPlaying(false); }
  };

  const MOODS = ['grateful','hopeful','reflective','at peace','still struggling'];
  const MOODS_AR = ['ممتنّ','متفائل','متأمّل','مطمئن','أحتاج مزيداً'];

  return (
    <div className="fade-up" style={{
      background:'linear-gradient(135deg,rgba(30,38,64,0.85) 0%,rgba(20,25,41,0.9) 100%)',
      border:`1px solid ${hovered ? 'rgba(201,168,76,0.45)' : 'rgba(201,168,76,0.2)'}`,
      borderRadius:'18px',padding:'36px',marginBottom:'20px',
      backdropFilter:'blur(12px)',transition:'all 0.3s',position:'relative',overflow:'hidden',
      boxShadow: hovered ? '0 8px 40px rgba(201,168,76,0.1)' : 'none',
      animationDelay:`${index*0.1}s`,
      direction: lang==='ar' ? 'rtl' : 'ltr',
    }} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>

      {/* Ornament */}
      <span style={{position:'absolute',top:16,right:lang==='ar'?'auto':20,left:lang==='ar'?20:'auto',fontSize:'1.4rem',opacity:0.1}}>✦</span>

      {/* Surah tag */}
      <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'20px',flexWrap:'wrap'}}>
        <span style={{display:'inline-block',fontSize:'0.72rem',fontWeight:500,color:'#c9a84c',letterSpacing:'0.12em',textTransform:'uppercase',background:'rgba(201,168,76,0.12)',borderRadius:'20px',padding:'4px 12px'}}>
          {verse.surah_name} · {verse.verse_key}
        </span>
        <span style={{fontSize:'0.72rem',color:'rgba(245,239,230,0.3)',letterSpacing:'0.06em'}}>
          {Math.round(verse.relevance_score * 100)}% match
        </span>
      </div>

      {/* Arabic text */}
      <div style={{
        fontFamily:"'Amiri',serif",fontSize:'1.8rem',lineHeight:2.2,
        color:'rgba(245,239,230,0.95)',direction:'rtl',textAlign:'right',
        marginBottom:'20px',padding:'18px 22px',
        background:'rgba(201,168,76,0.06)',borderRadius:'10px',
        borderRight:'3px solid rgba(201,168,76,0.4)',
      }}>{verse.arabic_text}</div>

      {/* Translation */}
      <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.15rem',fontStyle:'italic',color:'rgba(245,239,230,0.8)',lineHeight:1.8,marginBottom:'16px'}}>
        "{verse.translation}"
      </p>

      {/* Did you know */}
      {fact && (
        <div style={{background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.15)',borderRadius:'10px',padding:'14px 18px',marginBottom:'16px'}}>
          <div style={{fontSize:'0.68rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'rgba(201,168,76,0.6)',marginBottom:'6px'}}>{t.didYouKnow}</div>
          <p style={{fontSize:'0.88rem',color:'rgba(245,239,230,0.6)',lineHeight:1.7}}>{fact}</p>
        </div>
      )}

      {/* Tafsir */}
      {tafsirText && (
        <div style={{marginBottom:'16px'}}>
          <button
            onClick={() => setShowTafsir(prev => !prev)}
            style={{
              background:'none', border:'none', cursor:'pointer',
              fontSize:'0.75rem', color:'rgba(201,168,76,0.7)',
              letterSpacing:'0.1em', textTransform:'uppercase',
              padding:'0', fontFamily:"'DM Sans',sans-serif",
              display:'flex', alignItems:'center', gap:'6px',
            }}
          >
            <span style={{fontSize:'1rem'}}>{showTafsir ? '▾' : '▸'}</span>
            {tafsirLabel}
          </button>
          {showTafsir && (
            <div style={{
              marginTop:'10px', background:'rgba(201,168,76,0.04)',
              border:'1px solid rgba(201,168,76,0.12)', borderRadius:'10px',
              padding:'16px 18px',
            }}>
              <p style={{
                fontSize:'0.88rem', color:'rgba(245,239,230,0.65)',
                lineHeight:1.9, margin:0,
                fontFamily: lang === 'ar' ? "'Noto Sans Arabic',sans-serif" : "'DM Sans',sans-serif",
                direction: lang === 'ar' ? 'rtl' : 'ltr',
              }}>{tafsirText}</p>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div style={{height:'1px',background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent)',margin:'16px 0'}}/>

      {/* Reflection */}
      <div style={{fontSize:'0.72rem',fontWeight:500,letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(201,168,76,0.6)',marginBottom:'10px'}}>{t.reflection}</div>
      <p style={{fontSize:'0.95rem',color:'rgba(245,239,230,0.7)',lineHeight:1.8,marginBottom:'20px'}}>{verse.reflection}</p>

      {/* Mood selector */}
      {!saved && (
        <div style={{marginBottom:'16px'}}>
          <div style={{fontSize:'0.7rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(245,239,230,0.3)',marginBottom:'8px'}}>
            {lang==='ar' ? 'كيف تشعر الآن؟' : 'How does this make you feel?'}
          </div>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            {(lang==='ar' ? MOODS_AR : MOODS).map((m,i)=>(
              <button key={m} onClick={()=>setMood(MOODS[i])} style={{
                fontSize:'0.75rem',padding:'4px 12px',borderRadius:'20px',border:'none',cursor:'pointer',
                background: mood===MOODS[i] ? 'rgba(201,168,76,0.25)' : 'rgba(245,239,230,0.06)',
                color: mood===MOODS[i] ? '#c9a84c' : 'rgba(245,239,230,0.45)',
                fontFamily:"'DM Sans',sans-serif",transition:'all 0.2s',
              }}>{m}</button>
            ))}
          </div>
        </div>
      )}

      {/* Personal note */}
      {!saved && (
        <div style={{marginBottom:'16px'}}>
          <textarea
            placeholder={t.addNote}
            value={note} onChange={e=>setNote(e.target.value)}
            style={{
              width:'100%',minHeight:'70px',background:'rgba(10,15,30,0.5)',
              border:'1px solid rgba(201,168,76,0.15)',borderRadius:'10px',
              padding:'12px 16px',color:'#f5efe6',fontSize:'0.88rem',
              fontFamily:"'DM Sans',sans-serif",resize:'vertical',outline:'none',
              direction: lang==='ar' ? 'rtl' : 'ltr',
            }}
          />
        </div>
      )}

      {/* Actions */}
      <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
        <button onClick={handleSave} style={{
          display:'flex',alignItems:'center',gap:'6px',
          fontSize:'0.8rem',fontWeight:500,letterSpacing:'0.06em',
          padding:'9px 20px',borderRadius:'20px',cursor: saved?'default':'pointer',
          border:'none',fontFamily:"'DM Sans',sans-serif",transition:'all 0.2s',
          background: saved ? 'rgba(201,168,76,0.25)' : 'rgba(201,168,76,0.15)',
          color: saved ? '#e8c97a' : '#c9a84c',
          outline: saved ? 'none' : '1px solid rgba(201,168,76,0.3)',
        }}>{saved ? t.saved : t.saveJournal}</button>
        
        {isLoggedIn && (
          <button onClick={handleBookmark} style={{
            display:'flex',alignItems:'center',gap:'6px',
            fontSize:'0.8rem',fontWeight:500,letterSpacing:'0.06em',
            padding:'9px 20px',borderRadius:'20px',cursor: bookmarked?'default':'pointer',
            border:'none',fontFamily:"'DM Sans',sans-serif",transition:'all 0.2s',
            background: bookmarked ? 'rgba(100,180,100,0.25)' : 'rgba(100,180,100,0.15)',
            color: bookmarked ? '#a8e8a8' : '#7cb87c',
            outline: bookmarked ? 'none' : '1px solid rgba(100,180,100,0.3)',
          }}>{bookmarked ? '✓ Bookmarked' : t.saveBookmark}</button>
        )}
        
        {verse.audio_url && (
          <button onClick={handleAudio} style={{
            display:'flex',alignItems:'center',gap:'6px',
            fontSize:'0.8rem',padding:'9px 20px',borderRadius:'20px',
            background:'rgba(245,239,230,0.06)',color:'rgba(245,239,230,0.6)',
            border:'1px solid rgba(245,239,230,0.12)',cursor:'pointer',
            fontFamily:"'DM Sans',sans-serif",transition:'all 0.2s',
          }}>{playing ? t.stop : t.listen}</button>
        )}
      </div>
    </div>
  );
}