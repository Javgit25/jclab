import emailjs from '@emailjs/browser';

// Configuración de EmailJS - se lee desde localStorage (configurable por el admin)
const getEmailConfig = () => {
  try {
    const config = JSON.parse(localStorage.getItem('emailjsConfig') || '{}');
    return {
      serviceId: config.serviceId || '',
      templateId: config.templateId || '',
      publicKey: config.publicKey || '',
      configured: !!(config.serviceId && config.templateId && config.publicKey)
    };
  } catch {
    return { serviceId: '', templateId: '', publicKey: '', configured: false };
  }
};

// Inicializar EmailJS
export const initEmailJS = () => {
  const config = getEmailConfig();
  if (config.publicKey) {
    emailjs.init(config.publicKey);
  }
};

// Verificar si está configurado
export const isEmailConfigured = () => getEmailConfig().configured;

// Enviar email
export const sendEmail = async (params: {
  toEmail: string;
  toName: string;
  subject: string;
  messageHtml: string;
  fromName: string;
}) => {
  const config = getEmailConfig();

  if (!config.configured) {
    throw new Error('EmailJS no está configurado. Configurá Service ID, Template ID y Public Key en Configuración.');
  }

  const templateParams = {
    to_email: params.toEmail,
    to_name: params.toName,
    subject: params.subject,
    message_html: params.messageHtml,
    from_name: params.fromName,
  };

  const response = await emailjs.send(
    config.serviceId,
    config.templateId,
    templateParams,
    config.publicKey
  );

  return response;
};

// Enviar email a múltiples destinatarios (uno por uno)
export const sendBulkEmail = async (recipients: { email: string; name: string }[], params: {
  subject: string;
  messageHtml: string;
  fromName: string;
}) => {
  const results: { email: string; success: boolean; error?: string }[] = [];

  for (const recipient of recipients) {
    try {
      await sendEmail({
        toEmail: recipient.email,
        toName: recipient.name,
        subject: params.subject,
        messageHtml: params.messageHtml,
        fromName: params.fromName,
      });
      results.push({ email: recipient.email, success: true });
    } catch (error: any) {
      results.push({ email: recipient.email, success: false, error: error.message || 'Error desconocido' });
    }
    // Pequeña pausa entre emails para no sobrecargar
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
};

// Guardar configuración
export const saveEmailConfig = (serviceId: string, templateId: string, publicKey: string) => {
  localStorage.setItem('emailjsConfig', JSON.stringify({ serviceId, templateId, publicKey }));
  if (publicKey) emailjs.init(publicKey);
};

// Enviar email de prueba
export const sendTestEmail = async (toEmail: string) => {
  const labConfig = JSON.parse(localStorage.getItem('labConfig') || '{}');
  return sendEmail({
    toEmail,
    toName: 'Test',
    subject: 'Prueba de email - ' + (labConfig.nombre || 'BiopsyTracker'),
    messageHtml: '<h2>Email de prueba</h2><p>Si recibiste este email, la configuración de EmailJS está funcionando correctamente.</p><p>' + (labConfig.nombre || 'Laboratorio') + '</p>',
    fromName: labConfig.nombre || 'BiopsyTracker',
  });
};
