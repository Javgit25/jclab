import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function: sirve el logo de un laboratorio como imagen real.
// Lo necesitamos porque los logos se guardan como data URLs (base64) en labConfig,
// y Gmail/Outlook bloquean data: URLs en <img>. Esta endpoint los decodifica y los
// devuelve con Content-Type correcto, así pueden usarse en emails como URL pública.
//
// Uso: <img src="https://jclab.vercel.app/api/lab-logo?labCode=ABC123" />
//
// La anon key ya está expuesta en el front-end (src/lib/supabase.ts), no es secreto.
// La lectura está protegida por RLS en Supabase.
const SUPABASE_URL = 'https://zhicnrmjojshxgoxiekx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoaWNucm1qb2pzaHhnb3hpZWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODg5NjgsImV4cCI6MjA5MTI2NDk2OH0.tdQleqtNBHi1wqkoJpanbe4_lQtie1rKpsIrGnedH9E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: any, res: any) {
  // Permitir CORS — útil si el cliente de email pre-fetcha la imagen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }

  const labCode = String(req.query?.labCode || '').trim();
  if (!labCode) {
    res.status(400).send('labCode query param required');
    return;
  }

  if (!supabase) {
    res.status(500).send('SUPABASE_ANON_KEY no configurada');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('laboratories')
      .select('lab_config')
      .eq('lab_code', labCode)
      .single();

    if (error || !data) {
      res.status(404).send('Lab not found');
      return;
    }

    const logoUrl: string = data.lab_config?.logoUrl || '';
    if (!logoUrl.startsWith('data:')) {
      res.status(404).send('No logo configured');
      return;
    }

    const match = logoUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      res.status(400).send('Invalid logo data URL');
      return;
    }

    const mimeType = match[1];
    const buffer = Buffer.from(match[2], 'base64');

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).send(buffer);
  } catch (err: any) {
    console.error('lab-logo error:', err);
    res.status(500).send('Error serving logo');
  }
}
