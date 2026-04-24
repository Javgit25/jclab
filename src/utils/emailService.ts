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

// Enviar email de prueba — sirve de preview del email de facturación con los
// textos configurados (mensaje del email + pie de pago).
export const sendTestEmail = async (toEmail: string) => {
  const labConfig = JSON.parse(localStorage.getItem('labConfig') || '{}');
  let emailCfg: any = {};
  try { emailCfg = JSON.parse(localStorage.getItem('emailjsConfig') || '{}'); } catch {}

  const labName = labConfig.nombre || 'Laboratorio';
  const mesEjemplo = (() => {
    const m = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    return m.charAt(0).toUpperCase() + m.slice(1);
  })();

  const bodyText = (emailCfg.bodyText || '').trim();
  const mensajeHtml = bodyText
    ? bodyText.replace(/\[nombre del médico\]/gi, '<strong>Dr/a. Apellido</strong>')
              .replace(/\[mes actual\]/gi, '<strong>' + mesEjemplo + '</strong>')
              .replace(/\n/g, '<br>')
    : (
      'Estimado/a Dr./Dra. <strong>Apellido</strong>,<br>' +
      'Por medio de la presente, le adjuntamos el detalle completo de las biopsias y pacientes remitidos a nuestro laboratorio durante el mes de <strong>' + mesEjemplo + '</strong>.<br>' +
      'Quedamos a su disposición para cualquier consulta o aclaración que considere necesaria.<br>' +
      'Sin otro particular, saludamos a usted muy atentamente.'
    );

  const footerText = (emailCfg.footerText || '').trim();
  const footerHtml = footerText
    ? '<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />' +
      '<div style="font-size:12px;color:#475569;white-space:pre-line;">' + footerText.replace(/</g, '&lt;').replace(/\n/g, '<br>') + '</div>'
    : '';

  const messageHtml =
    '<div style="font-family:Arial,sans-serif;max-width:600px;color:#1e293b;line-height:1.6;">' +
      '<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#92400e;">' +
        '⚠️ <strong>Email de prueba</strong> — así se verá el email de facturación que reciben los médicos. Los valores <em>[nombre del médico]</em> y <em>[mes actual]</em> se reemplazan automáticamente en los envíos reales.' +
      '</div>' +
      '<h2 style="color:#0f172a;margin:0 0 12px;">' + labName + '</h2>' +
      '<div>' + mensajeHtml + '</div>' +
      footerHtml +
      '<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />' +
      '<div style="font-size:11px;color:#94a3b8;">Enviado desde biopsytracker.io — integración con Resend.</div>' +
    '</div>';

  return sendEmail({
    toEmail,
    toName: 'Prueba',
    subject: 'Prueba de email - ' + labName,
    messageHtml,
    fromName: labName,
  });
};
