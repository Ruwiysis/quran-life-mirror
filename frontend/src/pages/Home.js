import React, { useState, useContext } from 'react';
import axios from 'axios';
import VerseCard from '../components/VerseCard';
import { LangContext } from '../App';

const T = {
  en: {
    eyebrow:'Quran Life Mirror',
    h1a:'What\'s weighing on',h1b:'your heart today?',
    subtitle:'Describe your situation or emotion and discover Quranic verses that speak directly to where you are right now.',
    label:'Share what you\'re going through',
    placeholder:'e.g. I feel overwhelmed and like nothing I do is ever enough. I\'m exhausted trying to keep up with everything...',
    btn:'Find Verses ✦', btnLoading:'Searching...',
    searching:'Searching the Quran for your heart\'s question...',
    found:(n)=>`${n} verse${n>1?'s':''} found for you`,
    errorShort:'Please share a bit more about what you\'re going through.',
    errorGeneral:'Something went wrong. Please try again.',
    tip:'Tip: Be specific about your feelings for better results. Cmd+Enter to search.',
  },
  ar: {
    eyebrow:'مرآة القرآن',
    h1a:'ما الذي يثقل',h1b:'قلبك اليوم؟',
    subtitle:'صِف حالتك أو مشاعرك واكتشف آيات قرآنية تتحدث مباشرة إلى وضعك الآن.',
    label:'شارك ما تمر به',
    placeholder:'مثال: أشعر بالإرهاق ولا أستطيع مواكبة كل شيء...',
    btn:'ابحث عن آيات ✦', btnLoading:'جارٍ البحث...',
    searching:'نبحث في القرآن عن سؤال قلبك...',
    found:(n)=>`${n} آيات وجدناها لك`,
    errorShort:'يرجى مشاركة المزيد عن حالتك.',
    errorGeneral:'حدث خطأ. يرجى المحاولة مجدداً.',
    tip:'نصيحة: كن محدداً في مشاعرك للحصول على نتائج أفضل.',
  }
};

const EXAMPLES = {
  en:["I feel like I'm failing at everything I try","I'm grieving the loss of someone I loved","I'm anxious about my future and feel lost","I feel alone even when surrounded by people","I made a big mistake and feel ashamed","I have no idea what my purpose is"],
  ar:["أشعر أنني أفشل في كل ما أفعله","أنا في حزن عميق على فقدان شخص أحببته","أشعر بالقلق من مستقبلي","أشعر بالوحدة حتى وسط الناس","ارتكبت خطأً كبيراً وأشعر بالخجل","لا أعرف ما هو هدفي في الحياة"],
};

