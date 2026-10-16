# VRAAYU (वायु) — Always With You 🌿

> **Voice-First AI Elderly Medical & Wellbeing Assistance Platform**  
> *Empowering older adults with compassionate voice companionship, medication tracking, senior symptom care, and instant family connection in English, Hindi (हिंदी), and Marathi (मराठी).*

---

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.3.3-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?style=for-the-badge&logo=tailwind-css)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.8_Flash-8E75B2?style=for-the-badge&logo=google)
![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-v7.0-000000?style=for-the-badge&logo=vercel)
![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20%E0%A4%B9%E0%A4%BF%E0%A4%82%E0%A4%A6%E0%A4%BF%20%7C%20%E0%A4%AE%E0%A4%B0%E0%A4%BE%E0%A4%A0%E0%A4%BF-orange?style=for-the-badge)

</div>

---

## 🌟 Vision & Executive Summary

Over **1 billion older adults** worldwide face daily challenges with medication adherence, cognitive isolation, mobility limitations, and complex digital interfaces. Many seniors struggle with small touch screens, complex menus, or language barriers.

**VRAAYU** (*derived from the Sanskrit word for the life-giving breath, वायु*) solves this crisis with a **warm, voice-first companion** designed from the ground up for older adults:

1. **Voice-First & Zero Friction**: No typing or complex navigation required — seniors can simply talk naturally to the interactive animated breathing orb.
2. **Specialized Senior Medical Supporter**: Helps elders track blood pressure and daily medicines, provides comforting first-aid and lifestyle advice (joint stiffness, dizziness, hydration), and triggers instant emergency escalation when needed.
3. **Trilingual Mother Tongue Intelligence**: Full native voice interaction in **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)**.
4. **1-Tap Family & Care Team Connection**: Simulated video/voice calling connecting parents to their children (Ananya & Rohan) and 24/7 care desks.
5. **Accessibility-Centric UI**: Dynamic text sizing (`Comfortable`, `Large`, `Extra Large`), high-contrast palettes, warm soothing aesthetics, and fluid micro-animations.

---

## 🏗️ System Architecture & Data Flow

### 1. Overall System Architecture

```mermaid
flowchart TB
    subgraph Client ["Client Device (Desktop / Tablet / Mobile)"]
        UI["VRAAYU Voice Interface & Dashboard"]
        STT["Web Speech Recognition (en-IN / hi-IN / mr-IN)"]
        TTS["Speech Synthesis Engine (Paced at 0.88x)"]
        Orb["Dynamic Animated Voice Orb"]
        Router["In-App Voice Action Router"]
    end

    subgraph AppRouter ["Next.js 16 App Router (Server-Side)"]
        API["/api/gemini Route Handler"]
        Intent["Multilingual Intent Classifier"]
        Safety["Senior Medical Safety Guardrails"]
    end

    subgraph LLMLayer ["AI & Intelligence Tier"]
        Gemini["Google Gemini 3.8 Flash (via @ai-sdk/google)"]
        LocalEngine["Local Multilingual Medical Companion Engine (Fallback)"]
    end

    UI -->|"Spoken Audio"| STT
    STT -->|"Live Interim Transcript"| UI
    STT -->|"Final User Speech"| API
    UI -->|"Text Input / Quick Chips"| API

    API --> Intent
    Intent --> Safety
    Safety -->|"Active API Key"| Gemini
    Safety -->|"Offline / Quota / Fallback"| LocalEngine

    Gemini -->|"Structured Response & Actions"| API
    LocalEngine -->|"Structured Response & Actions"| API

    API -->|"JSON { reply, action, suggestedReplies, lang }"| Router
    Router -->|"Navigate / Emergency / Call"| UI
    Router -->|"Spoken Response"| TTS
    TTS -->|"Soundwave Feedback"| Orb
```

---

### 2. Multilingual Voice-to-Action Loop

```mermaid
sequenceDiagram
    autonumber
    actor Elder as Older Adult
    participant Orb as Animated Voice Orb
    participant STT as Web Speech API (STT)
    participant API as VRAAYU API (/api/gemini)
    participant Engine as Gemini 3.8 / Medical Engine
    participant App as App Controller
    participant TTS as Voice Synthesis (TTS)

    Elder->>Orb: Taps Orb or Speaks ("मेरी दवाई कब है?")
    Orb->>Orb: Switches to Active Listening Wave
    STT->>Elder: Displays live interim speech feedback
    STT->>API: Transmits transcript + Language ('hi')
    Orb->>Orb: Shifts to Thinking Shimmer
    API->>Engine: Evaluates Medical Context & Intent
    Engine-->>API: Returns Spoken Care Reply + Action (NAVIGATE: Healthcare)
    API-->>App: Dispatches Response Payload
    App->>App: Auto-navigates to Healthcare view
    App->>TTS: Queues speech synthesis in Hindi
    Orb->>Orb: Harmonic Speaking Wave + Soundbar Equalizer
    TTS-->>Elder: Speaks: "आपकी ब्लड प्रेशर की गोली रात 8:00 बजे है..."
    App-->>Elder: Displays "Listen Again" & Follow-up Prompt Chips
```

