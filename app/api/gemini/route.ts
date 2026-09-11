import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

const demoReply = 'I heard you. I am here with you. You can ask about your schedule, health, or family.'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = typeof body?.message === 'string' ? body.message.trim() : ''

    if (!message) {
      return NextResponse.json({ error: 'Please share a message first.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json({ reply: demoReply, demo: true })
    }

    const result = await generateText({
      model: google('gemini-2.5-flash', { apiKey }),
      system: 'You are VRAAYU, a warm, concise wellbeing companion for older adults. Be reassuring and practical. Never diagnose or replace emergency services. Keep replies under 60 words.',
      prompt: message,
    })

    return NextResponse.json({ reply: result.text, demo: false })
  } catch {
    return NextResponse.json({ reply: demoReply, demo: true })
  }
}
