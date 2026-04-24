import { Resend } from 'resend';

// Vercel Serverless Function: envía emails vía Resend
// Requiere env var RESEND_API_KEY en Vercel (Settings → Environment Variables)

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'BiopsyTracker <info@biopsytracker.io>';

type Attachment = {
  filename: string;
  // base64 string sin el prefijo "data:...;base64,"
  content: string;
};

type Body = {
  toEmail: string;
  toName?: string;
  subject: string;
  messageHtml: string;
  fromName?: string;
  replyTo?: string;
  attachments?: Attachment[];
};

export default async function handler(req: any, res: any) {
  // CORS — permitir llamadas desde biopsytracker.io y subdominios Vercel
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

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    res.status(500).json({ error: 'RESEND_API_KEY no configurada en Vercel' });
    return;
  }

  try {
    const body: Body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { toEmail, toName, subject, messageHtml, fromName, replyTo, attachments } = body || {};

    if (!toEmail || !subject || !messageHtml) {
      res.status(400).json({ error: 'Faltan campos obligatorios (toEmail, subject, messageHtml)' });
      return;
    }

    // Construir remitente: "Nombre <info@biopsytracker.io>"
    const from = fromName ? `${fromName} <info@biopsytracker.io>` : FROM_EMAIL;

    const { data, error } = await resend.emails.send({
      from,
      to: [toEmail],
      subject,
      html: messageHtml,
      replyTo: replyTo || undefined,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
    } as any);

    if (error) {
      console.error('Resend error:', error);
      res.status(500).json({ error: (error as any).message || 'Error enviando email' });
      return;
    }

    res.status(200).json({ success: true, id: data?.id, toName });
  } catch (err: any) {
    console.error('send-email error:', err);
    res.status(500).json({ error: err?.message || 'Error inesperado' });
  }
}
