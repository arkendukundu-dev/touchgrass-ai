import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Brain, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, Compass, Flame, Footprints, Github, Leaf, MapPin, Menu, Moon, Plus, RefreshCw, Settings2, ShieldCheck, Sparkles, Sun, Target, Trees, Trophy, X, Zap } from 'lucide-react';
import './style.css';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const seedQuests = [
  { id: 'q1', category: 'MOVE YOUR BODY', title: 'Take the scenic route', description: 'Walk somewhere you usually commute to. Take one turn you’ve never taken before.', time: '15 min', xp: 40, icon: 'footprints', color: 'mint', tag: 'easy' },
  { id: 'q2', category: 'NOTICE MORE', title: 'Find your tiny nature', description: 'Find 3 things growing through concrete. Take a breath. Leave them be.', time: '10 min', xp: 30, icon: 'leaf', color: 'yellow', tag: 'easy' },
  { id: 'q3', category: 'MAKE A CONNECTION', title: 'The no-phone hello', description: 'Say a genuine hello to someone you see regularly but have never spoken to.', time: '5 min', xp: 50, icon: 'sun', color: 'pink', tag: 'brave' },
];
const iconMap = { footprints: Footprints, leaf: Leaf, sun: Sun, compass: Compass, trees: Trees, zap: Zap };
const categoryOptions = ['Surprise me', 'Move your body', 'Notice more', 'Make a connection', 'Create something'];