export default function Home() {
  const { lang } = useContext(LangContext);
  const t = T[lang];
  const [situation, setSituation] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSearch = async () => {
    if (!situation.trim() || situation.length < 10) { setError(t.errorShort); return; }
    setError(''); setLoading(true); setResults([]);
    try {
      const { data } = await axios.post('/api/search', { situation });
      setResults(data);
    } catch(e) {
      setError(e?.response?.data?.detail || t.errorGeneral);
    } finally { setLoading(false); }
  };

  return (
    <main style={{minHeight:'100vh',padding:'110px 24px 80px',maxWidth:'780px',margin:'0 auto',direction:lang==='ar'?'rtl':'ltr'}}>
      {/* Hero */}
      <div style={{textAlign:'center',marginBottom:'56px'}} className="fade-up">
        <span style={{display:'inline-block',fontSize:'0.72rem',fontWeight:500,letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(201,168,76,0.7)',marginBottom:'18px'}}>{t.eyebrow}</span>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(2.4rem,6vw,3.8rem)',fontWeight:300,lineHeight:1.15,color:'#f5efe6',marginBottom:'18px'}}>
          {t.h1a}<br/><span style={{color:'#c9a84c'}}>{t.h1b}</span>
        </h1>
        <p style={{fontSize:'1rem',color:'rgba(245,239,230,0.5)',maxWidth:'480px',margin:'0 auto',lineHeight:1.8}}>{t.subtitle}</p>
      </div>

      {/* Form */}
      <div className="fade-up-delay-1" style={{background:'rgba(30,38,64,0.5)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:'20px',padding:'32px',backdropFilter:'blur(16px)',marginBottom:'40px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <label style={{display:'block',fontSize:'0.75rem',fontWeight:500,letterSpacing:'0.15em',textTransform:'uppercase',color:'rgba(201,168,76,0.7)',marginBottom:'12px'}}>{t.label}</label>
        <textarea
          value={situation} onChange={e=>setSituation(e.target.value)}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          onKeyDown={e=>{if(e.key==='Enter'&&e.metaKey)handleSearch();}}
          placeholder={t.placeholder}
          style={{
            width:'100%',minHeight:'120px',background:'rgba(10,15,30,0.6)',
            border:`1px solid ${focused?'rgba(201,168,76,0.5)':'rgba(201,168,76,0.2)'}`,
            borderRadius:'12px',padding:'16px 20px',color:'#f5efe6',
            fontSize:'1rem',fontFamily:"'DM Sans',sans-serif",fontWeight:300,
            lineHeight:1.7,resize:'vertical',outline:'none',transition:'border-color 0.2s',
            direction:lang==='ar'?'rtl':'ltr',
          }}
        />
        {/* Example chips */}
        <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'14px'}}>
          {EXAMPLES[lang].map((ex,i)=>(
            <button key={i} onClick={()=>setSituation(ex)} style={{
              fontSize:'0.78rem',color:'rgba(245,239,230,0.45)',
              border:'1px solid rgba(245,239,230,0.12)',borderRadius:'20px',
              padding:'5px 13px',cursor:'pointer',transition:'all 0.2s',
              background:'transparent',fontFamily:"'DM Sans',sans-serif",
            }}
            onMouseEnter={e=>{e.target.style.borderColor='rgba(201,168,76,0.35)';e.target.style.color='rgba(245,239,230,0.7)';}}
            onMouseLeave={e=>{e.target.style.borderColor='rgba(245,239,230,0.12)';e.target.style.color='rgba(245,239,230,0.45)';}}
            >{ex}</button>
          ))}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'18px',flexWrap:'wrap',gap:'10px'}}>
          <span style={{fontSize:'0.72rem',color:'rgba(245,239,230,0.25)'}}>{t.tip}</span>
          <button onClick={handleSearch} disabled={loading||situation.length<10} style={{
            background:'linear-gradient(135deg,#c9a84c,#a87c2a)',color:'#0a0f1e',
            border:'none',padding:'12px 32px',borderRadius:'30px',
            fontSize:'0.9rem',fontWeight:500,fontFamily:"'DM Sans',sans-serif",
            letterSpacing:'0.06em',cursor:situation.length<10?'not-allowed':'pointer',
            opacity:loading||situation.length<10?0.5:1,
            boxShadow:'0 4px 20px rgba(201,168,76,0.3)',transition:'all 0.2s',
          }}>{loading ? t.btnLoading : t.btn}</button>
        </div>
      </div>

      {error && <div style={{background:'rgba(180,60,60,0.15)',border:'1px solid rgba(180,60,60,0.3)',borderRadius:'12px',padding:'16px 20px',color:'rgba(245,239,230,0.7)',fontSize:'0.9rem',marginBottom:'24px'}}>{error}</div>}

      {loading && (
        <div style={{textAlign:'center',padding:'48px 0',color:'rgba(201,168,76,0.7)',fontFamily:"'Cormorant Garamond',serif",fontSize:'1.1rem',fontStyle:'italic'}}>
          <div style={{marginBottom:'16px',display:'flex',justifyContent:'center',gap:'8px'}}>
            {[0,0.2,0.4].map((d,i)=>(
              <span key={i} style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#c9a84c',animation:`shimmer 1.4s ${d}s ease-in-out infinite`}}/>
            ))}
          </div>
          {t.searching}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <div style={{fontSize:'0.72rem',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(201,168,76,0.5)',marginBottom:'24px',textAlign:'center'}}>
            {t.found(results.length)}
          </div>
          {results.map((verse,i)=>(
            <VerseCard key={verse.verse_key} verse={verse} situation={situation} index={i} />
          ))}
        </div>
      )}
    </main>
  );
}
