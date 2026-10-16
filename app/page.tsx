'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Coffee,
  Globe2,
  HeartPulse,
  Home,
  Leaf,
  LockKeyhole,
  Menu,
  MessageCircle,
  MessageSquare,
  Mic,
  MicOff,
  Moon,
  Phone,
  PhoneOff,
  Pill,
  Play,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UsersRound,
  Utensils,
  Volume2,
  VolumeX,
  X,
  type LucideIcon,
} from 'lucide-react'

type Section = 'Home' | 'Dashboard' | 'Healthcare' | 'Live Connect' | 'Reports' | 'Settings'
type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking'
export type SupportedLanguage = 'en' | 'hi' | 'mr'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ActivityItem {
  id: string
  time: string
  title: string
  detail: string
  icon: LucideIcon
  color: string
  done: boolean
}

const navItems: { label: Section; icon: LucideIcon }[] = [
  { label: 'Home', icon: Home },
  { label: 'Dashboard', icon: BarChart3 },
  { label: 'Healthcare', icon: HeartPulse },
  { label: 'Live Connect', icon: UsersRound },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
]

const initialActivities: ActivityItem[] = [
  { id: '1', time: '7:00 AM', title: 'Woke up & Water', detail: 'Good morning hydration', icon: Sun, color: 'gold', done: true },
  { id: '2', time: '8:00 AM', title: 'Had breakfast', detail: 'Warm porridge & fruits', icon: Coffee, color: 'mint', done: true },
  { id: '3', time: '10:00 AM', title: 'Took morning medicine', detail: 'Vitamins & calcium', icon: Pill, color: 'pink', done: true },
  { id: '4', time: '1:00 PM', title: 'Had lunch', detail: 'Balanced meal & rest', icon: Utensils, color: 'gold', done: true },
  { id: '5', time: '4:00 PM', title: 'Gentle walk (20 mins)', detail: 'Garden stroll in fresh air', icon: Activity, color: 'green', done: true },
  { id: '6', time: '6:00 PM', title: 'Connected with family', detail: 'Evening video catch-up', icon: UsersRound, color: 'purple', done: false },
  { id: '7', time: '8:00 PM', title: 'Evening medicine', detail: 'Blood pressure (Amlodipine)', icon: Pill, color: 'pink', done: false },
]

const defaultPromptsByLang: Record<SupportedLanguage, string[]> = {
  en: [
    'When is my BP medicine?',
    'Gentle knee pain tips',
    'Call daughter Ananya',
    'Doctor appointment details',
  ],
  hi: [
    'मेरी बीपी की गोली का समय?',
    'घुटनों के दर्द की सरल सलाह',
    'बेटी अनन्या को कॉल करो',
    'डॉक्टर अपॉइंटमेंट कब है?',
  ],
  mr: [
    'माझ्या बीपी गोळीची वेळ?',
    'गुडघेदुखीवर सोपे उपाय',
    'मुलगी अनन्याला कॉल करा',
    'डॉक्टरांची भेट कधी आहे?',
  ],
}

const greetingsByLang: Record<SupportedLanguage, string> = {
  en: 'Namaste! I am VRAAYU, your medical help and wellbeing supporter. Tap the orb or speak to me anytime.',
  hi: 'नमस्ते! मैं VRAAYU हूँ, आपका स्वास्थ्य एवं चिकित्सा देखभाल साथी। दवाई, दर्द या किसी भी मदद के लिए मुझसे बोलें।',
  mr: 'नमस्कार! मी VRAAYU, आपला आरोग्य व वैद्यकीय मदत साथीदार. औषधांची वेळ किंवा तब्येतीबद्दल काहीही विचारू शकता.',
}

function AppLogo() {
  return (
    <div className="brand-lockup">
      <div className="brand-mark" aria-hidden="true"><span /><span /></div>
      <div>
        <div className="brand-name">VRAAYU</div>
        <div className="brand-tagline">Always With You</div>
      </div>
    </div>
  )
}

