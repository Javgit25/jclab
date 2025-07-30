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
  'Gastrica', 'Vesicula biliar', 'Endometrio', 'Endoscopia', 
  'Endocervix', 'Vulva', 'Recto', 'Piel', 'Mucosa', 'Colon', 'Ganglio',
  'Mama', 'Tiroides', 'Próstata', 'Útero', 'Ovario', 'Hígado', 'Riñón',
  'Pulmón', 'Cerebro', 'Hueso', 'Músculo', 'Laringe', 'Faringe', 'Esófago',
  'Duodeno', 'Yeyuno', 'Íleon', 'Ciego', 'Apéndice', 'Sigma', 'Ano',
  'Páncreas', 'Bazo', 'Timo', 'Médula ósea', 'Linfonodo', 'Pericardio',
  'Pleura', 'Peritoneo', 'Vagina', 'Clítoris', 'Labio mayor', 'Labio menor'
];
