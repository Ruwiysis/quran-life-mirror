import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { LangContext } from '../App';

const MOOD_EMOJI = { grateful:'🌿', hopeful:'🌅', reflective:'🌙', 'at peace':'☁️', 'still struggling':'🌊', reflective_ar:'🌙' };
const MOOD_COLOR = { grateful:'rgba(100,180,100,0.15)', hopeful:'rgba(255,200,80,0.12)', reflective:'rgba(100,120,200,0.15)', 'at peace':'rgba(150,200,220,0.12)', 'still struggling':'rgba(150,100,200,0.12)' };

const T = {
  en: {
    eyebrow:'Your Journal', h1a:'Your Life, Mirrored', h1b:'in the Quran',
    subtitle:'Every situation you\'ve brought. Every verse that answered.',
    reflections:'Reflections', versesDiscovered:'Verses Discovered', dayJourney:'Day Journey',
    empty:'Your journal is empty. Go reflect on a situation to begin.',
    editNote:'Edit your note...', saveNote:'Save', cancel:'Cancel',
    deleteConfirm:'Remove this entry from your journal?',
    yourNote:'Your Note', addNote:'+ Add personal note',
    noNote:'No personal note yet.',
    quranInsight:'📖 Quran Insight',
    journey:'Your Journey',
    streakMsg:(n)=> n>=7 ? `🔥 ${n} day streak! MashaAllah!` : n>=3 ? `✨ ${n} days in a row` : `Day ${n} of your journey`,
  },
  ar: {
    eyebrow:'مذكّرتك', h1a:'حياتك تنعكس', h1b:'في القرآن الكريم',
    subtitle:'كل موقف شاركته. كل آية أجابت.',
    reflections:'تأمّلات', versesDiscovered:'آيات اكتُشفت', dayJourney:'أيام الرحلة',
    empty:'مذكّرتك فارغة. ابدأ بتأمّل موقف ما.',
    editNote:'عدّل ملاحظتك...', saveNote:'حفظ', cancel:'إلغاء',
    deleteConfirm:'هل تريد حذف هذا السجل؟',
    yourNote:'ملاحظتك', addNote:'+ أضف ملاحظة شخصية',
    noNote:'لا توجد ملاحظة شخصية بعد.',
    quranInsight:'📖 فائدة قرآنية',
    journey:'رحلتك',
    streakMsg:(n)=> n>=7 ? `🔥 ${n} يوم متواصل! ما شاء الله!` : n>=3 ? `✨ ${n} أيام متتالية` : `اليوم ${n} من رحلتك`,
  }
};

const DID_YOU_KNOW = {
  '94:5':'This verse is repeated twice in a row — scholars say the repetition is deliberate: ease will come not just once, but again and again.',
  '2:286':'The last verse of Al-Baqarah. The Prophet ﷺ said whoever recites it at night, it will suffice him.',
  '39:53':'One of the most hope-filled verses in the Quran — revealed as a direct address to those who had sinned greatly.',
  '50:16':'Allah says He is closer to you than your jugular vein — He knows every heartbeat, every thought.',
  '2:153':'Sabr (patience) and Salah (prayer) together are a complete Quranic prescription for hardship.',
  '13:28':'This verse — "in the remembrance of Allah do hearts find rest" — is recited by millions when anxious.',
  '93:3':'Surah Ad-Duha was revealed during a period when the Prophet ﷺ was in deep distress.',
};

