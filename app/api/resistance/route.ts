import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
  }

  let body: { system: string; user: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        system: body.system,
        messages: [{ role: 'user', content: body.user }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[resistance] Anthropic error', res.status, text);
      return NextResponse.json({ error: 'upstream_error', raw: text }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('');

    return NextResponse.json({ text });
  } catch (err) {
    console.error('[resistance] fetch error', err);
    return NextResponse.json({ error: 'fetch_failed' }, { status: 502 });
  }
}
