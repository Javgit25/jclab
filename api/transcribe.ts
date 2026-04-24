// Vercel Serverless Function: transcribe audio via OpenAI Whisper.
// Recibe audio en base64, lo envía a Whisper, devuelve el texto transcrito.
//
// Env vars requeridas en Vercel:
//   - OPENAI_API_KEY (obligatoria)

// Prompt fijo con términos médicos frecuentes — mejora la precisión de Whisper
// en vocabulario especializado. Se puede ampliar con más términos con el tiempo.
const MEDICAL_PROMPT =
  'Transcripción de macroscopía de biopsia en español (Argentina). Términos frecuentes: ' +
  'vesícula biliar, endometrio, endocervix, endocérvix, piel, mama, tiroides, próstata, ' +
  'útero, ovario, hígado, riñón, pulmón, cerebro, hueso, laringe, faringe, esófago, ' +
  'duodeno, íleon, apéndice, sigma, ano, páncreas, bazo, médula ósea, ganglio, pleura, ' +
  'peritoneo, vagina, cuello uterino, escamoso, adenocarcinoma, carcinoma, fibroadenoma, ' +
  'hiperplasia, metaplasia, biopsia, exéresis, resección, apendicectomía, mastectomía, ' +
  'tiroidectomía, inmunohistoquímica, cassette, taco, corte, PAP, citología, giemsa, PAS, masson.';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb', // audio puede ser grande
    },
  },
};

export default async function handler(req: any, res: any) {
  // CORS
  const origin = req.headers?.origin || '';
  const allowed = [
    'https://biopsytracker.io',
    'https://www.biopsytracker.io',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  const allowOrigin = allowed.includes(origin) || /\.vercel\.app$/.test(new URL(origin || 'http://x').hostname || '')
    ? origin
    : 'https://biopsytracker.io';
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: 'OPENAI_API_KEY no configurada en Vercel' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { audioBase64, mimeType, language, extraPrompt } = body || {};

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      res.status(400).json({ error: 'Falta audioBase64 (string)' });
      return;
    }

    // Decodificar base64 a Buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    if (audioBuffer.length === 0) {
      res.status(400).json({ error: 'Audio vacío' });
      return;
    }
    if (audioBuffer.length > 25 * 1024 * 1024) {
      res.status(413).json({ error: 'Audio demasiado grande (máximo 25MB)' });
      return;
    }

    // Armar FormData para OpenAI (usa Blob nativo de Node 18+)
    const form = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });
    // Extensión según mimeType
    const ext = (mimeType || '').includes('mp4') ? 'mp4'
      : (mimeType || '').includes('mp3') ? 'mp3'
      : (mimeType || '').includes('wav') ? 'wav'
      : (mimeType || '').includes('ogg') ? 'ogg'
      : 'webm';
    form.append('file', audioBlob, `audio.${ext}`);
    form.append('model', 'whisper-1');
    form.append('language', language || 'es');
    const fullPrompt = extraPrompt ? `${MEDICAL_PROMPT} ${extraPrompt}` : MEDICAL_PROMPT;
    form.append('prompt', fullPrompt);
    form.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('OpenAI error:', response.status, errText);
      res.status(500).json({ error: `OpenAI error ${response.status}: ${errText.slice(0, 500)}` });
      return;
    }

    const data: any = await response.json();
    res.status(200).json({ text: data.text || '' });
  } catch (err: any) {
    console.error('transcribe error:', err);
    res.status(500).json({ error: err?.message || 'Error inesperado' });
  }
}
