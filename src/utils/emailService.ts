// emailService.ts — cliente que llama a la Vercel Function `/api/send-email` (Resend)
// La API key de Resend está en Vercel como env var RESEND_API_KEY (no en el front).

// URL del endpoint: configurable por build-time env var VITE_EMAIL_API_URL.
// Default: URL estable de Production del proyecto jclab en Vercel.
const API_URL =
  (import.meta.env.VITE_EMAIL_API_URL as string | undefined) ||
  'https://jclab.vercel.app/api/send-email';

export type EmailAttachment = {
  filename: string;
  // base64 puro (sin prefijo data:...;base64,)
  content: string;
};

// Init dummy (se mantiene para compatibilidad con call sites existentes)
export const initEmailJS = () => {};

// Siempre true: la config vive en Vercel, el front no necesita nada local.
export const isEmailConfigured = () => true;

// Enviar email.
// Opcional: `htmlForPdf` se convierte a PDF en el server (via PDFShift) y se adjunta
// con el nombre `pdfFilename`. Esto da fidelidad perfecta porque PDFShift usa un
// Chrome real para renderizar el HTML.
export const sendEmail = async (params: {
  toEmail: string;
  toName: string;
  subject: string;
  messageHtml: string;
  fromName: string;
  attachments?: EmailAttachment[];
  htmlForPdf?: string;
  pdfFilename?: string;
}) => {
  // reply_to del email del laboratorio en labConfig (para que las respuestas lleguen al lab)
  let replyTo = '';
  try { replyTo = JSON.parse(localStorage.getItem('labConfig') || '{}').email || ''; } catch {}

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      toEmail: params.toEmail,
      toName: params.toName,
      subject: params.subject,
      messageHtml: params.messageHtml,
      fromName: params.fromName,
      replyTo: replyTo || undefined,
      attachments: params.attachments || undefined,
      htmlForPdf: params.htmlForPdf || undefined,
      pdfFilename: params.pdfFilename || undefined,
    }),
  });

  if (!response.ok) {
    let errMsg = `Error ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) errMsg = data.error;
    } catch {}
    throw new Error(errMsg);
  }

  return response.json();
};

// Enviar email a múltiples destinatarios (uno por uno, con pausa entre envíos)
export const sendBulkEmail = async (
  recipients: { email: string; name: string }[],
  params: { subject: string; messageHtml: string; fromName: string; attachments?: EmailAttachment[] }
) => {
  const results: { email: string; success: boolean; error?: string }[] = [];

  for (const recipient of recipients) {
    try {
      await sendEmail({
        toEmail: recipient.email,
        toName: recipient.name,
        subject: params.subject,
        messageHtml: params.messageHtml,
        fromName: params.fromName,
        attachments: params.attachments,
      });
      results.push({ email: recipient.email, success: true });
    } catch (error: any) {
      results.push({ email: recipient.email, success: false, error: error?.message || 'Error desconocido' });
    }
    // Pausa corta para no saturar
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
};

// Compatibilidad con la API vieja: se ignora (Resend no usa estas keys).
// Se mantiene para no romper call sites. Podemos eliminarla cuando migremos la UI.
export const saveEmailConfig = (_serviceId: string, _templateId: string, _publicKey: string) => {};

// Enviar email de prueba
export const sendTestEmail = async (toEmail: string) => {
  const labConfig = JSON.parse(localStorage.getItem('labConfig') || '{}');
  return sendEmail({
    toEmail,
    toName: 'Test',
    subject: 'Prueba de email - ' + (labConfig.nombre || 'BiopsyTracker'),
    messageHtml:
      '<h2>Email de prueba</h2>' +
      '<p>Si recibiste este email, la integración con Resend está funcionando correctamente.</p>' +
      '<p>' + (labConfig.nombre || 'Laboratorio') + '</p>',
    fromName: labConfig.nombre || 'BiopsyTracker',
  });
};
