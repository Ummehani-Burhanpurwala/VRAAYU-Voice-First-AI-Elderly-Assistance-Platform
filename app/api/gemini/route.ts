import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export type SupportedLanguage = 'en' | 'hi' | 'mr'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AssistantAction {
  type: 'NAVIGATE' | 'EMERGENCY' | 'CALL_CONTACT' | 'TAKE_MEDICINE' | 'ADJUST_FONT'
  payload?: any
}

interface AssistantResponse {
  reply: string
  action?: AssistantAction
  suggestedReplies?: string[]
  source: 'gemini' | 'engine'
  language: SupportedLanguage
}

function getSystemInstruction(lang: SupportedLanguage): string {
  const langDirectives = {
    en: 'Respond in clear, gentle, reassuring English.',
    hi: 'Respond in pure, respectful, conversational Hindi (हिंदी) using respectful pronouns like "आप". Keep language comforting and easy for Indian elders to understand.',
    mr: 'Respond in polite, warm, conversational Marathi (मराठी) using respectful terms like "तुम्ही". Keep language caring, clear, and reassuring for Maharashtrian elders.',
  }

  return `You are VRAAYU, an empathetic Medical Help Supporter and Wellbeing Companion specially designed for elderly people (seniors/grandparents).
Your voice is gentle, respectful, comforting, and crystal-clear.

ROLE & MEDICAL ASSISTANCE FOCUS:
1. Medication & Schedule Support: Remind elders about timely medication (e.g. Blood Pressure Amlodipine at 8 PM), taking tablets with water/food, and maintaining hydration.
2. Elderly Symptom Guidance & Gentle Relief: For common elder discomforts (knee/joint stiffness, mild fatigue, eye strain, dizziness, digestive heaviness), provide safe, gentle lifestyle advice (warm water, resting, gentle leg elevation, deep breathing, posture).
3. Critical Safety Protocol: NEVER diagnose diseases, prescribe new drugs, or alter doctor dosages. If symptoms suggest emergencies (chest pain, severe fall, sudden breathlessness, confusion), urge immediate calm and tell them you are alerting their emergency contact/doctor.
4. Emotional & Mental Warmth: Treat the user with utmost respect, warmth, and patience like a devoted grandchild or trusted home caregiver.
5. Language & Brevity: Keep replies under 50 words. Speak directly.
${langDirectives[lang]}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    const history: ChatMessage[] = Array.isArray(body?.history) ? body.history : []
    const language: SupportedLanguage = ['en', 'hi', 'mr'].includes(body?.language)
      ? body.language
      : detectLanguage(message)

    if (!message) {
      return NextResponse.json({ error: 'Please provide a message.' }, { status: 400 })
    }

    const detectedAction = analyzeIntent(message)
    const apiKey = process.env.GEMINI_API_KEY

    // If API key is present, attempt Gemini 3.8 Flash with @ai-sdk/google
    if (apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.length > 20) {
      try {
        const google = createGoogleGenerativeAI({ apiKey })
        const model = google('gemini-3.8-flash')

        const conversationPrompt =
          history.length > 0
            ? `${history
                .slice(-4)
                .map((m) => `${m.role === 'user' ? 'Elder' : 'VRAAYU'}: ${m.content}`)
                .join('\n')}\nElder (${language}): ${message}\nVRAAYU:`
            : `User query (${language}): ${message}`

        const result = await generateText({
          model,
          system: getSystemInstruction(language),
          prompt: conversationPrompt,
          maxOutputTokens: 140,
          temperature: 0.65,
        })

        if (result?.text?.trim()) {
          const suggestions = generateSuggestedReplies(message, language)
          const responsePayload: AssistantResponse = {
            reply: cleanReply(result.text),
            action: detectedAction,
            suggestedReplies: suggestions,
            source: 'gemini',
            language,
          }
          return NextResponse.json(responsePayload)
        }
      } catch (geminiError: any) {
        console.warn(
          'Gemini live API unavailable or restricted, utilizing medical companion engine:',
          geminiError?.message || geminiError
        )
      }
    }

    // High-resilience, multilingual Medical Companion Fallback Engine
    const engineResponse = runMedicalCompanionEngine(message, language, detectedAction)
    return NextResponse.json(engineResponse)
  } catch (error) {
    console.error('API Error in /api/gemini:', error)
    return NextResponse.json({
      reply:
        'I am always right beside you. Take a gentle breath. How can I assist with your health or medicines today?',
      suggestedReplies: ['My medicines', 'Call family', 'Emergency help'],
      source: 'engine',
      language: 'en',
    })
  }
}

function cleanReply(text: string): string {
  return text
    .replace(/^VRAAYU:\s*/i, '')
    .replace(/\*\*/g, '')
    .trim()
}

function detectLanguage(query: string): SupportedLanguage {
  // Check for Devanagari script characters
  const devanagariRegex = /[\u0900-\u097F]/
  if (devanagariRegex.test(query)) {
    // Distinguish Marathi vs Hindi by common Marathi markers
    const marathiWords = ['आहे', 'नाही', 'कधी', 'कसे', 'माझं', 'माझ्या', 'मुलीला', 'मुलाला', 'औषध', 'सांगा', 'करा', 'घ्या', 'होतंय', 'दुखतंय', 'हवं', 'नमस्कार']
    const hasMarathi = marathiWords.some(w => query.includes(w))
    return hasMarathi ? 'mr' : 'hi'
  }
  return 'en'
}

function analyzeIntent(query: string): AssistantAction | undefined {
  const q = query.toLowerCase()

  // Emergency / Distress (English, Hindi, Marathi, Hinglish)
  if (
    q.includes('emergency') ||
    q.includes('help me') ||
    q.includes('i fell') ||
    q.includes('ambulance') ||
    q.includes('chest pain') ||
    q.includes('मदद') ||
    q.includes('आपातकाल') ||
    q.includes('मदत') ||
    q.includes('छातीत दुखत') ||
    q.includes('छाती में दर्द') ||
    q.includes('chhati me dard') ||
    q.includes('madad') ||
    q.includes('madat')
  ) {
    return { type: 'EMERGENCY' }
  }

  // Call daughter Ananya
  if (
    q.includes('daughter') ||
    q.includes('ananya') ||
    q.includes('बेटी') ||
    q.includes('अनन्या') ||
    q.includes('मुलगी') ||
    q.includes('मुलीला') ||
    q.includes('beti')
  ) {
    return { type: 'CALL_CONTACT', payload: { name: 'Ananya Mehta', relation: 'Daughter' } }
  }

  // Call son Rohan
  if (
    q.includes('son') ||
    q.includes('rohan') ||
    q.includes('बेटा') ||
    q.includes('रोहन') ||
    q.includes('मुलगा') ||
    q.includes('मुलाला') ||
    q.includes('beta')
  ) {
    return { type: 'CALL_CONTACT', payload: { name: 'Rohan Mehta', relation: 'Son' } }
  }

  // General Family & Live Connect
  if (
    q.includes('family') ||
    q.includes('video call') ||
    q.includes('connect') ||
    q.includes('परिवार') ||
    q.includes('घरवाले') ||
    q.includes('कुटुंब')
  ) {
    return { type: 'NAVIGATE', payload: 'Live Connect' }
  }

  // Healthcare, Medicines & Doctor Appointments
  if (
    q.includes('medicine') ||
    q.includes('pill') ||
    q.includes('doctor') ||
    q.includes('appointment') ||
    q.includes('blood pressure') ||
    q.includes('sugar') ||
    q.includes('tablet') ||
    q.includes('दवाई') ||
    q.includes('डॉक्टर') ||
    q.includes('गोली') ||
    q.includes('औषध') ||
    q.includes('दवा') ||
    q.includes('रक्तदाब')
  ) {
    return { type: 'NAVIGATE', payload: 'Healthcare' }
  }

  // Reports & Wellbeing
  if (
    q.includes('report') ||
    q.includes('progress') ||
    q.includes('score') ||
    q.includes('रिपोर्ट') ||
    q.includes('प्रगती')
  ) {
    return { type: 'NAVIGATE', payload: 'Reports' }
  }

  // Dashboard & Schedule
  if (
    q.includes('schedule') ||
    q.includes('routine') ||
    q.includes('overview') ||
    q.includes('रूटीन') ||
    q.includes('दिनक्रम') ||
    q.includes('नियम')
  ) {
    return { type: 'NAVIGATE', payload: 'Dashboard' }
  }

  // Accessibility Font Sizing
  if (
    q.includes('bigger text') ||
    q.includes('large text') ||
    q.includes('बड़ा फॉन्ट') ||
    q.includes('फॉन्ट मोठा करा')
  ) {
    return { type: 'ADJUST_FONT', payload: 'Large' }
  }

  return undefined
}

function generateSuggestedReplies(query: string, lang: SupportedLanguage): string[] {
  const q = query.toLowerCase()

  if (lang === 'hi') {
    if (q.includes('दवा') || q.includes('गोली') || q.includes('दवाई')) {
      return ['बीपी की गोली का समय', 'डॉक्टर से अपॉइंटमेंट', 'स्वास्थ्य टिप्स']
    }
    if (q.includes('दर्द') || q.includes('घुटने') || q.includes('थकान')) {
      return ['घुटनों के दर्द का उपाय', 'गर्म पानी की सिकाई', 'डॉक्टर को दिखाएँ']
    }
    return ['मेरी दवाई का समय?', 'बेटी अनन्या को फोन करो', 'आज का रूटीन बताओ']
  }

  if (lang === 'mr') {
    if (q.includes('औषध') || q.includes('गोळी') || q.includes('बीपी')) {
      return ['रक्तदाबाच्या गोळीची वेळ', 'डॉक्टरांची भेट', 'आरोग्य सल्ला']
    }
    if (q.includes('दुख') || q.includes('गुडघे') || q.includes('थकवा')) {
      return ['गुडघेदुखीवर सोपे उपाय', 'गरम पाण्याचा शेक', 'डॉक्टरांशी संपर्क']
    }
    return ['औषधांची वेळ सांगा', 'अनन्याला कॉल करा', 'माझा दिनक्रम सांगा']
  }

  // English
  if (q.includes('medicine') || q.includes('pill') || q.includes('bp')) {
    return ['When is my 8 PM pill?', 'Upcoming doctor visit', 'Daily care tips']
  }
  if (q.includes('pain') || q.includes('knee') || q.includes('dizzy')) {
    return ['Gentle knee care tips', 'Hydration advice', 'Call doctor']
  }
  return ["What's my medicine schedule?", 'Call daughter Ananya', "Today's daily routine"]
}

/* ─────────────────────────────────────────────────────────────
   Comprehensive Multilingual Medical Elderly Supporter Engine
   Supports English, Hindi, and Marathi
   ───────────────────────────────────────────────────────────── */
function runMedicalCompanionEngine(
  query: string,
  lang: SupportedLanguage,
  action?: AssistantAction
): AssistantResponse {
  const q = query.toLowerCase().trim()

  // 1. EMERGENCY & SEVERE DISTRESS
  if (
    action?.type === 'EMERGENCY' ||
    q.includes('emergency') ||
    q.includes('help') ||
    q.includes('fell') ||
    q.includes('chest pain') ||
    q.includes('मदद') ||
    q.includes('आपातकाल') ||
    q.includes('मदत') ||
    q.includes('छातीत')
  ) {
    if (lang === 'hi') {
      return {
        reply:
          'कृपया शांत रहें, घबराएं नहीं। मैंने आपातकालीन स्क्रीन तुरंत खोल दी है। आपके परिवार और डॉक्टर को सूचित करने का बटन तैयार है। आप पूरी तरह सुरक्षित हैं।',
        action: { type: 'EMERGENCY' },
        suggestedReplies: ['मदद के लिए कॉल करें', 'मैं ठीक हूँ', 'डॉक्टर से बात कराओ'],
        source: 'engine',
        language: 'hi',
      }
    }
    if (lang === 'mr') {
      return {
        reply:
          'कृपया शांत राहा, मुळीच घाबरू नका. मी तातडीने आपत्कालीन स्क्रीन उघडली आहे. तुमच्या कुटुंबियांना आणि डॉक्टरना संपर्क करण्याचे बटण तयार आहे. मी सोबत आहे.',
        action: { type: 'EMERGENCY' },
        suggestedReplies: ['मदतीसाठी कॉल करा', 'मी आता बरा आहे', 'डॉक्टरांशी संपर्क'],
        source: 'engine',
        language: 'mr',
      }
    }
    return {
      reply:
        'Please stay calm, take slow deep breaths. I have opened your Emergency screen right now. Help is right here and your emergency contacts can be dialed with one tap.',
      action: { type: 'EMERGENCY' },
      suggestedReplies: ['Call emergency contact', 'I am okay now', 'Call doctor'],
      source: 'engine',
      language: 'en',
    }
  }

  // 2. MEDICATIONS & DOSAGE TIMINGS (Blood Pressure, Calcium, Heart)
  if (
    q.includes('medicine') ||
    q.includes('pill') ||
    q.includes('tablet') ||
    q.includes('blood pressure') ||
    q.includes('bp') ||
    q.includes('amlodipine') ||
    q.includes('दवाई') ||
    q.includes('गोली') ||
    q.includes('दवा') ||
    q.includes('औषध') ||
    q.includes('गोळी') ||
    q.includes('रक्तदाब')
  ) {
    if (lang === 'hi') {
      return {
        reply:
          'आपकी शाम की ब्लड प्रेशर की गोली (Amlodipine 5mg) रात 8:00 बजे निर्धारित है। गोली लेने से 10 मिनट पहले एक गिलास गुनगुना पानी ज़रूर पिएं।',
        action: { type: 'NAVIGATE', payload: 'Healthcare' },
        suggestedReplies: ['दवाई ले ली है मार्क करें', 'डॉक्टर अपॉइंटमेंट', 'पानी पीने का ध्यान रखें'],
        source: 'engine',
        language: 'hi',
      }
    }
    if (lang === 'mr') {
      return {
        reply:
          'तुमची संध्याकाळची रक्तदाबाची गोळी (Amlodipine 5mg) रात्री 8:00 वाजता घ्यायची आहे. गोळी घेण्यापूर्वी कोमट पाणी प्यायला विसरू नका.',
        action: { type: 'NAVIGATE', payload: 'Healthcare' },
        suggestedReplies: ['औषध घेतले म्हणून नोंद करा', 'डॉक्टरांची भेट', 'आरोग्य सल्ला'],
        source: 'engine',
        language: 'mr',
      }
    }
    return {
      reply:
        'Here is your medication plan: your evening Blood Pressure tablet (Amlodipine 5mg) is scheduled for 8:00 PM. Remember to have a glass of water with it!',
      action: { type: 'NAVIGATE', payload: 'Healthcare' },
      suggestedReplies: ['Mark medicine taken', 'Upcoming doctor visit', 'Care tips'],
      source: 'engine',
      language: 'en',
    }
  }

  // 3. COMMON ELDER SYMPTOMS: KNEE PAIN, JOINT PAIN, ARTHRITIS
  if (
    q.includes('knee') ||
    q.includes('joint') ||
    q.includes('arthritis') ||
    q.includes('legs hurt') ||
    q.includes('walking pain') ||
    q.includes('घुटने') ||
    q.includes('जोड़ों') ||
    q.includes('दर्द') ||
    q.includes('पैर दर्द') ||
    q.includes('गुडघे') ||
    q.includes('सांधेदुखी') ||
    q.includes('पाय दुखतात')
  ) {
    if (lang === 'hi') {
      return {
        reply:
          'घुटनों के दर्द के लिए कृपया आराम से बैठें। थोड़ी देर गर्म सिकाई करें और पैरों को हल्का सहारा दें। तेज चलने से बचें और अगर दर्द बढ़े तो डॉक्टर प्रिया शर्मा से परामर्श लें।',
        suggestedReplies: ['गर्म सिकाई कैसे करें?', 'डॉक्टर से बात करें', 'दवाई का समय'],
        source: 'engine',
        language: 'hi',
      }
    }
    if (lang === 'mr') {
      return {
        reply:
          'गुडघेदुखीसाठी कृपया थोडा वेळ आराम करा. गरम पाण्याच्या पिशवीने हलका शेक घ्या आणि पाय वर ठेवून बसा. जास्त ताण देऊ नका, त्रास वाढल्यास डॉक्टरांशी संपर्क साधा.',
        suggestedReplies: ['शेक कसा घ्यावा?', 'डॉक्टरांना कॉल करा', 'औषध घेतले का?'],
        source: 'engine',
        language: 'mr',
      }
    }
    return {
      reply:
        'For knee or joint stiffness, rest comfortably with your legs gently supported. A warm compress for 10 minutes can soothe circulation. Avoid stairs today, and consult Dr. Priya if pain persists.',
      suggestedReplies: ['Warm compress tips', 'Doctor appointment', 'Gentle stretches'],
      source: 'engine',
      language: 'en',
    }
  }

  // 4. DIZZINESS, FATIGUE, WEAKNESS OR BLOOD SUGAR
  if (
    q.includes('dizzy') ||
    q.includes('weak') ||
    q.includes('tired') ||
    q.includes('sugar') ||
    q.includes('ch चक्कर') ||
    q.includes('चक्कर') ||
    q.includes('कमजोरी') ||
    q.includes('थकान') ||
    q.includes('थकवा') ||
    q.includes('गळून') ||
    q.includes('अशक्तपणा')
  ) {
    if (lang === 'hi') {
      return {
        reply:
          'कृपया तुरंत आराम से बैठ जाएं या लेट जाएं। एक गिलास पानी में चुटकी भर नमक और चीनी या ओआरएस घोलकर पिएं। अचानक खड़े होने से बचें।',
        suggestedReplies: ['पानी पी लिया है', 'बेटी को कॉल करो', 'डॉक्टर से संपर्क'],
        source: 'engine',
        language: 'hi',
      }
    }
    if (lang === 'mr') {
      return {
        reply:
          'कृपया लगेच शांतपणे बसा किंवा झोपा. एक ग्लास पाण्यात थोडं मीठ आणि साखर घालून हळूहळू प्या. एकदम पटकन उठू नका. आराम करा.',
        suggestedReplies: ['पाणी प्यायलो', 'मुलीला कॉल करा', 'डॉक्टरांची मदत'],
        source: 'engine',
        language: 'mr',
      }
    }
    return {
      reply:
        'Please sit down safely right away to prevent falls. Sip a glass of water with a pinch of electrolytes or light sugar. Rest quietly with eyes closed for 10 minutes.',
      suggestedReplies: ['Resting now', 'Call Ananya', 'Check blood pressure'],
      source: 'engine',
      language: 'en',
    }
  }

  // 5. DOCTOR APPOINTMENTS & HEALTH CHECKUPS
  if (
    q.includes('doctor') ||
    q.includes('appointment') ||
    q.includes('priya') ||
    q.includes('डॉक्टर') ||
    q.includes('अपॉइंटमेंट') ||
    q.includes('तपासणी') ||
    q.includes('भेट')
  ) {
    if (lang === 'hi') {
      return {
        reply:
          'आपकी डॉक्टर प्रिया शर्मा के साथ वीडियो कंसल्टेशन इस शुक्रवार 18 सितंबर को सुबह 10:30 बजे है। VRAAYU पर वीडियो कॉल की तैयारी पूरी है।',
        action: { type: 'NAVIGATE', payload: 'Healthcare' },
        suggestedReplies: ['दवाई की सूची देखें', 'हेल्थ स्कोर 92', 'बेटी को बताएं'],
        source: 'engine',
        language: 'hi',
      }
    }
    if (lang === 'mr') {
      return {
        reply:
          'तुमची डॉ. प्रिया शर्मा यांच्यासोबतची व्हिडिओ भेट या शुक्रवारी 18 सप्टेंबर रोजी सकाळी 10:30 वाजता आहे. काळजी करू नका, सर्व तयारी पूर्ण आहे.',
        action: { type: 'NAVIGATE', payload: 'Healthcare' },
        suggestedReplies: ['औषधांची यादी पहा', 'आरोग्य गुण 92', 'मुलीला सांगा'],
        source: 'engine',
        language: 'mr',
      }
    }
    return {
      reply:
        'You have an upcoming video visit with Dr. Priya Sharma this Friday, September 18th at 10:30 AM. Everything is prepared for you in Healthcare.',
      action: { type: 'NAVIGATE', payload: 'Healthcare' },
      suggestedReplies: ['Medication schedule', 'Wellness score 92', 'Call family'],
      source: 'engine',
      language: 'en',
    }
  }

  // 6. FAMILY CONNECT (DAUGHTER ANANYA & SON ROHAN)
  if (q.includes('daughter') || q.includes('ananya') || q.includes('बेटी') || q.includes('अनन्या') || q.includes('मुलगी')) {
    if (lang === 'hi') {
      return {
        reply:
          'अनन्या इस समय ऑनलाइन हैं! मैं आपके लिए उनसे सिमुलेटेड वीडियो कॉल जोड़ रहा हूँ ताकि आप उनसे बात करके खुश हो सकें।',
        action: { type: 'CALL_CONTACT', payload: { name: 'Ananya Mehta', relation: 'Daughter' } },
        suggestedReplies: ['रोहन को फोन लगाओ', 'हेल्थकेयर पर जाओ', 'होम स्क्रीन'],
        source: 'engine',
        language: 'hi',
      }
    }
    if (lang === 'mr') {
      return {
        reply:
          'अनन्या सध्या ऑनलाइन आहे! मी तुमच्यासाठी तिच्याशी कॉल जोडून देतो, जेणेकरून तुमचे मन आनंदी होईल.',
        action: { type: 'CALL_CONTACT', payload: { name: 'Ananya Mehta', relation: 'Daughter' } },
        suggestedReplies: ['रोहनला कॉल करा', 'आरोग्य माहिती', 'होम स्क्रीन'],
        source: 'engine',
        language: 'mr',
      }
    }
    return {
      reply:
        'Ananya is online right now! I am starting a simulated call so you two can catch up and share a smile.',
      action: { type: 'CALL_CONTACT', payload: { name: 'Ananya Mehta', relation: 'Daughter' } },
      suggestedReplies: ['Call Rohan instead', 'Show care team', 'Back to Home'],
      source: 'engine',
      language: 'en',
    }
  }

  if (q.includes('son') || q.includes('rohan') || q.includes('बेटा') || q.includes('रोहन') || q.includes('मुलगा')) {
    if (lang === 'hi') {
      return {
        reply:
          'रोहन उपलब्ध हैं। मैं उनसे तुरंत आपका कॉल जोड़ रहा हूँ।',
        action: { type: 'CALL_CONTACT', payload: { name: 'Rohan Mehta', relation: 'Son' } },
        suggestedReplies: ['अनन्या को फोन करो', 'दवाई का समय', 'होम स्क्रीन'],
        source: 'engine',
        language: 'hi',
      }
    }
    if (lang === 'mr') {
      return {
        reply:
          'रोहन उपलब्ध आहे. मी तुमच्यासाठी रोहनशी लगेच संपर्क जोडून देतो.',
        action: { type: 'CALL_CONTACT', payload: { name: 'Rohan Mehta', relation: 'Son' } },
        suggestedReplies: ['अनन्याला कॉल करा', 'औषध वेळापत्रक', 'होम स्क्रीन'],
        source: 'engine',
        language: 'mr',
      }
    }
    return {
      reply:
        'Rohan is available. Let me connect you for a quick check-in call.',
      action: { type: 'CALL_CONTACT', payload: { name: 'Rohan Mehta', relation: 'Son' } },
      suggestedReplies: ['Call Ananya', 'Send a message', 'Back to Home'],
      source: 'engine',
      language: 'en',
    }
  }

  if (q.includes('family') || q.includes('call') || q.includes('परिवार') || q.includes('घर') || q.includes('कुटुंब')) {
    if (lang === 'hi') {
      return {
        reply:
          'आपका परिवार आपसे बहुत प्यार करता है। अनन्या और रोहन दोनों संपर्क सूची में हैं। चलिए लाइव कनेक्ट खोलते हैं।',
        action: { type: 'NAVIGATE', payload: 'Live Connect' },
        suggestedReplies: ['अनन्या को कॉल करो', 'रोहन को कॉल करो', 'केयर डेस्क'],
        source: 'engine',
        language: 'hi',
      }
    }
    if (lang === 'mr') {
      return {
        reply:
          'तुमचे कुटुंब तुमच्यावर खूप प्रेम करते. अनन्या आणि रोहन संपर्कात आहेत. चला लाइव्ह कनेक्ट उघडूया.',
        action: { type: 'NAVIGATE', payload: 'Live Connect' },
        suggestedReplies: ['अनन्याला कॉल करा', 'रोहनला कॉल करा', 'केअर टीम'],
        source: 'engine',
        language: 'mr',
      }
    }
    return {
      reply:
        'Your family loves you dearly. Ananya and Rohan are both in your contact list. Let us open Live Connect so you can reach them.',
      action: { type: 'NAVIGATE', payload: 'Live Connect' },
      suggestedReplies: ['Call Ananya', 'Call Rohan', 'Check care line'],
      source: 'engine',
      language: 'en',
    }
  }

  // 7. LONELINESS, COMFORT & CALMING BREATHING EXERCISE
  if (
    q.includes('lonely') ||
    q.includes('alone') ||
    q.includes('sad') ||
    q.includes('anxious') ||
    q.includes('अकेला') ||
    q.includes('उदास') ||
    q.includes('घबराहट') ||
    q.includes('एकटे') ||
    q.includes('काळजी') ||
    q.includes('वाईट वाटतंय')
  ) {
    if (lang === 'hi') {
      return {
        reply:
          'मैं हमेशा आपके साथ हूँ। अपने दिल पर हाथ रखें और मेरे साथ धीरे-धीरे गहरी साँस लें... साँस अंदर... और धीरे से बाहर। आप बहुत अनमोल हैं।',
        suggestedReplies: ['एक सुंदर कहानी सुनाओ', 'बेटी को फोन लगाओ', 'शांति संगीत'],
        source: 'engine',
        language: 'hi',
      }
    }
    if (lang === 'mr') {
      return {
        reply:
          'तुम्ही मुळीच एकटे नाही आहात, मी सदैव सोबत आहे. मनावरचा ताण सोडा आणि दीर्घ श्वास घ्या... श्वास आत... आणि हळूच बाहेर. सर्व काही छान होईल.',
        suggestedReplies: ['छान विचार सांगा', 'मुलीशी बोला', 'शांत राहा'],
        source: 'engine',
        language: 'mr',
      }
    }
    return {
      reply:
        'I am right here with you. Gently place a hand on your heart. Breathe in slowly for three counts... and release gently. You are safe, cherished, and never alone.',
      suggestedReplies: ['Guide me in breathing', 'Call my daughter', 'Tell something uplifting'],
      source: 'engine',
      language: 'en',
    }
  }

  // 8. DAILY ROUTINE & SCHEDULE
  if (
    q.includes('schedule') ||
    q.includes('routine') ||
    q.includes('today') ||
    q.includes('रूटीन') ||
    q.includes('दिनक्रम') ||
    q.includes('आज का')
  ) {
    if (lang === 'hi') {
      return {
        reply:
          'आज का दिन बहुत अच्छा रहा है! सुबह की सैर और नाश्ता पूरा हो चुका है। अब अगली याददिहानी रात 8:00 बजे की ब्लड प्रेशर की दवाई है।',
        action: { type: 'NAVIGATE', payload: 'Dashboard' },
        suggestedReplies: ['डैशबोर्ड चेकलिस्ट', 'दवाई का समय', 'परिवार से बात करो'],
        source: 'engine',
        language: 'hi',
      }
    }
    if (lang === 'mr') {
      return {
        reply:
          'आजचा दिवस खूप छान चालला आहे! सकाळची फेरफटका आणि नाश्ता पूर्ण झाला आहे. आता पुढची आठवण रात्री 8:00 वाजताच्या रक्तदाबाच्या गोळीची आहे.',
        action: { type: 'NAVIGATE', payload: 'Dashboard' },
        suggestedReplies: ['दिनक्रम यादी', 'औषध वेळापत्रक', 'कुटुंबियांशी संपर्क'],
        source: 'engine',
        language: 'mr',
      }
    }
    return {
      reply:
        'You have done wonderfully today! Morning walk and breakfast are completed. Your next reminder is evening Blood Pressure medicine at 8:00 PM.',
      action: { type: 'NAVIGATE', payload: 'Dashboard' },
      suggestedReplies: ['Mark evening walk done', 'Call family', 'View reports'],
      source: 'engine',
      language: 'en',
    }
  }

  // 9. GREETINGS & IDENTITY
  if (
    q.includes('hello') ||
    q.includes('hi') ||
    q.includes('namaste') ||
    q.includes('नमस्ते') ||
    q.includes('नमस्कार') ||
    q.includes('शुभ')
  ) {
    if (lang === 'hi') {
      return {
        reply:
          'नमस्ते! आपकी सेवा में उपस्थित होकर मुझे बहुत खुशी हुई। आज आपकी सेहत कैसी लग रही है? मैं दवाई या स्वास्थ्य में क्या मदद करूँ?',
        suggestedReplies: ['दवाई का समय बताओ', 'घुटनों में दर्द है', 'बेटी को फोन करो'],
        source: 'engine',
        language: 'hi',
      }
    }
    if (lang === 'mr') {
      return {
        reply:
          'नमस्कार! तुमचा आवाज ऐकून खूप आनंद झाला. आज आपली तब्येत कशी आहे? मी औषध किंवा दिनक्रमात काय मदत करू?',
        suggestedReplies: ['औषधांची वेळ सांगा', 'गुडघेदुखीचा त्रास', 'मुलीला कॉल करा'],
        source: 'engine',
        language: 'mr',
      }
    }
    return {
      reply:
        'Namaste! It is a joy to hear your voice. How are you feeling today? You can ask about your medicines, health tips, or family.',
      suggestedReplies: ['Check my medicines', 'Knee stiffness advice', 'Call my family'],
      source: 'engine',
      language: 'en',
    }
  }

  // DEFAULT MEDICAL COMPANION RESPONSE
  if (lang === 'hi') {
    return {
      reply: `मैंने आपकी बात सुनी: "${query}"। मैं आपका स्वास्थ्य साथी हूँ। क्या आप अपनी दवाई का समय देखना चाहते हैं, स्वास्थ्य रिपोर्ट या परिवार से संपर्क करना चाहते हैं?`,
      suggestedReplies: ['मेरी दवाई की जांच करो', 'घुटनों के दर्द की सलाह', 'बेटी को फोन करो'],
      source: 'engine',
      language: 'hi',
    }
  }
  if (lang === 'mr') {
    return {
      reply: `मी तुमचे बोलणे ऐकले: "${query}"। मी आपला आरोग्य साथीदार आहे. तुम्हाला औषधांची वेळ तपासायची आहे, तब्येतीचा अहवाल की कुटुंबियांशी बोलायचे आहे?`,
      suggestedReplies: ['औषध वेळ सांगा', 'सांधेदुखीवर उपाय', 'अनन्याला कॉल करा'],
      source: 'engine',
      language: 'mr',
    }
  }

  return {
    reply: `I heard you clearly: "${query}". As your medical care companion, I can help you check your medicines, offer gentle health advice, or call your family.`,
    suggestedReplies: ['Check my medicines', 'Knee pain care', 'Call Ananya'],
    source: 'engine',
    language: 'en',
  }
}