export default function Page() {
  const [activeSection, setActiveSection] = useState<Section>('Home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [assistantState, setAssistantState] = useState<AssistantState>('idle')
  const [language, setLanguage] = useState<SupportedLanguage>('en')
  const [command, setCommand] = useState('')
  const [interimText, setInterimText] = useState('')
  const [lastResponse, setLastResponse] = useState<string>(greetingsByLang['en'])
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(defaultPromptsByLang['en'])
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: greetingsByLang['en'],
      timestamp: 'Just now',
    },
  ])
  const [showHistory, setShowHistory] = useState(false)

  // Interactive Sub-View States
  const [showEmergency, setShowEmergency] = useState(false)
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities)
  const [fontSize, setFontSize] = useState<'Comfortable' | 'Large' | 'Extra Large'>('Comfortable')
  const [notifications, setNotifications] = useState(true)
  const [voicePreference, setVoicePreference] = useState('Auto')

  // Simulated Phone Call State
  const [simulatedCall, setSimulatedCall] = useState<{
    active: boolean
    contact: { name: string; relation: string; initials: string }
    duration: number
    isMuted: boolean
  } | null>(null)

  // Medication Status
  const [medicationTaken, setMedicationTaken] = useState(false)

  const recognitionRef = useRef<any>(null)
  const voicePreferenceRef = useRef(voicePreference)
  const languageRef = useRef(language)
  const [, startTransition] = useTransition()

  useEffect(() => {
    voicePreferenceRef.current = voicePreference
  }, [voicePreference])

  useEffect(() => {
    languageRef.current = language
  }, [language])

  // Call timer simulation
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (simulatedCall?.active) {
      timer = setInterval(() => {
        setSimulatedCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [simulatedCall?.active])

  const completedActivities = useMemo(
    () => activities.filter((item) => item.done).length,
    [activities]
  )

  function handleLanguageChange(newLang: SupportedLanguage) {
    setLanguage(newLang)
    setSuggestedPrompts(defaultPromptsByLang[newLang])
    const newGreeting = greetingsByLang[newLang]
    setLastResponse(newGreeting)
    speakReply(newGreeting, newLang)
  }

  function speakReply(text: string, langOverride?: SupportedLanguage) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const currentLang = langOverride || languageRef.current
    const pref = voicePreferenceRef.current

    let chosenVoice: SpeechSynthesisVoice | null = null

    // Multilingual Voice Detection
    if (currentLang === 'hi') {
      chosenVoice =
        voices.find((v) => v.lang.startsWith('hi')) ||
        voices.find((v) => v.name.toLowerCase().includes('hindi')) ||
        null
    } else if (currentLang === 'mr') {
      chosenVoice =
        voices.find((v) => v.lang.startsWith('mr')) ||
        voices.find((v) => v.name.toLowerCase().includes('marathi')) ||
        voices.find((v) => v.lang.startsWith('hi')) ||
        null
    }

    if (!chosenVoice && pref !== 'Auto') {
      chosenVoice = voices.find((v) => v.name.toLowerCase().includes(pref.toLowerCase())) || null
    }

    if (!chosenVoice) {
      chosenVoice =
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Zira') ||
              v.name.includes('Samantha') ||
              v.name.includes('David'))
        ) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        null
    }

    if (chosenVoice) utterance.voice = chosenVoice
    utterance.rate = 0.88 // Measured, clear pace for older adults
    utterance.pitch = 1.0

    utterance.onstart = () => setAssistantState('speaking')
    utterance.onend = () => setAssistantState('idle')
    utterance.onerror = () => setAssistantState('idle')

    window.speechSynthesis.speak(utterance)
  }

  function stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setAssistantState('idle')
  }

  async function askAssistant(userInput: string) {
    const trimmed = userInput.trim()
    if (!trimmed || assistantState === 'thinking') return

    stopSpeaking()
    setCommand('')
    setInterimText('')
    setAssistantState('thinking')

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: now,
    }

    setMessages((prev) => [...prev, userMsg])

    try {
      const payloadHistory = messages.slice(-4).map((m) => ({ role: m.role, content: m.content }))
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history: payloadHistory, language }),
      })

      const data = await response.json()
      const replyText =
        data.reply ||
        (language === 'hi'
          ? 'मैं हमेशा आपके साथ हूँ। कृपया आराम से बैठें।'
          : language === 'mr'
          ? 'मी सदैव आपल्या सोबत आहे. काळजी करू नका.'
          : 'I am here right beside you.')

      setLastResponse(replyText)
      if (Array.isArray(data.suggestedReplies) && data.suggestedReplies.length > 0) {
        setSuggestedPrompts(data.suggestedReplies)
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, assistantMsg])

      // Execute detected action
      if (data.action) {
        handleAssistantAction(data.action)
      }

      speakReply(replyText)
    } catch {
      const fallbackMsg =
        language === 'hi'
          ? 'मैं हमेशा आपके साथ हूँ। एक शांत साँस लें। मैं आपकी सेहत में क्या मदद करूँ?'
          : language === 'mr'
          ? 'मी सदैव आपल्या सोबत आहे. दीर्घ श्वास घ्या. मी आपल्या आरोग्यासाठी काय मदत करू?'
          : 'I am right here with you. Take a comfortable breath. How may I support your health today?'
      setLastResponse(fallbackMsg)
      setAssistantState('idle')
      speakReply(fallbackMsg)
    }
  }

  function handleAssistantAction(action: { type: string; payload?: any }) {
    if (action.type === 'EMERGENCY') {
      setShowEmergency(true)
    } else if (action.type === 'NAVIGATE' && typeof action.payload === 'string') {
      startTransition(() => setActiveSection(action.payload as Section))
    } else if (action.type === 'CALL_CONTACT' && action.payload) {
      startSimulatedCall(action.payload.name, action.payload.relation)
    } else if (action.type === 'ADJUST_FONT' && action.payload) {
      setFontSize(action.payload)
    }
  }

  function toggleListening() {
    if (assistantState === 'listening') {
      recognitionRef.current?.stop()
      setAssistantState('idle')
      setInterimText('')
      return
    }

    stopSpeaking()

    const SpeechRecognition =
      (typeof window !== 'undefined' &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null

    if (!SpeechRecognition) {
      setLastResponse(
        language === 'hi'
          ? 'इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। आप नीचे लिख सकते हैं।'
          : language === 'mr'
          ? 'या ब्राउझरमध्ये आवाज ओळख उपलब्ध नाही. तुम्ही खाली लिहू शकता.'
          : 'Voice recognition is not supported in this browser. You can type your message in the box below.'
      )
      return
    }

    try {
      const recognition = new SpeechRecognition()
      // Dynamic Speech Recognition Language
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN'
      recognition.interimResults = true
      recognition.continuous = false

      recognition.onstart = () => {
        setAssistantState('listening')
        setInterimText(
          language === 'hi'
            ? 'सुन रहा हूँ... बोलिए...'
            : language === 'mr'
            ? 'ऐकत आहे... बोला...'
            : 'Listening to your voice...'
        )
      }

      recognition.onresult = (event: any) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript
          } else {
            interim += event.results[i][0].transcript
          }
        }

        if (interim) setInterimText(interim)
        if (final) {
          setInterimText('')
          setAssistantState('idle')
          void askAssistant(final)
        }
      }

      recognition.onerror = () => {
        setAssistantState('idle')
        setInterimText('')
      }

      recognition.onend = () => {
        setAssistantState((prev) => (prev === 'listening' ? 'idle' : prev))
        setInterimText('')
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setAssistantState('idle')
      setInterimText('')
    }
  }

  function toggleActivity(id: string) {
    setActivities((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )
  }

  function startSimulatedCall(name: string, relation: string) {
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
    setSimulatedCall({
      active: true,
      contact: { name, relation, initials },
      duration: 0,
      isMuted: false,
    })
  }

  function endSimulatedCall() {
    setSimulatedCall(null)
    setLastResponse(
      language === 'hi'
        ? 'कॉल समाप्त हुआ। आशा है आपकी बातचीत सुखद रही।'
        : language === 'mr'
        ? 'कॉल संपला. आशा आहे आपले बोलणे छान झाले असेल.'
        : 'Call ended. I hope you had a comforting conversation.'
    )
  }

  function previewVoice() {
    const sampleText =
      language === 'hi'
        ? `नमस्ते! यह VRAAYU की आवाज़ का नमूना है। मैं हमेशा आपकी सेवा और सेहत की देखभाल में उपस्थित हूँ।`
        : language === 'mr'
        ? `नमस्कार! हा VRAAYU च्या आवाजाचा नमुना आहे. मी सदैव आपल्या सेवेत आणि आरोग्याच्या मदतीसाठी सोबत आहे.`
        : `Hello! This is how VRAAYU sounds with the ${voicePreference} setting. I hope it feels clear and pleasant for you.`
    speakReply(sampleText)
  }

  return (
    <main className={`vraayu-app font-${fontSize.toLowerCase().replace(' ', '-')}`}>
      {/* Mobile Drawer Backdrop */}
      {menuOpen && (
        <div
          className="sidebar-backdrop"
          role="presentation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <button
          className="mobile-close"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        >
          <X />
        </button>
        <div className="sidebar-top">
          <AppLogo />
        </div>
        <nav aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activeSection === label ? 'active' : ''}`}
              onClick={() => {
                setActiveSection(label)
                setMenuOpen(false)
              }}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="couple-illustration" aria-hidden="true">
            <div className="person person-one" />
            <div className="person person-two" />
          </div>
          <p>
            A Safer<br />
            Kinder<br />
            Brighter Tomorrow <span>♡</span>
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="app-main">
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="menu-button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu />
            </button>
            <h1>{activeSection}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Language Selector Segmented Control */}
            <div className="lang-selector-group" role="radiogroup" aria-label="Select Language">
              <button
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en')}
                aria-label="English"
              >
                EN
              </button>
              <button
                className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('hi')}
                aria-label="हिंदी (Hindi)"
              >
                हिंदी
              </button>
              <button
                className={`lang-btn ${language === 'mr' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('mr')}
                aria-label="मराठी (Marathi)"
              >
                मराठी
              </button>
            </div>

            <div className="welcome">
              <Sun aria-hidden="true" />
              <div>
                <strong>
                  {language === 'hi' ? 'शुभ दिन,' : language === 'mr' ? 'शुभ दिवस,' : 'Good Day,'}
                </strong>
                <span>
                  {language === 'hi'
                    ? 'हमेशा आपके साथ'
                    : language === 'mr'
                    ? 'सदैव आपल्या सोबत'
                    : 'Always with you'}
                </span>
              </div>
              <div className="avatar">
                <CircleUserRound aria-hidden="true" />
              </div>
            </div>
          </div>
        </header>

        <div className="content-grid">
          <div className="center-column">
            {activeSection === 'Home' && (
              <HomeView
                assistantState={assistantState}
                language={language}
                command={command}
                setCommand={setCommand}
                interimText={interimText}
                lastResponse={lastResponse}
                suggestedPrompts={suggestedPrompts}
                onCommand={askAssistant}
                onListen={toggleListening}
                onStopSpeaking={stopSpeaking}
                onReplay={() => speakReply(lastResponse)}
                onOpenHistory={() => setShowHistory(true)}
                setActiveSection={setActiveSection}
              />
            )}
            {activeSection === 'Dashboard' && (
              <DashboardView
                activities={activities}
                completed={completedActivities}
                toggleActivity={toggleActivity}
                setShowEmergency={setShowEmergency}
              />
            )}
            {activeSection === 'Healthcare' && (
              <HealthcareView
                medicationTaken={medicationTaken}
                setMedicationTaken={setMedicationTaken}
              />
            )}
            {activeSection === 'Live Connect' && (
              <ConnectView
                onStartCall={startSimulatedCall}
                setLastResponse={setLastResponse}
              />
            )}
            {activeSection === 'Reports' && <ReportsView />}
            {activeSection === 'Settings' && (
              <SettingsView
                language={language}
                onLanguageChange={handleLanguageChange}
                fontSize={fontSize}
                setFontSize={setFontSize}
                notifications={notifications}
                setNotifications={setNotifications}
                voicePreference={voicePreference}
                setVoicePreference={setVoicePreference}
                onPreviewVoice={previewVoice}
              />
            )}
          </div>

          {(activeSection === 'Home' || activeSection === 'Dashboard') && (
            <RightRail
              activities={activities}
              completed={completedActivities}
              setShowEmergency={setShowEmergency}
            />
          )}
        </div>
      </section>

      {/* Emergency Modal */}
      {showEmergency && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowEmergency(false)}>
          <div
            className="emergency-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="emergency-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="danger-icon">
              <AlertTriangle />
            </div>
            <h2 id="emergency-title">
              {language === 'hi'
                ? 'क्या आपको तुरंत सहायता चाहिए?'
                : language === 'mr'
                ? 'आपणास तातडीची मदत हवी आहे का?'
                : 'Do you need immediate help?'}
            </h2>
            <p>
              {language === 'hi'
                ? 'यह आपके आपातकालीन संपर्क और डॉक्टर को तुरंत सूचित करेगा। आप सुरक्षित हैं।'
                : language === 'mr'
                ? 'हे आपल्या आपत्कालीन संपर्क आणि डॉक्टरांना त्वरित सूचित करेल. आपण सुरक्षित आहात.'
                : 'This will notify your trusted emergency contacts and care team immediately. You are safe and in control.'}
            </p>
            <div className="modal-actions">
              <button className="button-secondary" onClick={() => setShowEmergency(false)}>
                {language === 'hi' ? 'मैं ठीक हूँ' : language === 'mr' ? 'मी ठीक आहे' : 'I am okay'}
              </button>
              <button
                className="button-danger"
                onClick={() => {
                  setShowEmergency(false)
                  const resp =
                    language === 'hi'
                      ? 'आपातकालीन सूचना भेज दी गई है। परिवार और डॉक्टर को संदेश मिल गया है। शांत रहें, सहायता आ रही है।'
                      : language === 'mr'
                      ? 'आपत्कालीन संदेश पाठवला गेला आहे. कुटुंब व डॉक्टरांना माहिती मिळाली आहे. शांत राहा, मदत येत आहे.'
                      : 'Emergency alert sent. Your trusted contacts have been notified. Stay calm, help is reaching you.'
                  setLastResponse(resp)
                  speakReply(resp)
                }}
              >
                <Phone />{' '}
                {language === 'hi'
                  ? 'मदद के लिए कॉल करें'
                  : language === 'mr'
                  ? 'मदतीसाठी कॉल करा'
                  : 'Call for help now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Simulated Voice Call Modal */}
      {simulatedCall?.active && (
        <div className="modal-backdrop" role="presentation">
          <div className="call-modal" role="dialog" aria-modal="true">
            <div className="call-avatar-wrapper">
              <div className="call-ring" />
              <div className="call-avatar">{simulatedCall.contact.initials}</div>
            </div>
            <h3>{simulatedCall.contact.name}</h3>
            <div className="call-status">
              {simulatedCall.duration === 0 ? (
                <span>
                  {language === 'hi'
                    ? 'कॉल मिल रहा है...'
                    : language === 'mr'
                    ? 'कॉल लागत आहे...'
                    : 'Calling...'}
                </span>
              ) : (
                <span>
                  {language === 'hi'
                    ? 'जुड़ा हुआ · '
                    : language === 'mr'
                    ? 'जोडले गेले · '
                    : 'Connected · '}
                  {Math.floor(simulatedCall.duration / 60)
                    .toString()
                    .padStart(2, '0')}
                  :{(simulatedCall.duration % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>

            <div className="orb-soundwave" style={{ justifyContent: 'center', marginBottom: 20 }}>
              <span /><span /><span /><span /><span />
            </div>

            <div className="call-actions">
              <button
                className="call-btn mute"
                aria-label={simulatedCall.isMuted ? 'Unmute' : 'Mute'}
                onClick={() =>
                  setSimulatedCall((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null))
                }
              >
                {simulatedCall.isMuted ? <VolumeX /> : <Volume2 />}
              </button>
              <button
                className="call-btn end"
                aria-label="End call"
                onClick={endSimulatedCall}
              >
                <PhoneOff />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation History Drawer Modal */}
      {showHistory && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowHistory(false)}>
          <div
            className="conversation-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="conversation-header">
              <h3>
                {language === 'hi'
                  ? 'VRAAYU के साथ बातचीत'
                  : language === 'mr'
                  ? 'VRAAYU सोबतचे संभाषण'
                  : 'Conversation with VRAAYU'}
              </h3>
              <button
                className="text-button"
                onClick={() => setShowHistory(false)}
                aria-label="Close history"
              >
                <X />
              </button>
            </div>
            <div className="conversation-messages">
              {messages.map((m) => (
                <div key={m.id} className={`message-bubble ${m.role}`}>
                  <div>{m.content}</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <small style={{ opacity: 0.7, fontSize: '11px' }}>{m.timestamp}</small>
                    {m.role === 'assistant' && (
                      <button
                        className="message-speaker-btn"
                        onClick={() => speakReply(m.content)}
                        aria-label="Replay audio"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

/* ─────────────────────────────────────────────────────────────
   Home View with Multilingual Senior Medical Supporter Orb
   ───────────────────────────────────────────────────────────── */
function HomeView({
  assistantState,
  language,
  command,
  setCommand,
  interimText,
  lastResponse,
  suggestedPrompts,
  onCommand,
  onListen,
  onStopSpeaking,
  onReplay,
  onOpenHistory,
  setActiveSection,
}: {
  assistantState: AssistantState
  language: SupportedLanguage
  command: string
  setCommand: (value: string) => void
  interimText: string
  lastResponse: string
  suggestedPrompts: string[]
  onCommand: (value: string) => void
  onListen: () => void
  onStopSpeaking: () => void
  onReplay: () => void
  onOpenHistory: () => void
  setActiveSection: (section: Section) => void
}) {
  const isListening = assistantState === 'listening'
  const isSpeaking = assistantState === 'speaking'
  const isThinking = assistantState === 'thinking'

  return (
    <div className="home-view">
      {/* Medical Help Supporter Badge */}
      <div className="medical-supporter-badge">
        <HeartPulse />
        <span>
          {language === 'hi'
            ? 'वरिष्ठ स्वास्थ्य एवं प्राथमिक चिकित्सा रक्षक सक्रिय'
            : language === 'mr'
            ? 'ज्येष्ठ नागरिक वैद्यकीय व आरोग्य रक्षक सक्रिय'
            : 'Senior Medical & Wellbeing Supporter Active'}
        </span>
      </div>

      <div className="quote-strip">
        <Leaf />
        <span>
          {language === 'hi'
            ? '“आपकी आवाज़ हमारे लिए अनमोल है। हम सदैव आपके साथ हैं।”'
            : language === 'mr'
            ? '“आपला आवाज आमच्यासाठी मोलाचा आहे. आम्ही सदैव सोबत आहोत.”'
            : '“Your voice matters. We are here for you.”'}
        </span>
      </div>

      <div
        className={`voice-hero ${isListening ? 'is-listening' : ''} ${isSpeaking ? 'is-speaking' : ''} ${isThinking ? 'is-thinking' : ''}`}
      >
        <div className="voice-orb-container">
          <button
            className="voice-orb"
            aria-label={
              isListening ? 'Stop listening' : isSpeaking ? 'Stop speaking' : 'Tap to speak to VRAAYU'
            }
            onClick={isSpeaking ? onStopSpeaking : onListen}
          >
            <div className="orb-core">
              {isSpeaking ? (
                <div className="orb-soundwave">
                  <span /><span /><span /><span /><span />
                </div>
              ) : isThinking ? (
                <Sparkles />
              ) : isListening ? (
                <Mic />
              ) : (
                <Mic />
              )}
            </div>
          </button>
        </div>

        <h2>I&apos;m VRAAYU</h2>
        <p>
          {isListening
            ? language === 'hi'
              ? 'ध्यान से सुन रहा हूँ...'
              : language === 'mr'
              ? 'लक्षपूर्वक ऐकत आहे...'
              : 'Listening closely to you...'
            : isThinking
            ? language === 'hi'
              ? 'सोच रहा हूँ...'
              : language === 'mr'
              ? 'विचार करत आहे...'
              : 'Thinking warmly...'
            : isSpeaking
            ? language === 'hi'
              ? 'बोल रहा हूँ...'
              : language === 'mr'
              ? 'बोलत आहे...'
              : 'Speaking with you...'
            : language === 'hi'
            ? 'बेझिझक बोलिए... मैं सुन रहा हूँ'
            : language === 'mr'
            ? 'मोकळेपणाने बोला... मी ऐकत आहे'
            : 'Speak freely... I am listening'}
        </p>

        {interimText && (
          <div className="interim-speech" role="status">
            <Mic size={16} />
            <span>&ldquo;{interimText}&rdquo;</span>
          </div>
        )}

        {lastResponse && (
          <div className="voice-response" role="status">
            <div className="voice-response-icon">
              {isSpeaking ? <Volume2 /> : <HeartPulse />}
            </div>
            <div className="voice-response-body">
              <div>{lastResponse}</div>
              <div className="voice-response-actions">
                <button
                  className="voice-action-pill"
                  onClick={onReplay}
                  aria-label="Replay voice audio"
                >
                  <RotateCcw size={14} />{' '}
                  {language === 'hi'
                    ? 'फिर से सुनें'
                    : language === 'mr'
                    ? 'पुन्हा ऐका'
                    : 'Listen again'}
                </button>
                {isSpeaking && (
                  <button
                    className="voice-action-pill"
                    onClick={onStopSpeaking}
                    aria-label="Stop audio"
                  >
                    <VolumeX size={14} />{' '}
                    {language === 'hi' ? 'रोकें' : language === 'mr' ? 'थांबवा' : 'Stop'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Command Box Input */}
      <div className="command-box">
        <button
          className={`input-mic ${isListening ? 'active' : ''}`}
          onClick={onListen}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? <MicOff /> : <Mic />}
        </button>
        <input
          value={command}
          disabled={isThinking}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              onCommand(command)
            }
          }}
          placeholder={
            isThinking
              ? language === 'hi'
                ? 'VRAAYU उत्तर तैयार कर रहा है...'
                : language === 'mr'
                ? 'VRAAYU उत्तर तयार करत आहे...'
                : 'VRAAYU is preparing an answer...'
              : language === 'hi'
              ? 'दवाई, दर्द या स्वास्थ्य के बारे में पूछें...'
              : language === 'mr'
              ? 'औषध, वेदना किंवा आरोग्याबद्दल विचारा...'
              : 'Ask about medicines, knee pain, or tap mic to speak...'
          }
          aria-label="Message VRAAYU"
        />
        <button
          className="send-button"
          disabled={isThinking || !command.trim()}
          onClick={() => onCommand(command)}
          aria-label="Send message"
        >
          <Play />
        </button>
      </div>

      {/* Quick Suggested Prompts */}
      <div className="quick-prompts">
        {suggestedPrompts.map((prompt) => (
          <button key={prompt} onClick={() => onCommand(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      {/* History Toggle Button */}
      <div className="history-toggle-row">
        <button className="history-toggle-btn" onClick={onOpenHistory}>
          <MessageSquare size={16} />{' '}
          {language === 'hi'
            ? 'बातचीत का इतिहास देखें'
            : language === 'mr'
            ? 'संभाषणाचा इतिहास पहा'
            : 'View Conversation History'}
        </button>
      </div>

      {/* Trust & Safety Indicator */}
      <div className="trust-row">
        <div>
          <ShieldCheck />
          <span>Private &amp; Secure</span>
        </div>
        <div>
          <HeartPulse />
          <span>Always With You</span>
        </div>
        <div>
          <Volume2 />
          <span>Trilingual Voice</span>
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="home-cards">
        <button onClick={() => setActiveSection('Healthcare')}>
          <Pill />
          <span>
            <strong>
              {language === 'hi'
                ? 'अगली दवाई का समय'
                : language === 'mr'
                ? 'पुढील औषधाची वेळ'
                : 'Next medicine'}
            </strong>
            <small>
              {language === 'hi'
                ? 'आज रात 8:00 बजे · ब्लड प्रेशर (Amlodipine)'
                : language === 'mr'
                ? 'आज रात्री 8:00 वाजता · रक्तदाब (Amlodipine)'
                : 'Today at 8:00 PM · Blood pressure'}
            </small>
          </span>
          <ChevronRight />
        </button>
        <button onClick={() => setActiveSection('Live Connect')}>
          <UsersRound />
          <span>
            <strong>
              {language === 'hi'
                ? 'परिवार से बातचीत'
                : language === 'mr'
                ? 'कुटुंबियांसोबत वेळ'
                : 'Family time'}
            </strong>
            <small>
              {language === 'hi'
                ? 'अनन्या ऑनलाइन हैं · कॉल करने के लिए टैप करें'
                : language === 'mr'
                ? 'अनन्या ऑनलाइन आहे · कॉल करण्यासाठी टॅप करा'
                : 'Ananya is online now · Tap to call'}
            </small>
          </span>
          <ChevronRight />
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Dashboard View
   ───────────────────────────────────────────────────────────── */
function DashboardView({
  activities,
  completed,
  toggleActivity,
  setShowEmergency,
}: {
  activities: ActivityItem[]
  completed: number
  toggleActivity: (id: string) => void
  setShowEmergency: (show: boolean) => void
}) {
  return (
    <div className="page-view">
      <div className="section-intro">
        <div>
          <p className="eyebrow">Daily Schedule &amp; Routine</p>
          <h2>Your daily overview</h2>
          <p>Tap any task to mark it done and keep your routine strong.</p>
        </div>
        <span className="completion-badge">
          <Check /> {completed}/{activities.length} completed
        </span>
      </div>

      <div className="emergency-card">
        <AlertTriangle />
        <div>
          <strong>EMERGENCY ASSISTANCE</strong>
          <span>Need immediate help or feeling unwell?</span>
        </div>
        <button onClick={() => setShowEmergency(true)}>
          <Phone /> Call for Help
        </button>
      </div>

      <div className="activity-card">
        <div className="card-heading">
          <h3>Today&apos;s Checklist</h3>
          <span>Interactive</span>
        </div>
        <div className="activity-list">
          {activities.map((item) => {
            const Icon = item.icon
            return (
              <button
                className="activity-row"
                key={item.id}
                onClick={() => toggleActivity(item.id)}
                aria-label={`Toggle ${item.title}`}
              >
                <span className={`activity-dot ${item.color}`} />
                <span className="activity-time">{item.time}</span>
                <span className={`activity-icon ${item.color}`}>
                  <Icon />
                </span>
                <span className="activity-copy">
                  <strong
                    style={{
                      textDecoration: item.done ? 'line-through' : 'none',
                      opacity: item.done ? 0.75 : 1,
                    }}
                  >
                    {item.title}
                  </strong>
                  <small>{item.detail}</small>
                </span>
                {item.done ? (
                  <span className="done-check">
                    <Check />
                  </span>
                ) : (
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: '1.5px solid #d0d7e5',
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Right Rail (Summary on Desktop)
   ───────────────────────────────────────────────────────────── */
function RightRail({
  activities,
  completed,
  setShowEmergency,
}: {
  activities: ActivityItem[]
  completed: number
  setShowEmergency: (show: boolean) => void
}) {
  return (
    <aside className="right-rail">
      <div className="quote-strip">
        <Leaf />
        <span>“Small steps every day bring great health.”</span>
      </div>

      <div className="rail-card dashboard-mini">
        <div className="card-heading">
          <h2>Overview</h2>
          <span>{completed}/{activities.length} Done</span>
        </div>
        <button className="mini-emergency" onClick={() => setShowEmergency(true)}>
          <AlertTriangle />
          <span>
            <strong>EMERGENCY</strong>
            <small>Quick assistance button</small>
          </span>
          <Phone />
        </button>
        <div className="mini-activity">
          <div className="card-heading">
            <h3>Upcoming</h3>
          </div>
          {activities.slice(0, 4).map((item) => (
            <div className="mini-row" key={item.id}>
              <span className={`activity-dot ${item.color}`} />
              <span>{item.time}</span>
              <strong>{item.title}</strong>
              {item.done && <Check />}
            </div>
          ))}
        </div>
      </div>

      <div className="rail-card mood-card">
        <div className="card-heading">
          <h3>Mood &amp; Energy</h3>
          <span>Today</span>
        </div>
        <div className="mood-content">
          <div className="mood-face">●ᴗ●</div>
          <div>
            <strong>Positive &amp; Calm</strong>
            <span>Active throughout the day</span>
          </div>
          <div className="bars">
            <i /><i /><i /><i /><i />
          </div>
        </div>
        <div className="mood-quote">
          <Leaf />
          <span>
            “Small steps every day<br />
            make a big difference.”
          </span>
        </div>
      </div>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────────────
   Healthcare View with Interactive Medication Tracker
   ───────────────────────────────────────────────────────────── */
function HealthcareView({
  medicationTaken,
  setMedicationTaken,
}: {
  medicationTaken: boolean
  setMedicationTaken: (val: boolean) => void
}) {
  return (
    <div className="page-view">
      <div className="section-intro">
        <div>
          <p className="eyebrow">Care Plan &amp; Wellbeing</p>
          <h2>Your healthcare</h2>
          <p>Everything you need to feel supported, healthy, and on track.</p>
        </div>
        <div className="health-score">
          <HeartPulse />
          <div>
            <strong>92</strong>
            <span> / 100 Wellness score</span>
          </div>
        </div>
      </div>

      <div className="health-grid">
        <div className="info-card">
          <div className="card-heading">
            <h3>Medication schedule</h3>
            <Pill />
          </div>
          <div className="med-row">
            <span className="time-pill">8:00 PM</span>
            <span>
              <strong>Blood pressure tablet</strong>
              <small>Amlodipine · 5mg · 1 tablet with water</small>
            </span>
            <button
              className={`med-toggle-btn ${medicationTaken ? 'taken' : ''}`}
              onClick={() => setMedicationTaken(!medicationTaken)}
            >
              <Check size={16} />
              {medicationTaken ? 'Taken' : 'Mark as Taken'}
            </button>
          </div>
          <button className="text-button">
            View full medication history <ChevronRight />
          </button>
        </div>

        <div className="info-card">
          <div className="card-heading">
            <h3>Upcoming appointment</h3>
            <CalendarDays />
          </div>
          <div className="appointment">
            <div className="date-box">
              <strong>18</strong>
              <span>SEP</span>
            </div>
            <span>
              <strong>Dr. Priya Sharma</strong>
              <small>Friday · 10:30 AM · Video visit via VRAAYU</small>
            </span>
          </div>
          <button className="text-button">
            See visit details &amp; checklist <ChevronRight />
          </button>
        </div>

        <div className="info-card care-tip">
          <Sparkles />
          <div>
            <strong>Today&apos;s care tip</strong>
            <p>
              Remember to drink a warm glass of water 10 minutes before taking your evening medicine for smooth digestion.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Live Connect View with Simulated Phone Calls
   ───────────────────────────────────────────────────────────── */
function ConnectView({
  onStartCall,
  setLastResponse,
}: {
  onStartCall: (name: string, relation: string) => void
  setLastResponse: (value: string) => void
}) {
  const contacts = [
    { name: 'Ananya Mehta', relation: 'Daughter · Online now', initials: 'AM', color: 'peach' },
    { name: 'Rohan Mehta', relation: 'Son · Available', initials: 'RM', color: 'blue' },
    { name: 'Care Team Desk', relation: 'Support line · 24/7 Available', initials: 'CT', color: 'green' },
  ]

  return (
    <div className="page-view">
      <div className="section-intro">
        <div>
          <p className="eyebrow">Stay Close to Loved Ones</p>
          <h2>Live Connect</h2>
          <p>Reach the people who care about you with a single tap.</p>
        </div>
        <div className="secure-label">
          <LockKeyhole /> Private &amp; secure
        </div>
      </div>

      <div className="connect-list">
        {contacts.map((contact) => (
          <div className="contact-card" key={contact.name}>
            <div className={`contact-avatar ${contact.color}`}>
              {contact.initials}
            </div>
            <div className="contact-details">
              <strong>{contact.name}</strong>
              <span>
                <i className="online-dot" />
                {contact.relation}
              </span>
            </div>
            <button
              className="icon-action"
              aria-label={`Call ${contact.name}`}
              onClick={() => onStartCall(contact.name, contact.relation)}
            >
              <Phone />
            </button>
            <button
              className="icon-action message-action"
              aria-label={`Message ${contact.name}`}
              onClick={() =>
                setLastResponse(
                  `Prepared a gentle check-in message for ${contact.name}: "Thinking of you, hope you're having a nice day!"`
                )
              }
            >
              <MessageCircle />
            </button>
          </div>
        ))}
      </div>

      <div className="connect-note">
        <HeartPulse />
        <span>
          <strong>Connection is medicine.</strong> A short voice chat with family warms the spirit and brightens any afternoon.
        </span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Reports View with Interactive Period Selection
   ───────────────────────────────────────────────────────────── */
function ReportsView() {
  const [period, setPeriod] = useState<'This week' | 'This month' | 'Last 3 months'>('This week')

  const reportData = useMemo(() => {
    if (period === 'This month') {
      return {
        wellbeing: 'Excellent',
        wellbeingDelta: 'Up 18% from last month',
        activeDays: '23 of 30',
        activeNote: 'Great consistency!',
        connections: '28',
        bars: ['60%', '75%', '85%', '92%', '80%', '70%', '88%'],
      }
    }
    if (period === 'Last 3 months') {
      return {
        wellbeing: 'Steady',
        wellbeingDelta: 'Consistent health record',
        activeDays: '68 of 90',
        activeNote: 'Wonderful stamina',
        connections: '76',
        bars: ['70%', '80%', '65%', '78%', '85%', '90%', '95%'],
      }
    }
    return {
      wellbeing: 'Good',
      wellbeingDelta: 'Up 12% from last week',
      activeDays: '5 of 7',
      activeNote: 'Keep going!',
      connections: '8',
      bars: ['42%', '65%', '50%', '78%', '90%', '70%', '55%'],
    }
  }, [period])

  return (
    <div className="page-view">
      <div className="section-intro">
        <div>
          <p className="eyebrow">Your Health Journey</p>
          <h2>Wellbeing reports</h2>
          <p>Every step, meal, and moment of rest helps you stay vibrant.</p>
        </div>
        <label className="period-select">
          <CalendarDays />
          <span className="sr-only">Report period</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            aria-label="Report period"
          >
            <option>This week</option>
            <option>This month</option>
            <option>Last 3 months</option>
          </select>
        </label>
      </div>

      <div className="report-summary">
        <div>
          <span>Overall wellbeing</span>
          <strong>{reportData.wellbeing}</strong>
          <small>{reportData.wellbeingDelta}</small>
        </div>
        <div>
          <span>Active days</span>
          <strong>{reportData.activeDays}</strong>
          <small>{reportData.activeNote}</small>
        </div>
        <div>
          <span>Family connections</span>
          <strong>{reportData.connections}</strong>
          <small>Cherished moments</small>
        </div>
      </div>

      <div className="chart-card">
        <div className="card-heading">
          <h3>Daily activity trend</h3>
          <span>Minutes active per day ({period})</span>
        </div>
        <div className="fake-chart" aria-label="Activity trend chart">
          <div className="chart-bars">
            {reportData.bars.map((height, idx) => (
              <i key={idx} style={{ height }} title={`${height} activity`} />
            ))}
          </div>
          <div className="chart-labels">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Settings View with Trilingual Picker & Voice Preview
   ───────────────────────────────────────────────────────────── */
function SettingsView({
  language,
  onLanguageChange,
  fontSize,
  setFontSize,
  notifications,
  setNotifications,
  voicePreference,
  setVoicePreference,
  onPreviewVoice,
}: {
  language: SupportedLanguage
  onLanguageChange: (lang: SupportedLanguage) => void
  fontSize: 'Comfortable' | 'Large' | 'Extra Large'
  setFontSize: (value: 'Comfortable' | 'Large' | 'Extra Large') => void
  notifications: boolean
  setNotifications: (value: boolean) => void
  voicePreference: string
  setVoicePreference: (value: string) => void
  onPreviewVoice: () => void
}) {
  return (
    <div className="page-view">
      <div className="section-intro">
        <div>
          <p className="eyebrow">Personal Preferences</p>
          <h2>Settings</h2>
          <p>Customize VRAAYU so it feels completely comfortable and easy to use.</p>
        </div>
      </div>

      <div className="settings-list">
        {/* Language Selection Row */}
        <label className="setting-row">
          <span className="setting-icon">
            <Globe2 />
          </span>
          <span>
            <strong>Primary language / भाषा</strong>
            <small>Choose English, हिंदी (Hindi), or मराठी (Marathi)</small>
          </span>
          <select
            value={language}
            onChange={(event) => onLanguageChange(event.target.value as SupportedLanguage)}
            aria-label="Language selection"
          >
            <option value="en">English (India)</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
          </select>
        </label>

        {/* Text Size */}
        <label className="setting-row">
          <span className="setting-icon">
            <Sparkles />
          </span>
          <span>
            <strong>Display text size</strong>
            <small>Choose the text size that feels easiest on your eyes</small>
          </span>
          <select
            value={fontSize}
            onChange={(event) => setFontSize(event.target.value as any)}
          >
            <option>Comfortable</option>
            <option>Large</option>
            <option>Extra Large</option>
          </select>
        </label>

        {/* Reminders Toggle */}
        <label className="setting-row">
          <span className="setting-icon">
            <Bell />
          </span>
          <span>
            <strong>Gentle reminders</strong>
            <small>Spoken notifications for medicine, walks, and hydration</small>
          </span>
          <button
            className={`toggle ${notifications ? 'on' : ''}`}
            role="switch"
            aria-checked={notifications}
            onClick={() => setNotifications(!notifications)}
          >
            <span />
          </button>
        </label>

        {/* Voice Selection */}
        <label className="setting-row">
          <span className="setting-icon">
            <Volume2 />
          </span>
          <span>
            <strong>Voice selection</strong>
            <small>Select the natural speaking voice for VRAAYU</small>
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              value={voicePreference}
              onChange={(event) => setVoicePreference(event.target.value)}
              aria-label="Voice preference"
            >
              <option>Auto</option>
              <option>David</option>
              <option>Zira</option>
            </select>
            <button
              type="button"
              className="setting-action-btn"
              onClick={onPreviewVoice}
            >
              <Volume2 size={15} /> Test Voice
            </button>
          </div>
        </label>

        {/* Privacy & Security */}
        <div className="setting-row">
          <span className="setting-icon">
            <ShieldCheck />
          </span>
          <span>
            <strong>Privacy &amp; data security</strong>
            <small>Your conversations and medical details remain encrypted and private</small>
          </span>
          <ChevronRight />
        </div>
      </div>

      <div className="settings-footer">
        <Moon /> VRAAYU — Designed with love and care for every generation.
      </div>
    </div>
  )
}