function App() {
  const [quests, setQuests] = useState(() => { try { return JSON.parse(localStorage.getItem('tg-quests')) || seedQuests; } catch { return seedQuests; } });
  const [completed, setCompleted] = useState(() => { try { return JSON.parse(localStorage.getItem('tg-completed')) || []; } catch { return []; } });
  const [xp, setXp] = useState(() => Number(localStorage.getItem('tg-xp')) || 120);
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('tg-streak')) || 3);
  const [activeTab, setActiveTab] = useState('Today');
  const [showSettings, setShowSettings] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showToast, setShowToast] = useState('');
  const [category, setCategory] = useState('Surprise me');
  const [energy, setEnergy] = useState('A little low');
  const [minutes, setMinutes] = useState('15');
  const [customTitle, setCustomTitle] = useState('');
  const [aiStatus, setAiStatus] = useState('checking');
  const [aiMode, setAiMode] = useState('auto');
  const [mobileMenu, setMobileMenu] = useState(false);
  const doneCount = completed.length;
  const progress = Math.min(100, Math.round((doneCount / 3) * 100));
  const level = Math.floor(xp / 100) + 1;

  useEffect(() => { localStorage.setItem('tg-quests', JSON.stringify(quests)); }, [quests]);
  useEffect(() => { localStorage.setItem('tg-completed', JSON.stringify(completed)); }, [completed]);
  useEffect(() => { localStorage.setItem('tg-xp', String(xp)); }, [xp]);
  useEffect(() => { localStorage.setItem('tg-streak', String(streak)); }, [streak]);
  useEffect(() => { fetch(`${API_BASE}/api/health`).then(r => r.ok ? r.json() : Promise.reject()).then(d => setAiStatus(d.ollama_available ? 'connected' : 'local')).catch(() => setAiStatus('local')); }, []);
  useEffect(() => { if (showToast) { const t = setTimeout(() => setShowToast(''), 2800); return () => clearTimeout(t); } }, [showToast]);

  const completedQuests = useMemo(() => quests.filter(q => completed.includes(q.id)), [quests, completed]);
  const notify = (message) => setShowToast(message);

  async function generateQuests() {
    notify('finding a little adventure…');
    try {
      const response = await fetch(`${API_BASE}/api/quests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, energy, minutes: Number(minutes), count: 3 }) });
      if (!response.ok) throw new Error('offline');
      const data = await response.json();
      if (data.quests?.length) { setQuests(data.quests.map((q, i) => ({ ...q, id: `q-${Date.now()}-${i}`, icon: q.icon || ['footprints','leaf','sun'][i % 3], color: q.color || ['mint','yellow','pink'][i % 3] }))); setCompleted([]); notify(data.source === 'ollama' ? 'fresh quests, powered by open AI ✳' : 'fresh quests, made for the real world ✳'); return; }
    } catch {}
    const filtered = [...seedQuests].sort(() => Math.random() - .5).map((q, i) => ({ ...q, id: `q-${Date.now()}-${i}` }));
    setQuests(filtered); setCompleted([]); notify('new adventures, no internet required ✳');
  }

  function finishQuest(quest) {
    if (completed.includes(quest.id)) return;
    setCompleted(prev => [...prev, quest.id]); setXp(prev => prev + quest.xp); setStreak(prev => Math.max(1, prev));
    notify(`+${quest.xp} xp — you showed up for real life 🌱`);
  }

  function addCustomQuest(e) {
    e.preventDefault(); if (!customTitle.trim()) return;
    setQuests(prev => [{ id: `custom-${Date.now()}`, category: 'YOUR OWN ADVENTURE', title: customTitle.trim(), description: 'Your idea. Your pace. Step away from the screen and make it happen.', time: `${minutes} min`, xp: 35, icon: 'compass', color: 'lavender', tag: 'yours' }, ...prev]);
    setCustomTitle(''); setShowCreate(false); notify('your quest is on the board ✳');
  }

  const navItems = [{ label: 'Today', icon: Sun }, { label: 'My journey', icon: Footprints }, { label: 'Field notes', icon: Trees }];
  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'mobile-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Leaf size={21} strokeWidth={2.6}/></div><span>touchgrass<span className="brand-period">.</span></span><button className="mobile-close icon-button" onClick={() => setMobileMenu(false)}><X size={18}/></button></div>
      <div className="side-label">YOUR LITTLE OUTSIDE</div>
      <nav>{navItems.map(({label, icon: Icon}) => <button key={label} onClick={() => {setActiveTab(label);setMobileMenu(false)}} className={`nav-link ${activeTab === label ? 'active' : ''}`}><Icon size={18}/><span>{label}</span>{label === 'Today' && <span className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-spacer"/>
      <div className="streak-card"><div className="streak-top"><div className="streak-icon"><Flame size={18}/></div><span className="mono">YOUR STREAK</span></div><div className="streak-number">{streak}<span> days</span></div><p>Little steps count. Keep your outside streak alive.</p><div className="streak-days">{['M','T','W','T','F','S','S'].map((d,i)=><span key={i} className={i < streak % 7 || streak >= 7 ? 'day-done' : ''}>{i < streak % 7 || streak >= 7 ? <Check size={11}/> : d}</span>)}</div></div>
      <button className="nav-link settings-link" onClick={() => setShowSettings(true)}><Settings2 size={18}/><span>Settings & AI</span></button>
      <div className="sidebar-footer"><div className="avatar">TG</div><div><strong>Offline by choice</strong><span>your data stays yours</span></div><ShieldCheck size={16} className="footer-shield"/></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)}><Menu size={20}/></button><div className="breadcrumb">YOUR SPACE <span>/</span> <strong>{activeTab.toUpperCase()}</strong></div><div className="topbar-right"><span className="ai-pill"><span className={`status-dot ${aiStatus === 'connected' ? 'online' : ''}`}/>{aiStatus === 'connected' ? 'LOCAL AI CONNECTED' : 'OPEN AI · OFFLINE READY'}</span><button className="profile-button" onClick={() => setShowSettings(true)} aria-label="Settings"><span>🌱</span></button></div></header>
      {activeTab === 'Today' ? <>
        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/> A SMALL INVITATION TO LOG OFF</div><h1>the world is still<br/><em>out there.</em></h1><p className="welcome-copy">A little less scrolling. A little more living.<br/>Your AI sidekick has a few ideas for today.</p><div className="welcome-actions"><button className="primary-button" onClick={() => document.getElementById('quest-board')?.scrollIntoView({behavior:'smooth'})}>Let’s go outside <ArrowUpRight size={17}/></button><span className="no-pressure"><span>✳</span> no streak guilt. ever.</span></div></div><div className="hero-art" aria-label="Illustration of a sunny outdoor landscape"><div className="sun-disc"/><div className="cloud cloud-one"/><div className="cloud cloud-two"/><div className="hill hill-back"/><div className="hill hill-front"/><div className="hero-flower flower-one">✳</div><div className="hero-flower flower-two">✿</div><div className="hero-flower flower-three">✳</div><div className="hero-person"><div className="person-head"/><div className="person-body"/><div className="person-leg leg-one"/><div className="person-leg leg-two"/><div className="person-arm"/></div><div className="art-note"><span className="note-star">✳</span><span>go be<br/>a person</span></div><span className="art-caption">FIG. 01 — OUT THERE</span></div></section>
        <section className="stats-row"><div className="stat-card"><div className="stat-icon mint-icon"><Footprints size={18}/></div><div><span className="stat-label">QUESTS COMPLETED</span><div className="stat-value">{doneCount}<span> / {quests.length}</span></div></div><div className="stat-mini-progress"><div style={{width:`${quests.length ? doneCount/quests.length*100 : 0}%`}}/></div></div><div className="stat-card"><div className="stat-icon yellow-icon"><Zap size={18}/></div><div><span className="stat-label">GOOD HUMAN POINTS</span><div className="stat-value">{xp}<span> xp</span></div></div><div className="stat-trend"><ArrowUpRight size={14}/> level {level}</div></div><div className="stat-card stat-quote"><span className="quote-mark">“</span><p>you don’t have to<br/>earn your rest.</p><span className="quote-credit">A NOTE FROM YOUR AI</span></div></section>
        <section className="quest-section" id="quest-board"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> THE DAILY FIELD GUIDE</div><h2>your outside quests<span className="green-period">.</span></h2><p>tiny missions, real-life rewards. pick one, or do absolutely nothing.</p></div><button className="outline-button" onClick={generateQuests}><RefreshCw size={15}/> Remix my day</button></div>
          <div className="quest-grid">{quests.map((quest,index)=>{const Icon=iconMap[quest.icon] || Compass;const isDone=completed.includes(quest.id);return <article className={`quest-card ${isDone?'quest-done':''}`} key={quest.id}><div className={`quest-card-top ${quest.color || 'mint'}`}><span className="quest-number">FIELD NOTE 0{index+1}</span><span className="quest-symbol"><Icon size={24}/></span><span className="quest-shape shape-a"/><span className="quest-shape shape-b"/><span className="quest-shape shape-c"/></div><div className="quest-card-body"><div className="quest-category">{quest.category}</div><h3>{quest.title}</h3><p>{quest.description}</p><div className="quest-meta"><span><Clock3 size={14}/>{quest.time}</span><span><Sparkles size={14}/>{quest.xp} xp</span><span className="difficulty">{quest.tag || 'easy'}</span></div><button className={`quest-action ${isDone?'completed-action':''}`} onClick={() => isDone ? notify('already in the bag. nice one!') : finishQuest(quest)}>{isDone ? <><CheckCircle2 size={16}/> done & dusted</> : <>I did this <ArrowRight size={16}/></>}</button></div></article>})}
            <button className="add-quest-card" onClick={() => setShowCreate(true)}><span className="add-circle"><Plus size={22}/></span><strong>make your own quest</strong><span>the best adventures are the ones you invent.</span><span className="add-link">ADD A FIELD NOTE <ArrowUpRight size={14}/></span></button>
          </div>
        </section>
        <section className="bottom-banner"><div className="banner-icon"><Brain size={22}/></div><div><span className="banner-kicker">A NOTE ON OPEN AI</span><h3>your AI should help you live, not keep you here.</h3><p>Quests are generated with open-weight models when available. Your progress stays on this device.</p></div><button onClick={() => setShowSettings(true)}>How it works <ArrowUpRight size={15}/></button></section>
      </> : activeTab === 'My journey' ? <Journey quests={quests} completed={completed} xp={xp} streak={streak} onBack={() => setActiveTab('Today')}/> : <FieldNotes onCreate={() => setShowCreate(true)} />}
      <footer className="page-footer"><span>MADE FOR LIFE, NOT THE FEED <span className="footer-spark">✳</span></span><span>OPEN SOURCE, OPEN AIR. <a href="https://github.com" target="_blank" rel="noreferrer"><Github size={13}/> CONTRIBUTE</a></span></footer>
    </main>
    {mobileMenu && <div className="mobile-scrim" onClick={() => setMobileMenu(false)}/>}
    {showSettings && <div className="modal-backdrop" onClick={() => setShowSettings(false)}><div className="modal settings-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowSettings(false)}><X size={18}/></button><div className="modal-kicker"><Brain size={15}/> OPEN BY DESIGN</div><h2>your AI, your rules<span className="green-period">.</span></h2><p className="modal-intro">Touchgrass is designed to work without sending your personal data to a cloud service. Bring your own open model if you want more creative quests.</p><div className="setting-row"><div className="setting-symbol"><ShieldCheck size={19}/></div><div><strong>Privacy first</strong><span>Quest progress is stored in your browser. No account, no tracking.</span></div><span className="setting-badge">ON DEVICE</span></div><div className="setting-row"><div className="setting-symbol"><Brain size={19}/></div><div><strong>Open-weight model</strong><span>{aiStatus==='connected'?'Connected to Ollama on your backend.':'Ollama not detected — using the built-in offline quest engine.'}</span></div><span className={`setting-badge ${aiStatus==='connected'?'badge-green':''}`}>{aiStatus==='connected'?'CONNECTED':'OFFLINE MODE'}</span></div><div className="setting-field"><label>QUEST GENERATION</label><select value={aiMode} onChange={e=>setAiMode(e.target.value)}><option value="auto">Automatic (recommended)</option><option value="offline">Offline quest engine only</option><option value="open">Prefer open-weight AI</option></select></div><div className="how-box"><div><CircleHelp size={17}/></div><p><strong>Want to run it locally?</strong><br/>Install Ollama, pull <code>qwen2.5:3b</code>, and start the FastAPI backend. See the README for setup steps.</p></div><button className="primary-button full-button" onClick={()=>{setShowSettings(false);notify('your settings are saved for this session ✳')}}>All good <Check size={16}/></button></div></div>}
    {showCreate && <div className="modal-backdrop" onClick={()=>setShowCreate(false)}><div className="modal create-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowCreate(false)}><X size={18}/></button><div className="modal-kicker"><Compass size={15}/> YOUR WORLD, YOUR RULES</div><h2>dream up a little adventure<span className="green-period">.</span></h2><p className="modal-intro">It doesn’t have to be impressive. It just has to get you out there.</p><form onSubmit={addCustomQuest}><label htmlFor="quest-title">YOUR QUEST</label><input id="quest-title" value={customTitle} onChange={e=>setCustomTitle(e.target.value)} placeholder="e.g. watch the sunset without my phone" autoFocus maxLength={80}/><label>HOW MUCH TIME HAVE YOU GOT?</label><div className="time-options">{['5','10','15','30'].map(n=><button type="button" className={minutes===n?'selected':''} key={n} onClick={()=>setMinutes(n)}>{n} min</button>)}</div><button className="primary-button full-button" type="submit" disabled={!customTitle.trim()}>Add to my field guide <ArrowRight size={16}/></button></form></div></div>}
    {showToast && <div className="toast"><span>✳</span>{showToast}</div>}
  </div>;
}

function Journey({quests, completed, xp, streak, onBack}) {
  return <div className="subpage"><div className="eyebrow"><span className="eyebrow-line"/> YOUR LITTLE TIMELINE</div><h1>look at you, <em>living.</em></h1><p className="subpage-intro">Every tiny thing counts. Here’s the proof.</p><div className="journey-stats"><div><span>OUTSIDE STREAK</span><strong>{streak}<small> days</small></strong></div><div><span>TOTAL XP</span><strong>{xp}<small> points</small></strong></div><div><span>QUESTS DONE</span><strong>{completed.length}<small> quests</small></strong></div></div><div className="timeline"><h2>your field notes<span className="green-period">.</span></h2>{completed.length ? quests.filter(q=>completed.includes(q.id)).map((q,i)=><div className="timeline-item" key={q.id}><div className="timeline-check"><Check size={15}/></div><div><span className="timeline-date">RECENTLY COMPLETED · +{q.xp} XP</span><h3>{q.title}</h3><p>{q.description}</p></div></div>) : <div className="empty-state"><div className="empty-illustration">🌱</div><h3>your story starts outside.</h3><p>Complete a quest and it’ll show up here. No pressure, no rush.</p><button className="primary-button" onClick={onBack}>Pick a tiny quest <ArrowRight size={16}/></button></div>}</div></div>
}
function FieldNotes({onCreate}) {
  return <div className="subpage notes-page"><div className="eyebrow"><span className="eyebrow-line"/> A LITTLE INSPIRATION</div><h1>field <em>notes.</em></h1><p className="subpage-intro">Little reminders for a life that happens beyond the glass.</p><div className="notes-grid"><article className="note-card note-mint"><span>NOTE NO. 001 / ATTENTION</span><div className="note-big">look up.<br/>the sky is<br/><em>doing stuff.</em></div><span className="note-bottom">A 30-SECOND RESET <Sun size={16}/></span></article><article className="note-card note-yellow"><span>NOTE NO. 002 / CONNECTION</span><div className="note-big">be where<br/>your <em>feet</em><br/>are.</div><span className="note-bottom">NO MULTITASKING <Footprints size={16}/></span></article><article className="note-card note-pink"><span>NOTE NO. 003 / PERMISSION</span><div className="note-big">you are<br/>not a <em>machine.</em></div><span className="note-bottom">REST IS REAL <Moon size={16}/></span></article></div><div className="notes-cta"><div><strong>got your own reminder?</strong><span>Turn it into a real-world quest.</span></div><button className="primary-button" onClick={onCreate}>Make a quest <Plus size={16}/></button></div></div>
}

createRoot(document.getElementById('root')).render(<App/>);