---

### 3. Senior Medical Triage & Emergency Escalation

```mermaid
flowchart TD
    Query["Incoming Elder Query"]
    CheckEmergency{"Emergency or Acute Distress?<br>(Chest pain, Fall, Severe breathlessness)"}
    CheckMed{"Medication Inquiry?<br>(BP tablet, Calcium, Dosage timing)"}
    CheckSymptom{"Common Elder Discomfort?<br>(Knee pain, Joint stiffness, Dizziness)"}
    General{"General Wellness / Family Connect"}

    Query --> CheckEmergency
    CheckEmergency -- Yes --> Escalate["🚨 Immediate Escalation: Open Emergency Modal + Notify Contacts + Calming Reassurance"]
    CheckEmergency -- No --> CheckMed

    CheckMed -- Yes --> MedCare["💊 Medication Tracker: State dosage timing + Remind water + Mark as Taken"]
    CheckMed -- No --> CheckSymptom

    CheckSymptom -- Yes --> SymptomGuide["🩺 Non-Diagnostic Senior First-Aid: Warm compress, posture, gentle rest + Recommend Doctor"]
    CheckSymptom -- No --> General

    General --> WellnessPlan["🌿 Empathetic Companionship: Daily overview, family check-in, or soothing breathing exercise"]
```

---

## 🛠️ Complete Tech Stack

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | **Next.js** | `16.3.3` | React production framework with App Router & server endpoints |
| **Core Library** | **React** | `19.0.0` | Concurrent UI library with hooks, transitions, and state management |
| **Language** | **TypeScript** | `5.7.3` | Strict static typing, robust interfaces, 0 compilation errors |
| **Styling** | **Tailwind CSS** | `v4.3.3` | Utility-first responsive styling with `@tailwindcss/postcss` |
| **Animation** | **CSS3 Keyframes** | Native | Fluid acoustic ripples, organic breathing orb, and modal pops |
| **LLM & AI** | **Google Gemini** | `3.8 Flash` | State-of-the-art multilingual LLM for empathetic elder conversations |
| **AI SDK** | **Vercel AI SDK** | `7.0.97` | Model orchestration, conversational streaming, prompt engineering |
| **Provider** | **@ai-sdk/google**| `4.0.67` | Official Google Generative AI connector via `createGoogleGenerativeAI` |
| **Icons** | **Lucide React** | `1.16.0` | Accessible, clean iconography for elderly readability |
| **Speech STT** | **Web Speech API** | Native | Browser-native speech recognition (`en-IN`, `hi-IN`, `mr-IN`) |
| **Speech TTS** | **SpeechSynthesis**| Native | Browser-native natural vocalization tuned at comfortable elderly pacing |

---

## ✨ Key Features & Capabilities

### 1. 🎙️ Alive, Organic Animated Voice Orb
- **Idle Breathing State (`vraayu-breathe`)**: Gently expands and contracts (scale 1.0 to 1.025) with a soft golden aura, signaling warmth and presence.
- **Active Listening Wave (`vraayu-listen-pulse`)**: Concentric acoustic rings expand outward when the microphone is engaged.
- **Thinking Shimmer (`vraayu-thinking-pulse`)**: Subtle purple-golden shimmer while generating AI answers.
- **Harmonic Speaking Glow (`vraayu-speaking-glow`)**: Calming green/gold aura accompanied by a dynamic 5-bar soundwave equalizer.

### 2. 🩺 Senior Medical Help Supporter
- **Timely Medication Logging**: Track evening Blood Pressure medication (Amlodipine 5mg at 8:00 PM) with an interactive "Mark as Taken" button.
- **Elder Symptom & First-Aid Guidance**: Empathetic, safe recommendations for knee/joint stiffness (warm compress, leg elevation), sudden dizziness (hydration, electrolyte water, slow posture changes), and fatigue.
- **Medical Safety Protocol**: Strict non-diagnostic guardrails that urge consultation with Dr. Priya Sharma and immediate alert dispatch for red-flag symptoms.

