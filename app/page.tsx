'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  HeartPulse,
  Home,
  Leaf,
  LockKeyhole,
  Menu,
  MessageCircle,
  Mic,
  Moon,
  Phone,
  Pill,
  Play,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UsersRound,
  Volume2,
  X,
} from 'lucide-react'

type Section = 'Home' | 'Dashboard' | 'Healthcare' | 'Live Connect' | 'Reports' | 'Settings'

type ActivityItem = {
  time: string
  title: string
  detail: string
  icon: typeof Sun
  color: string
  done?: boolean
}

const navItems: { label: Section; icon: typeof Home }[] = [
  { label: 'Home', icon: Home },
  { label: 'Dashboard', icon: BarChart3 },
  { label: 'Healthcare', icon: HeartPulse },
  { label: 'Live Connect', icon: UsersRound },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
]

const initialActivities: ActivityItem[] = [
  { time: '7:00 AM', title: 'Woke up', detail: 'Good morning!', icon: Sun, color: 'gold', done: true },
  { time: '8:00 AM', title: 'Had breakfast', detail: 'Healthy choice', icon: CoffeeIcon, color: 'mint', done: true },
  { time: '10:00 AM', title: 'Took medicine', detail: 'Blood pressure', icon: Pill, color: 'pink', done: true },
  { time: '1:00 PM', title: 'Had lunch', detail: 'Well done!', icon: UtensilsIcon, color: 'gold', done: true },
  { time: '4:00 PM', title: 'Walked (20 mins)', detail: 'Great job!', icon: Activity, color: 'green', done: true },
  { time: '6:00 PM', title: 'Connected with family', detail: 'Video call', icon: UsersRound, color: 'purple', done: false },
]

function CoffeeIcon(props: React.ComponentProps<typeof Sun>) {
  return <span className="coffee-icon" aria-hidden="true">☕</span>
}

function UtensilsIcon(props: React.ComponentProps<typeof Sun>) {
  return <span className="utensils-icon" aria-hidden="true">🍴</span>
}

function AppLogo() {
  return (
    <div className="brand-lockup">
      <div className="brand-mark" aria-hidden="true"><span /><span /></div>
      <div><div className="brand-name">VRAAYU</div><div className="brand-tagline">Always With You</div></div>
    </div>
  )
}

