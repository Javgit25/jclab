import { Clock, Microscope, TestTube, Clipboard } from 'lucide-react';
import { ServiceOption } from '../types';

// ✅ CORREGIDO: Solo servicios adicionales para BIOPSIAS NORMALES
// PAP y Citología se manejan en Step2, NO aquí
export const serviciosAdicionales: ServiceOption[] = [
  {
    key: 'cassetteUrgente',
    label: 'URGENTE 24HS',
    icon: Clock,
    description: 'Procesamiento urgente en 24 horas',
    color: 'red'
  },
  {
    key: 'corteBlancoIHQ',
    label: 'CORTE EN BLANCO PARA IHQ',
    icon: Clipboard,
    description: 'Corte en blanco para inmunohistoquímica',
    color: 'orange'
  },
  {
    key: 'corteBlancoComun',
    label: 'CORTE EN BLANCO COMÚN',
    icon: Clipboard,
    description: 'Corte en blanco estándar',
    color: 'gray'
  },
  {
    key: 'giemsaPASMasson',
    label: 'GIEMSA/PAS/MASSON',
    icon: TestTube,
    description: 'Técnicas de tinción especiales',
    color: 'blue'
  }
];

// ✅ Lista de tipos de tejido CON PAP y Citología
export const tissueTypes = [
  'PAP',
  'Citología',
  'Inmunohistoquímica',
  'Taco en Consulta',
  'Gastrica',
  'Endometrio',
  'Endoscopia',
  'Piel',
  'Colon'
];

// Sub-opciones para cuando se selecciona "Endoscopia" (táctil - selección múltiple)
export const endoscopiaSubTypes = [
  'Esofago',
  'Gastrica',
  'Bulbo',
  '2da porción de Duodeno',
  'Colon',
  'Polipos de colon'
];

// Opciones para Giemsa/PAS/Masson (selección múltiple)
export const giemsaOptions = [
  { key: 'giemsa', label: 'Giemsa' },
  { key: 'pas', label: 'PAS' },
  { key: 'masson', label: 'Masson' }
];

// ✅ Lista completa de tejidos CON PAP y Citología
export const allTissueTypes = [
  'PAP',
  'Citología',
  'Inmunohistoquímica',
  'Taco en Consulta',
  'Gastrica', 'Vesicula biliar', 'Endometrio', 'Endoscopia',
  'Endocervix', 'Vulva', 'Recto', 'Piel', 'Mucosa', 'Colon', 'Ganglio',
  'Mama', 'Tiroides', 'Próstata', 'Útero', 'Ovario', 'Hígado', 'Riñón',
  'Pulmón', 'Cerebro', 'Hueso', 'Músculo', 'Laringe', 'Faringe', 'Esófago',
  'Duodeno', 'Yeyuno', 'Íleon', 'Ciego', 'Apéndice', 'Sigma', 'Ano',
  'Páncreas', 'Bazo', 'Timo', 'Médula ósea', 'Linfonodo', 'Pericardio',
  'Pleura', 'Peritoneo', 'Vagina', 'Clítoris', 'Labio mayor', 'Labio menor'
];

// Normaliza un nombre de tejido a su forma canónica.
// Evita que variantes como "Pap" o "Taco consulta" se guarden y disparen el flujo equivocado.
export const normalizeTissueName = (tissue: string): string => {
  if (!tissue) return tissue;
  const cleaned = tissue.trim();
  const lower = cleaned.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const canonicalMap: Record<string, string> = {
    'pap': 'PAP',
    'ihq': 'Inmunohistoquímica',
    'inmunohistoquimica': 'Inmunohistoquímica',
    'citologia': 'Citología',
    'taco en consulta': 'Taco en Consulta',
    'taco consulta': 'Taco en Consulta',
    'vb': 'Vesicula biliar',
    'vesicula biliar': 'Vesicula biliar'
  };
  if (canonicalMap[lower]) return canonicalMap[lower];
  // Por defecto: primera letra mayúscula, resto minúscula
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
};

// ✅ Lista default completa (misma que usa AdminPanel como base) — se usa de fallback
// para el autocompletado aunque Supabase/localStorage no tengan config guardada.
export const defaultAdminTissues = [
  'Absceso', 'Adenoides', 'Amigdala', 'Anexohisterectomia', 'Anexos', 'Angioma', 'Ano', 'Apendice', 'Arteria', 'Articular', 'Asa Leep', 'Autopsia', 'Axila',
  'Bazo', 'Boca', 'Bronquio',
  'Capsula', 'Cartilago', 'Cerebro', 'Cilindros', 'Cistico', 'Citología', 'Coagulo', 'Colon', 'Condiloma', 'Conducto deferente', 'Conjuntiva', 'Cono', 'Cordon umbilical', 'Costilla', 'Cuello', 'Cuerda vocal',
  'Dedo', 'Disco', 'Diverticulo', 'Duodeno',
  'Embarazo ectopico', 'Encia', 'Endocervix', 'Endometrio', 'Endoscopia', 'Epididimo', 'Epiplon', 'Escroto', 'Esofago', 'Estomago',
  'Falange', 'Faringe', 'Fibroma', 'Fibrosis de pared', 'Fistula', 'Fosa nasal',
  'Ganglio', 'Gangrena', 'Gastrica', 'Glande', 'Glandula', 'Glandula salival', 'Granuloma',
  'Hemorroides', 'Hernia', 'Hidatide', 'Higado', 'Hipofisis', 'Hueso',
  'Ileon', 'Inmunohistoquímica', 'Intestino',
  'Labio', 'Laringe', 'LCR', 'Legrado', 'Lengua', 'Lesión', 'Lipoma',
  'Malar', 'Mama', 'Maxilar', 'Mediastino', 'Medula ósea', 'Membranas', 'Mesenterio', 'Mioma', 'Mola', 'Mucocele', 'Muscular',
  'Nariz', 'Nodulo',
  'Oido', 'Ojo', 'Oreja', 'Orina', 'Oseo', 'Ovario',
  'PAP', 'Paladar', 'Pancreas', 'Paratiroides', 'Parpado', 'Parotida', 'Partes blandas', 'Pelvis', 'Pene', 'Pericardio', 'Perine', 'Peritoneo', 'Piel', 'Placenta', 'Pleura', 'Polipo', 'Prepucio', 'Prostata', 'Pulmon', 'Punción',
  'Quiste',
  'Recto', 'Restos ovulares', 'Retroperitoneo', 'Riñón', 'RTU',
  'Sacro', 'Saco', 'Sigma', 'Sinovial', 'Suprarrenal',
  'Taco consulta', 'Tacos', 'TCS', 'Tejido adiposo', 'Tendon', 'Teratoma', 'Testiculo', 'Timo', 'Tiroides', 'Trombo', 'Trompa', 'Tumor', 'Tunica albuginea',
  'Ulcera', 'Uña', 'Uretra', 'Ureter', 'Urinario', 'Utero',
  'Vagina', 'Valvula cardiaca', 'Varices', 'Vascular', 'Vejiga', 'Vena', 'Vertebra', 'Vesicula biliar', 'Vulva'
];