function EntryCard({ entry, onUpdate, onDelete, lang }) {
  const t = T[lang];
  const [editing, setEditing] = useState(false);
  const [noteText, setNoteText] = useState(entry.personal_note || '');
  const [saving, setSaving] = useState(false);
  const fact = DID_YOU_KNOW[entry.verse_key];
  const moodColor = MOOD_COLOR[entry.mood] || 'rgba(201,168,76,0.06)';
  const moodEmoji = MOOD_EMOJI[entry.mood] || '🌙';

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await axios.patch(`/api/journal/${entry.id}`, { personal_note: noteText });
      onUpdate(data);
      setEditing(false);
    } catch(e) { alert('Could not save note.'); }
    setSaving(false);
  };

  return (
    <div style={{
      background:'linear-gradient(135deg,rgba(20,25,41,0.95) 0%,rgba(15,20,35,0.98) 100%)',
      border:'1px solid rgba(201,168,76,0.18)',borderRadius:'20px',
      marginBottom:'24px',overflow:'hidden',
      boxShadow:'0 4px 30px rgba(0,0,0,0.3)',
      direction: lang==='ar'?'rtl':'ltr',
    }}
    onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(201,168,76,0.35)'}
    onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(201,168,76,0.18)'}
    >
      {/* Top bar with mood color */}
      <div style={{background:moodColor,padding:'14px 28px',borderBottom:'1px solid rgba(201,168,76,0.1)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'8px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <span style={{fontSize:'1.2rem'}}>{moodEmoji}</span>
          <span style={{fontSize:'0.75rem',color:'rgba(245,239,230,0.5)',letterSpacing:'0.1em',textTransform:'uppercase'}}>{entry.mood}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <span style={{fontSize:'0.72rem',color:'rgba(201,168,76,0.6)',letterSpacing:'0.1em',textTransform:'uppercase'}}>
            {format(new Date(entry.created_at),'MMM d, yyyy · h:mm a')}
          </span>
          <span style={{background:'rgba(201,168,76,0.12)',color:'#c9a84c',borderRadius:'12px',padding:'2px 10px',fontSize:'0.72rem'}}>{entry.verse_key}</span>
          <button onClick={()=>window.confirm(t.deleteConfirm)&&onDelete(entry.id)} style={{background:'transparent',border:'none',color:'rgba(180,60,60,0.45)',cursor:'pointer',fontSize:'1rem',padding:'0 4px',transition:'color 0.2s'}}
            onMouseEnter={e=>e.target.style.color='rgba(220,80,80,0.8)'}
            onMouseLeave={e=>e.target.style.color='rgba(180,60,60,0.45)'}
          >✕</button>
        </div>
      </div>

      <div style={{padding:'28px'}}>
        {/* Situation */}
        <div style={{marginBottom:'20px'}}>
          <div style={{fontSize:'0.68rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'rgba(245,239,230,0.3)',marginBottom:'8px'}}>
            {lang==='ar'?'الموقف':'Situation'}
          </div>
          <p style={{fontSize:'0.92rem',color:'rgba(245,239,230,0.55)',fontStyle:'italic',lineHeight:1.7,borderLeft:lang==='ar'?'none':'2px solid rgba(201,168,76,0.2)',borderRight:lang==='ar'?'2px solid rgba(201,168,76,0.2)':'none',paddingLeft:lang==='ar'?0:14,paddingRight:lang==='ar'?14:0}}>
            "{entry.situation}"
          </p>
        </div>

        {/* Arabic verse */}
        <div style={{fontFamily:"'Amiri',serif",direction:'rtl',textAlign:'right',fontSize:'1.5rem',lineHeight:2.1,color:'rgba(245,239,230,0.9)',padding:'16px 20px',background:'rgba(201,168,76,0.05)',borderRadius:'10px',borderRight:'3px solid rgba(201,168,76,0.35)',marginBottom:'14px'}}>
          {entry.arabic_text}
        </div>

        {/* Translation */}
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.08rem',fontStyle:'italic',color:'rgba(245,239,230,0.7)',lineHeight:1.75,marginBottom:'16px'}}>
          "{entry.translation}"
        </p>

        {/* AI Reflection */}
        <div style={{marginBottom:'16px'}}>
          <div style={{fontSize:'0.68rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'rgba(201,168,76,0.5)',marginBottom:'8px'}}>{lang==='ar'?'التأمّل':'Reflection'}</div>
          <p style={{fontSize:'0.9rem',color:'rgba(245,239,230,0.6)',lineHeight:1.75}}>{entry.reflection}</p>
        </div>

        {/* Quran Insight */}
        {fact && (
          <div style={{background:'rgba(100,120,200,0.08)',border:'1px solid rgba(100,120,200,0.15)',borderRadius:'10px',padding:'14px 18px',marginBottom:'16px'}}>
            <div style={{fontSize:'0.68rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(150,170,255,0.6)',marginBottom:'6px'}}>{t.quranInsight}</div>
            <p style={{fontSize:'0.85rem',color:'rgba(245,239,230,0.55)',lineHeight:1.7}}>{fact}</p>
          </div>
        )}

        {/* Personal note */}
        <div style={{background:'rgba(201,168,76,0.04)',border:'1px solid rgba(201,168,76,0.1)',borderRadius:'10px',padding:'16px 18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
            <div style={{fontSize:'0.68rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'rgba(201,168,76,0.5)'}}>{t.yourNote}</div>
            {!editing && (
              <button onClick={()=>setEditing(true)} style={{fontSize:'0.75rem',color:'rgba(201,168,76,0.6)',background:'transparent',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                {entry.personal_note ? (lang==='ar'?'تعديل':'Edit') : t.addNote}
              </button>
            )}
          </div>
          {editing ? (
            <div>
              <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder={t.editNote}
                style={{width:'100%',minHeight:'80px',background:'rgba(10,15,30,0.6)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:'8px',padding:'10px 14px',color:'#f5efe6',fontSize:'0.88rem',fontFamily:"'DM Sans',sans-serif",resize:'vertical',outline:'none',direction:lang==='ar'?'rtl':'ltr'}}
              />
              <div style={{display:'flex',gap:'10px',marginTop:'10px'}}>
                <button onClick={handleSave} disabled={saving} style={{fontSize:'0.8rem',padding:'7px 18px',borderRadius:'15px',background:'rgba(201,168,76,0.2)',color:'#c9a84c',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>{saving ? '...' : t.saveNote}</button>
                <button onClick={()=>{setEditing(false);setNoteText(entry.personal_note||'');}} style={{fontSize:'0.8rem',padding:'7px 18px',borderRadius:'15px',background:'rgba(245,239,230,0.06)',color:'rgba(245,239,230,0.5)',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>{t.cancel}</button>
              </div>
            </div>
          ) : (
            <p style={{fontSize:'0.9rem',color: entry.personal_note ? 'rgba(245,239,230,0.65)' : 'rgba(245,239,230,0.2)',lineHeight:1.7,fontStyle: entry.personal_note?'normal':'italic'}}>
              {entry.personal_note || t.noNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Journal() {
  const { lang } = useContext(LangContext);
  const t = T[lang];
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    axios.get('/api/journal').then(r=>{setEntries(r.data);setLoading(false);}).catch(()=>setLoading(false));
  },[]);

  const handleUpdate = (updated) => setEntries(prev=>prev.map(e=>e.id===updated.id?updated:e));
  const handleDelete = async (id) => {
    await axios.delete(`/api/journal/${id}`);
    setEntries(prev=>prev.filter(e=>e.id!==id));
  };

  const uniqueVerses = [...new Set(entries.map(e=>e.verse_key))].length;
  const daysJourney = entries.length>0 ? Math.max(1, Math.ceil((Date.now()-new Date(entries[entries.length-1].created_at))/86400000)) : 0;
  const streakMsg = entries.length>0 ? t.streakMsg(daysJourney) : '';

  return (
    <main style={{minHeight:'100vh',padding:'110px 24px 80px',maxWidth:'780px',margin:'0 auto',direction:lang==='ar'?'rtl':'ltr'}}>
      {/* Header */}
      <div style={{marginBottom:'40px'}} className="fade-up">
        <span style={{display:'inline-block',fontSize:'0.72rem',fontWeight:500,letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(201,168,76,0.7)',marginBottom:'12px'}}>{t.eyebrow}</span>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(2rem,5vw,3rem)',fontWeight:300,color:'#f5efe6',lineHeight:1.2,marginBottom:'10px'}}>
          {t.h1a}<br/><span style={{color:'#c9a84c'}}>{t.h1b}</span>
        </h1>
        <p style={{fontSize:'0.95rem',color:'rgba(245,239,230,0.4)'}}>{t.subtitle}</p>
      </div>

      {/* Stats */}
      {!loading && entries.length>0 && (
        <div style={{display:'flex',gap:'16px',marginBottom:'32px',flexWrap:'wrap'}} className="fade-up-delay-1">
          {[
            {num:entries.length,label:t.reflections},
            {num:uniqueVerses,label:t.versesDiscovered},
            {num:daysJourney,label:t.dayJourney},
          ].map(s=>(
            <div key={s.label} style={{background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:'14px',padding:'18px 24px',flex:'1',minWidth:'110px',textAlign:'center'}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'2.2rem',fontWeight:300,color:'#c9a84c',lineHeight:1}}>{s.num}</div>
              <div style={{fontSize:'0.7rem',color:'rgba(245,239,230,0.4)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:'6px'}}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Streak message */}
      {streakMsg && (
        <div style={{textAlign:'center',marginBottom:'32px',fontSize:'0.9rem',color:'rgba(201,168,76,0.7)',fontStyle:'italic'}}>{streakMsg}</div>
      )}

      {/* Book-style chapter divider */}
      {entries.length>0 && (
        <div style={{textAlign:'center',marginBottom:'32px',fontSize:'0.72rem',letterSpacing:'0.25em',textTransform:'uppercase',color:'rgba(245,239,230,0.2)'}}>
          ✦ ─────── {t.journey} ─────── ✦
        </div>
      )}

      {loading && <div style={{textAlign:'center',padding:'80px 0',color:'rgba(245,239,230,0.3)',fontFamily:"'Cormorant Garamond',serif",fontSize:'1.1rem',fontStyle:'italic'}}>Loading...</div>}
      {!loading && entries.length===0 && <div style={{textAlign:'center',padding:'80px 0',color:'rgba(245,239,230,0.3)',fontFamily:"'Cormorant Garamond',serif",fontSize:'1.1rem',fontStyle:'italic'}}>{t.empty}</div>}

      {entries.map((entry,i)=>(
        <div key={entry.id} className="fade-up" style={{animationDelay:`${i*0.08}s`}}>
          {/* Month/year separator */}
          {(i===0 || format(new Date(entries[i-1].created_at),'MMM yyyy')!==format(new Date(entry.created_at),'MMM yyyy')) && (
            <div style={{textAlign:'center',margin:'24px 0 20px',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(201,168,76,0.4)'}}>
              ── {format(new Date(entry.created_at),'MMMM yyyy')} ──
            </div>
          )}
          <EntryCard entry={entry} onUpdate={handleUpdate} onDelete={handleDelete} lang={lang}/>
        </div>
      ))}
    </main>
  );
}