export default function Page() {
  const [activeSection, setActiveSection] = useState<Section>('Home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [replying, setReplying] = useState(false)
  const [command, setCommand] = useState('')
  const [lastResponse, setLastResponse] = useState('')
  const [voicePreference, setVoicePreference] = useState('Auto')
  const recognitionRef = useRef<any>(null)
  const voicePreferenceRef = useRef(voicePreference)

  useEffect(() => { voicePreferenceRef.current = voicePreference }, [voicePreference])

  function speakReply(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const preferred = voicePreferenceRef.current === 'Auto' ? ['David', 'Zira'] : [voicePreferenceRef.current]
    utterance.voice = voices.find((voice) => preferred.some((name) => voice.name.toLowerCase().includes(name.toLowerCase()))) || voices.find((voice) => voice.lang.startsWith('en')) || null
    utterance.rate = 0.92
    window.speechSynthesis.speak(utterance)
  }

  async function askGemini(value: string) {
    const trimmed = value.trim()
    if (!trimmed || replying) return
    setCommand('')
    setReplying(true)
    try {
      const response = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: trimmed }) })
      const data = await response.json()
      const reply = data.reply || 'I am here with you.'
      setLastResponse(reply)
      speakReply(reply)
    } catch {
      setLastResponse('I am having trouble connecting right now, but I am still here with you.')
    } finally {
      setReplying(false)
    }
  }
  const [showEmergency, setShowEmergency] = useState(false)
  const [activities, setActivities] = useState(initialActivities)
  const [fontSize, setFontSize] = useState('Comfortable')
  const [notifications, setNotifications] = useState(true)

  const completed = useMemo(() => activities.filter((item) => item.done).length, [activities])

  function handleCommand(value: string) {
    const normalized = value.toLowerCase()
    setCommand('')
    if (normalized.includes('emergency') || normalized.includes('help')) {
      setShowEmergency(true)
      return
    }
    if (normalized.includes('family') || normalized.includes('call')) {
      setActiveSection('Live Connect')
      setLastResponse('I can help you connect with your family. Choose a contact to start a call.')
    } else if (normalized.includes('medicine') || normalized.includes('health')) {
      setActiveSection('Healthcare')
      setLastResponse('Here is your healthcare plan. Your next medicine is at 8:00 PM.')
    } else if (normalized.includes('report') || normalized.includes('feeling')) {
      setActiveSection('Reports')
      setLastResponse('You have had a positive week. Your activity is up 12 percent.')
    } else {
      void askGemini(value)
    }
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      setLastResponse('I am listening whenever you are ready.')
      return
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setLastResponse('Voice listening is not available in this browser. You can type your message below.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.onstart = () => { setListening(true); setLastResponse('Listening... I am ready.') }
    recognition.onresult = (event: any) => { const transcript = event.results[0][0].transcript; setCommand(transcript); handleCommand(transcript) }
    recognition.onerror = () => { setListening(false); setLastResponse('I could not hear that clearly. Please try again or type below.') }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
  }

  function toggleActivity(index: number) {
    setActivities((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, done: !item.done } : item))
  }

  return (
    <main className={`vraayu-app font-${fontSize.toLowerCase()}`}>
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <button className="mobile-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X /></button>
        <div className="sidebar-top"><AppLogo /></div>
        <nav aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeSection === label ? 'active' : ''}`} onClick={() => { setActiveSection(label); setMenuOpen(false) }}>
              <Icon aria-hidden="true" /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="couple-illustration" aria-hidden="true"><div className="person person-one" /><div className="person person-two" /></div>
          <p>A Safer<br />Kinder<br />Brighter Tomorrow <span>♡</span></p>
        </div>
      </aside>

      <section className="app-main">
        <header className="topbar">
          <div className="topbar-title"><button className="menu-button" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu /></button><h1>{activeSection}</h1></div>
          <div className="welcome"><Sun aria-hidden="true" /><div><strong>Good Evening,</strong><span>Take care today!</span></div><div className="avatar"><CircleUserRound aria-hidden="true" /></div></div>
        </header>

        <div className="content-grid">
          <div className="center-column">
            {activeSection === 'Home' && <HomeView listening={listening} replying={replying} command={command} setCommand={setCommand} onCommand={handleCommand} onListen={toggleListening} lastResponse={lastResponse} setActiveSection={setActiveSection} />}
            {activeSection === 'Dashboard' && <DashboardView activities={activities} completed={completed} toggleActivity={toggleActivity} setShowEmergency={setShowEmergency} />}
            {activeSection === 'Healthcare' && <HealthcareView />}
            {activeSection === 'Live Connect' && <ConnectView setLastResponse={setLastResponse} />}
            {activeSection === 'Reports' && <ReportsView />}
            {activeSection === 'Settings' && <SettingsView fontSize={fontSize} setFontSize={setFontSize} notifications={notifications} setNotifications={setNotifications} voicePreference={voicePreference} setVoicePreference={setVoicePreference} />}
          </div>
          {(activeSection === 'Home' || activeSection === 'Dashboard') && <RightRail activities={activities} completed={completed} setShowEmergency={setShowEmergency} />}
        </div>
      </section>

      {showEmergency && <div className="modal-backdrop" role="presentation"><div className="emergency-modal" role="dialog" aria-modal="true" aria-labelledby="emergency-title"><div className="danger-icon"><AlertTriangle /></div><h2 id="emergency-title">Do you need immediate help?</h2><p>This will simulate a call to your trusted emergency contact. You are in control.</p><div className="modal-actions"><button className="button-secondary" onClick={() => setShowEmergency(false)}>Not now</button><button className="button-danger" onClick={() => { setShowEmergency(false); setLastResponse('Your emergency contact has been notified. Stay calm, help is on the way.') }}><Phone /> Call for help</button></div></div></div>}
    </main>
  )
}

function HomeView({ listening, replying, command, setCommand, onCommand, onListen, lastResponse, setActiveSection }: { listening: boolean; replying: boolean; command: string; setCommand: (value: string) => void; onCommand: (value: string) => void; onListen: () => void; lastResponse: string; setActiveSection: (section: Section) => void }) {
  return <div className="home-view">
    <div className="quote-strip"><Leaf /><span>“Your voice matters. We are here for you.”</span></div>
    <div className={`voice-hero ${listening ? 'is-listening' : ''}`}>
      <button className="voice-orb" aria-label={listening ? 'Stop listening' : 'Start listening'} onClick={onListen}><div className="orb-core"><Mic /></div></button>
      <h2>I&apos;m VRAAYU</h2><p>Speak freely... I&apos;m listening</p>
      {lastResponse && <div className="voice-response" role="status"><Volume2 />{lastResponse}</div>}
    </div>
    <div className="command-box"><button className="input-mic" onClick={onListen} aria-label={listening ? 'Stop voice input' : 'Use voice input'}><Mic /></button><input value={command} disabled={replying} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) onCommand(command) }} placeholder={replying ? 'VRAAYU is replying...' : 'Type a message or speak...'} aria-label="Message VRAAYU" /><button className="send-button" disabled={replying || !command.trim()} onClick={() => onCommand(command)} aria-label="Send message"><Play /></button></div>
    <div className="quick-prompts"><button onClick={() => onCommand("What's my schedule today?")}>What&apos;s my schedule today?</button><button onClick={() => onCommand('Call my family')}>Call my family</button><button onClick={() => onCommand('How am I feeling today?')}>How am I feeling today?</button></div>
    <div className="trust-row"><div><ShieldCheck /><span>Private &amp; Secure</span></div><div><HeartPulse /><span>Always With You</span></div><div><Volume2 /><span>Voice Enabled</span></div></div>
    <div className="home-cards"><button onClick={() => setActiveSection('Healthcare')}><Pill /><span><strong>Next medicine</strong><small>Today at 8:00 PM</small></span><ChevronRight /></button><button onClick={() => setActiveSection('Live Connect')}><UsersRound /><span><strong>Family time</strong><small>Ananya is online now</small></span><ChevronRight /></button></div>
  </div>
}

function DashboardView({ activities, completed, toggleActivity, setShowEmergency }: { activities: ActivityItem[]; completed: number; toggleActivity: (index: number) => void; setShowEmergency: (show: boolean) => void }) {
  return <div className="dashboard-view"><div className="section-intro"><div><p className="eyebrow">Thursday, 11 September 2026</p><h2>Your daily overview</h2></div><span className="completion-badge"><Check /> {completed}/{activities.length} complete</span></div><div className="emergency-card"><AlertTriangle /><div><strong>EMERGENCY</strong><span>Need immediate help?</span></div><button onClick={() => setShowEmergency(true)}><Phone /> Call for Help</button></div><div className="activity-card"><div className="card-heading"><h3>Today&apos;s Activity</h3><button>View all</button></div><div className="activity-list">{activities.map((item, index) => { const Icon = item.icon; return <button className="activity-row" key={item.title} onClick={() => toggleActivity(index)}><span className={`activity-dot ${item.color}`} /><span className="activity-time">{item.time}</span><span className={`activity-icon ${item.color}`}><Icon /></span><span className="activity-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>{item.done && <span className="done-check"><Check /></span>}</button> })}</div></div></div>
}

function RightRail({ activities, completed, setShowEmergency }: { activities: ActivityItem[]; completed: number; setShowEmergency: (show: boolean) => void }) {
  return <aside className="right-rail"><div className="quote-strip"><Leaf /><span>“Your voice matters. We are here for you.”</span></div><div className="rail-card dashboard-mini"><div className="card-heading"><h2>Dashboard</h2><span>Thu, 11 Sep 2026</span></div><button className="mini-emergency" onClick={() => setShowEmergency(true)}><AlertTriangle /><span><strong>EMERGENCY</strong><small>Need immediate help?</small></span><Phone /></button><div className="mini-activity"><div className="card-heading"><h3>Today&apos;s Activity</h3><button>View All</button></div>{activities.slice(0, 4).map((item) => <div className="mini-row" key={item.title}><span className={`activity-dot ${item.color}`} /><span>{item.time}</span><strong>{item.title}</strong>{item.done && <Check />}</div>)}</div></div><div className="rail-card mood-card"><div className="card-heading"><h3>Mood Analyzer</h3><span>Today</span></div><div className="mood-content"><div className="mood-face">●ᴗ●</div><div><strong>Good</strong><span>You seem positive today!</span></div><div className="bars"><i /><i /><i /><i /><i /></div></div><div className="mood-quote"><Leaf /><span>“Small steps every day<br />make a big difference.”</span></div></div></aside>
}

function HealthcareView() { return <div className="page-view"><div className="section-intro"><div><p className="eyebrow">Care plan</p><h2>Your healthcare</h2><p>Everything you need to feel supported and well.</p></div><div className="health-score"><HeartPulse /><strong>92</strong><span>Wellness score</span></div></div><div className="health-grid"><div className="info-card"><div className="card-heading"><h3>Medication schedule</h3><Pill /></div><div className="med-row"><span className="time-pill">8:00 PM</span><span><strong>Blood pressure tablet</strong><small>Amlodipine · 1 tablet</small></span><Check className="green-check" /></div><button className="text-button">View full schedule <ChevronRight /></button></div><div className="info-card"><div className="card-heading"><h3>Upcoming appointment</h3><CalendarDays /></div><div className="appointment"><div className="date-box"><strong>18</strong><span>SEP</span></div><span><strong>Dr. Priya Sharma</strong><small>Friday · 10:30 AM · Video visit</small></span></div><button className="text-button">See appointment details <ChevronRight /></button></div><div className="info-card care-tip"><Sparkles /><div><strong>Today&apos;s care tip</strong><p>Drink a glass of water before your evening medicine.</p></div></div></div></div> }

function ConnectView({ setLastResponse }: { setLastResponse: (value: string) => void }) { const contacts = [{ name: 'Ananya Mehta', relation: 'Daughter · Online', initials: 'AM', color: 'peach' }, { name: 'Rohan Mehta', relation: 'Son · Available', initials: 'RM', color: 'blue' }, { name: 'Care team', relation: 'Support line · 24/7', initials: 'CT', color: 'green' }]; return <div className="page-view"><div className="section-intro"><div><p className="eyebrow">You are never alone</p><h2>Live Connect</h2><p>Reach the people who care about you.</p></div><div className="secure-label"><LockKeyhole /> Private &amp; secure</div></div><div className="connect-list">{contacts.map((contact) => <div className="contact-card" key={contact.name}><div className={`contact-avatar ${contact.color}`}>{contact.initials}</div><div className="contact-details"><strong>{contact.name}</strong><span><i className="online-dot" />{contact.relation}</span></div><button className="icon-action" aria-label={`Call ${contact.name}`} onClick={() => setLastResponse(`Starting a simulated call with ${contact.name}.`)}><Phone /></button><button className="icon-action message-action" aria-label={`Message ${contact.name}`} onClick={() => setLastResponse(`Message composer ready for ${contact.name}.`)}><MessageCircle /></button></div>)}</div><div className="connect-note"><HeartPulse /><span><strong>Connection is care.</strong> A friendly chat can brighten any day.</span></div></div> }

function ReportsView() { return <div className="page-view"><div className="section-intro"><div><p className="eyebrow">Your progress</p><h2>Wellbeing reports</h2><p>Small steps are adding up to a healthier you.</p></div><label className="period-select"><CalendarDays /><span className="sr-only">Report period</span><select aria-label="Report period" defaultValue="This week"><option>This week</option><option>This month</option><option>Last 3 months</option></select></label></div><div className="report-summary"><div><span>Overall wellbeing</span><strong>Good</strong><small>Up 12% from last week</small></div><div><span>Active days</span><strong>5 of 7</strong><small>Keep going!</small></div><div><span>Family connections</span><strong>8</strong><small>Wonderful moments</small></div></div><div className="chart-card"><div className="card-heading"><h3>Daily activity</h3><span>Minutes active</span></div><div className="fake-chart" aria-label="Weekly activity chart"><div className="chart-line" /><div className="chart-bars"><i style={{ height: '42%' }} /><i style={{ height: '65%' }} /><i style={{ height: '50%' }} /><i style={{ height: '78%' }} /><i style={{ height: '90%' }} /><i style={{ height: '70%' }} /><i style={{ height: '55%' }} /></div><div className="chart-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></div></div> }

function SettingsView({ fontSize, setFontSize, notifications, setNotifications, voicePreference, setVoicePreference }: { fontSize: string; setFontSize: (value: string) => void; notifications: boolean; setNotifications: (value: boolean) => void; voicePreference: string; setVoicePreference: (value: string) => void }) { return <div className="page-view"><div className="section-intro"><div><p className="eyebrow">Make it yours</p><h2>Settings</h2><p>Adjust VRAAYU to feel comfortable for you.</p></div></div><div className="settings-list"><label className="setting-row"><span className="setting-icon"><Sparkles /></span><span><strong>Text size</strong><small>Choose the size that feels easiest to read</small></span><select value={fontSize} onChange={(event) => setFontSize(event.target.value)}><option>Comfortable</option><option>Large</option><option>Extra Large</option></select></label><label className="setting-row"><span className="setting-icon"><Bell /></span><span><strong>Gentle reminders</strong><small>Medicine, activity, and appointment reminders</small></span><button className={`toggle ${notifications ? 'on' : ''}`} role="switch" aria-checked={notifications} onClick={() => setNotifications(!notifications)}><span /></button></label><label className="setting-row"><span className="setting-icon"><Volume2 /></span><span><strong>Voice preference</strong><small>Choose David, Zira, or automatic selection</small></span><select value={voicePreference} onChange={(event) => setVoicePreference(event.target.value)} aria-label="Voice preference"><option>Auto</option><option>David</option><option>Zira</option></select></label><label className="setting-row"><span className="setting-icon"><ShieldCheck /></span><span><strong>Privacy &amp; security</strong><small>Your information stays private and secure</small></span><ChevronRight /></label></div><div className="settings-footer"><Moon /> VRAAYU is designed with care for every generation.</div></div> }