### 3. 🌐 Trilingual Mother Tongue Support
- Instant segmented language toggle in the top bar: **English (EN)**, **हिंदी (Hindi)**, and **मराठी (Marathi)**.
- Full adaptation of speech recognition (`en-IN`, `hi-IN`, `mr-IN`), speech synthesis, suggested prompt pills, and assistant greetings.
- Dual-tier intelligence: Gemini 3.8 Flash + Deep localized fallback engine so the assistant never goes offline or repeats robotic phrases.

### 4. 📞 Live Connect & Simulated Calling
- Reconnect with children **Ananya Mehta** (daughter) and **Rohan Mehta** (son) with 1 tap.
- Interactive in-call dialog with pulsing avatar rings, call duration timer, audio equalizer, mute/speaker controls, and red hang-up button.

### 5. 📊 Interactive Wellbeing Reports
- Filter reports across **This week**, **This month**, and **Last 3 months**.
- Dynamic calculation of active days, wellness scores (92/100), family connections, and animated CSS activity bars.

### 6. ♿ Universal Senior Accessibility
- 3 font scaling modes: **Comfortable**, **Large**, and **Extra Large**.
- Focus rings, high-contrast text, clear touch targets (min 48px), and mobile drawer backdrop dismissal.

---

## 📂 Project Structure

```
VRAAYU-Voice-First-AI-Elderly-Assistance-Platform/
├── app/
│   ├── api/
│   │   └── gemini/
│   │       └── route.ts          # Gemini 3.8 Flash & Multilingual Medical Engine
│   ├── globals.css               # Fluid keyframes, orb waves, responsive typography
│   ├── layout.tsx                # HTML root, viewport metadata, analytics
│   └── page.tsx                  # Interactive single-page elderly application
├── components/
│   ├── ui/
│   │   └── button.tsx            # Accessible Base UI button primitive
│   └── components.json           # shadcn configuration
├── lib/
│   └── utils.ts                  # Classname merging utility (clsx + tailwind-merge)
├── public/                       # Favicons, Apple icons, brand SVG assets
├── .env.example                  # Environment configuration template
├── next.config.mjs               # Next.js configuration with strict TypeScript checks
├── package.json                  # Dependencies & scripts (--webpack configured)
├── tsconfig.json                 # TypeScript compiler configuration
└── README.md                     # Project documentation & presentation guide
```

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- Node.js `18.x` or later (tested up to `v24.x`)
- npm, pnpm, or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/Ummehaniburhanpurwala/VRAAYU-Voice-First-AI-Elderly-Assistance-Platform.git
cd VRAAYU-Voice-First-AI-Elderly-Assistance-Platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Optional: Add your Google Gemini API key for live LLM responses.
# If omitted or offline, VRAAYU's built-in Medical Companion Engine handles all queries seamlessly!
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to experience VRAAYU.

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 🎯 Hackathon & Presentation Highlights

When demonstrating VRAAYU to judges or stakeholders:

1. **The Voice Experience**: Tap the glowing orb and say *"When should I take my blood pressure medicine?"* Notice the smooth animation transition from breathing to ripple to harmonic speaking glow.
2. **Mother Tongue Switch**: Switch to **हिंदी** or **मराठी**. Say *"मेरी बीपी की गोली कब लेनी है?"* or *"माझ्या गुडघेदुखीवर काही उपाय सांगा"*. Notice the cultural warmth and accurate medical lifestyle tips.
3. **Voice Intent Automation**: Say *"I need emergency help!"* or *"Call my daughter Ananya"*. Watch VRAAYU speak comfort while automatically opening the emergency protocol or initiating the simulated phone call.
4. **Interactive Medication Checklist**: Navigate to **Healthcare** or **Dashboard** and toggle the 8:00 PM medication. The wellness counter updates with an encouraging green checkmark.
5. **Universal Accessibility**: Open **Settings** and switch font size to **Large** or **Extra Large** to demonstrate senior-friendly visual hierarchy.

---

## 🔒 Safety, Privacy & Ethical Guardrails

- **Zero Medical Misdiagnosis**: VRAAYU strictly adheres to elder support principles — offering reminders, hydration nudges, and non-invasive comfort while always directing users to certified physicians for prescriptions or clinical diagnoses.
- **Client-Side Privacy**: Speech recognition is conducted through standard browser APIs; no audio recordings are permanently stored or sold.
- **Emergency First**: Any indication of acute trauma (falls, chest pain) triggers immediate emergency triage modal with 1-tap contact dialing.

---

## 📄 License & Acknowledgments

- **Author**: Ummehani Burhanpurwala
- **Built for**: Advanced Elderly Care, Compassionate AI, and Voice-First Accessibility
- **License**: MIT License — open for community wellbeing initiatives.

<div align="center">
  <br />
  <strong>VRAAYU — A Safer, Kinder, Brighter Tomorrow ♡</strong>
</div>
