import { Resend } from 'resend';

// Vercel Serverless Function: envía emails vía Resend.
// Opcional: convierte `htmlForPdf` a PDF via PDFShift y lo adjunta.
//
// Env vars requeridas en Vercel (Settings → Environment Variables):
//   - RESEND_API_KEY      (obligatoria)
//   - PDFSHIFT_API_KEY    (opcional, solo si mandás htmlForPdf)

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
  // Si viene, se convierte a PDF en el server y se adjunta con este nombre.
  htmlForPdf?: string;
  pdfFilename?: string;
};

// Convierte HTML a PDF llamando al API de PDFShift. Devuelve base64.
async function htmlToPdfViaPdfShift(html: string): Promise<string> {
  const apiKey = process.env.PDFSHIFT_API_KEY;
  if (!apiKey) throw new Error('PDFSHIFT_API_KEY no configurada en Vercel');

  const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from('api:' + apiKey).toString('base64'),
    },
    body: JSON.stringify({
      source: html,
      format: 'A4',
      // Sin márgenes de página: el HTML ya trae su propio padding interno.
      // Así el banner del encabezado queda de borde a borde, como en el archivo descargado.
      margin: '0',
      landscape: false,
      // No usamos @media print para que se vea igual que el HTML en pantalla
      use_print: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`PDFShift error ${response.status}: ${errText.slice(0, 300)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

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
    const { toEmail, toName, subject, messageHtml, fromName, replyTo, htmlForPdf, pdfFilename } = body || {};
    let { attachments } = body || {};

    if (!toEmail || !subject || !messageHtml) {
      res.status(400).json({ error: 'Faltan campos obligatorios (toEmail, subject, messageHtml)' });
      return;
    }

    // Si viene htmlForPdf, generar PDF via PDFShift y agregarlo como adjunto
    if (htmlForPdf && htmlForPdf.trim().length > 0) {
      try {
        const pdfBase64 = await htmlToPdfViaPdfShift(htmlForPdf);
        const filename = pdfFilename || 'Documento.pdf';
        attachments = [...(attachments || []), { filename, content: pdfBase64 }];
      } catch (pdfErr: any) {
        console.error('Error generando PDF:', pdfErr);
        // No abortar el email — mandar sin adjunto pero avisar en response
        res.status(200).json({
          success: false,
          warning: 'Email no enviado por fallo en PDF: ' + (pdfErr?.message || 'error'),
        });
        return;
      }
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
