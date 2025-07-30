// ✅ TIPOS ACTUALIZADOS PARA GIEMSA CORREGIDO

export interface DoctorInfo {
  name: string;
  email: string;
  hospital: string;
  selectedDate: string;
}

export interface GiemsaServices {
  giemsa: boolean;
  pas: boolean;
  masson: boolean;
}

export interface BiopsyServices {
  cassetteUrgente: boolean;
  pap: boolean;
  papUrgente: boolean;
  citologia: boolean;
  citologiaUrgente: boolean;
  corteBlancoIHQ: boolean;
  corteBlancoIHQQuantity: number;
  corteBlancoComun: boolean;
  corteBlancoComunQuantity: number;
  giemsaPASMasson: boolean | number; // ✅ Puede ser boolean o number
  giemsaOptions: GiemsaServices;
  giemsaPASMassonTotal?: number; // ✅ NUEVO CAMPO TEMPORAL para almacenar el total
}

export interface CassetteNumber {
  base: string;
  suffix: string;
}

export interface BiopsyForm {
  number: string;
  tissueType: string;
  endoscopiaSubTypes: string[];
  type: string;
  cassettes: string;
  pieces: string;
  cassettesNumbers: CassetteNumber[];
  declassify: string;
  servicios: BiopsyServices;
  observations: string;
  timestamp?: string;
  date?: string;
  // ✅ CAMPOS OBLIGATORIOS PARA PAP Y CITOLOGÍA:
  papQuantity: number;        // Cantidad de PAP
  papUrgente: boolean;        // Si PAP es urgente
  citologiaQuantity: number;  // Cantidad de vidrios de citología
  citologiaUrgente: boolean;  // Si citología es urgente
}

export interface VirtualKeyboard {
  isOpen: boolean;
  type: 'numeric' | 'full';
  targetField: string;
  targetValue: string;
}

export interface Remito {
  id: string;
  doctorInfo: DoctorInfo;
  biopsies: BiopsyForm[];
  createdAt: string;
  status: 'draft' | 'sent';
}

// ✅ INTERFACES ADICIONALES PARA EL ADMIN PANEL

export interface AdminRemito {
  id: string;
  medico: string;
  email: string;
  fecha: string;
  hospital: string;
  biopsias: AdminBiopsia[];
  estado: 'pendiente' | 'facturado';
}

export interface AdminBiopsia {
  numero: string;
  tejido: string;
  tipo: string;
  cassettes: number;
  trozos: number;
  desclasificar: string;
  servicios: {
    cassetteNormal: number;
    cassetteUrgente: number;
    profundizacion: number;
    pap: number;
    papUrgente: number;
    citologia: number;
    citologiaUrgente: number;
    corteBlanco: number;
    corteBlancoIHQ: number;
    giemsaPASMasson: number | boolean; // ✅ Puede ser número o boolean para compatibilidad
    giemsaOptions?: GiemsaServices; // ✅ Opcional para datos antiguos
  };
  papQuantity: number;
  citologiaQuantity: number;
}

export interface Configuracion {
  precioCassette: number;
  precioCassetteUrgente: number;
  precioProfundizacion: number;
  precioPAP: number;
  precioPAPUrgente: number;
  precioCitologia: number;
  precioCitologiaUrgente: number;
  precioCorteBlanco: number;
  precioCorteBlancoIHQ: number;
  precioGiemsaPASMasson: number;
  tiposTejido: string[];
}

// ✅ TIPOS PARA VALIDACIÓN Y MANEJO DE ERRORES

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState {
  isValid: boolean;
  errors: ValidationError[];
  isDirty: boolean;
}

// ✅ TIPOS PARA EL SISTEMA DE RESPALDO Y SINCRONIZACIÓN

export interface BackupStatus {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSync?: string;
  errorMessage?: string;
  syncQueueLength: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'biopsy' | 'remito';
  data: BiopsyForm | Remito;
  timestamp: string;
  retryCount: number;
}

// ✅ CONSTANTES DE LA APLICACIÓN

export const TISSUE_TYPES = [
  'Gastrica', 'Vesicula biliar', 'Endometrio', 'Endoscopia', 
  'Endocervix', 'Vulva', 'Recto', 'Piel', 'Mucosa', 'Colon', 'Ganglio',
  'Mama', 'Tiroides', 'Próstata', 'Útero', 'Ovario', 'PAP', 'Citología'
] as const;

export const ENDOSCOPIA_SUBTYPES = [
  'Esófago', 'Estómago', 'Duodeno', 'Colon', 'Recto', 'Íleon'
] as const;

export const BIOPSY_TYPES = ['BX', 'RX'] as const;

export const DECLASSIFY_OPTIONS = [
  'No desclasificar',
  'Desclasificar para citología',
  'Desclasificar para IHQ',
  'Desclasificar para técnicas especiales'
] as const;

// ✅ TIPOS DERIVADOS DE LAS CONSTANTES

export type TissueType = typeof TISSUE_TYPES[number];
export type EndoscopiaSubtype = typeof ENDOSCOPIA_SUBTYPES[number];
export type BiopsyType = typeof BIOPSY_TYPES[number];
export type DeclassifyOption = typeof DECLASSIFY_OPTIONS[number];

// ✅ HELPERS Y UTILIDADES

export interface ServiceCalculation {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isUrgent?: boolean;
}

export interface BiopsyCalculation {
  biopsyNumber: string;
  services: ServiceCalculation[];
  total: number;
}

export interface RemitoCalculation {
  remitId: string;
  doctorName: string;
  biopsies: BiopsyCalculation[];
  grandTotal: number;
  createdAt: string;
}

// ✅ TIPOS PARA FILTROS Y BÚSQUEDAS

export interface FilterOptions {
  dateFrom?: string;
  dateTo?: string;
  doctor?: string;
  hospital?: string;
  tissueType?: string;
  status?: 'pendiente' | 'facturado' | 'all';
}

export interface SearchResult {
  biopsies: BiopsyForm[];
  remitos: Remito[];
  totalResults: number;
}

// ✅ TIPOS PARA NOTIFICACIONES Y ALERTAS

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  autoClose?: boolean;
  duration?: number;
}

// ✅ CONFIGURACIÓN DE LA APLICACIÓN

export interface AppConfig {
  version: string;
  apiUrl?: string;
  enableOfflineMode: boolean;
  autoSyncInterval: number;
  maxRetryAttempts: number;
  debugMode: boolean;
}

// ✅ EXPORT POR DEFECTO PARA MANTENER COMPATIBILIDAD

export default {
  DoctorInfo,
  BiopsyForm,
  BiopsyServices,
  GiemsaServices,
  CassetteNumber,
  VirtualKeyboard,
  Remito,
  AdminRemito,
  AdminBiopsia,
  Configuracion,
  TISSUE_TYPES,
  ENDOSCOPIA_SUBTYPES,
  BIOPSY_TYPES,
  DECLASSIFY_OPTIONS
};