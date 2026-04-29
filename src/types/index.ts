// ✅ TIPOS ACTUALIZADOS PARA GIEMSA CORREGIDO

export interface DoctorInfo {
  id?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  hospital: string;
  selectedDate: string;
  loginDate?: string;
  cargadoPor?: string;       // Quién está usando la app (médico o ayudante)
}

export interface Ayudante {
  id: string;
  nombre: string;
  password: string;
  activo: boolean;
  creadoAt: string;
}

export interface RegisteredDoctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  hospital: string;
  hospitales?: string[];          // Multi-centro: lista de centros médicos
  whatsapp: string;
  labCode: string;
  password: string;
  registeredAt: string;
  profileChanges: ProfileChange[];
  ayudantes?: Ayudante[];
}

export interface Solicitud {
  id: string;
  tipo: 'taco' | 'profundizacion' | 'servicio_adicional' | 'anulacion_remito';
  remitoNumber: string;
  numeroPaciente: string;
  tejido: string;
  cassettesSeleccionados?: number[];  // Para tacos: cuáles cassettes
  cassetteLabels?: string[];          // Labels legibles de los cassettes
  descripcion: string;                // Descripción de la solicitud
  solicitadoPor: string;              // Médico o ayudante
  solicitadoAt: string;               // Fecha ISO
  estado: 'pendiente' | 'en_proceso' | 'entregado' | 'rechazado';
  entregadoAt?: string;
  entregadoPor?: string;              // Quién del lab lo entregó
  doctorEmail: string;
  labCode: string;
  notas?: string;                     // Notas del laboratorio
  // Paciente histórico — anterior al uso de BiopsyTracker, no está en la base.
  // Solo aplica a tacos / profundización / servicio adicional sobre material físico (no PAP/Cito).
  historico?: boolean;
  historicoFecha?: string;            // 'YYYY-MM' aproximada del estudio original
  historicoTotalCassettes?: number;   // cantidad total de cassettes del estudio original
  historicoCantSolicitada?: number;   // cuántos cassettes pide ahora (≤ total)
  historicoIdentCassettes?: string;   // texto: "1, 3" o "A, C" — requerido si pide menos del total
}

export interface ProfileChange {
  field: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
}

export interface GiemsaServices {
  giemsa: boolean;
  pas: boolean;
  masson: boolean;
}

// ✅ TIPOS ADICIONALES PARA LA APP
export interface HistoryEntry {
  id: string;
  remitoNumber?: string;
  date: string;
  timestamp: string;
  biopsies: BiopsyForm[];
  doctorInfo: DoctorInfo;
  cargadoPor?: string;
}

export interface SyncAction {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  [key: string]: any; // Permitir cualquier propiedad adicional
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
  giemsaPASMassonTotal?: number;
  corteBlancoIHQCassettes?: number[];
  corteBlancoComunCassettes?: number[];
  giemsaCassettes?: number[];
  incluyeCitologia?: boolean;
  citologiaFormato?: 'vidrios' | 'jeringa' | 'frasco';
  citologiaVidriosQty?: number;
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
  citologiaSubType?: string;  // Subtipo: 'PAAF' | 'Líquidos' | ''
  cargadoPor?: string;        // Nombre de quien cargó (médico o ayudante)
  trozoPorCassette?: number[]; // Trozos por cada cassette individual
  quedaMaterial?: boolean;     // Si queda material sin procesar
  ihqTejido?: string;          // Sub-tejido para Inmunohistoquímica
  ihqVidriosQty?: number;      // Cantidad de vidrios para IHQ
  entregarConTaco?: boolean;   // Si se solicita devolver tacos/cassettes
  tacosSeleccionados?: number[]; // Índices de cassettes a devolver (vacío = todos)
  numeroExterno?: string;       // Número externo del taco (para Taco en Consulta)
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
  estadoEnvio?: 'borrador' | 'enviado' | 'recibido' | 'observado';
  enviadoAt?: string;
  recibidoAt?: string;
  recibidoPor?: string;
  observacionRecepcion?: string;
  materialRecibido?: boolean;
  fechaMaterialRecibido?: string;
  impreso?: boolean;
  fechaImpreso?: string;
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
  numeroExterno?: string;
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
  'Absceso','Adenoides','Amigdala','Anexohisterectomia','Anexos','Angioma','Ano','Apendice','Arteria','Articular','Asa Leep','Autopsia','Axila',
  'Bazo','Boca','Bronquio','Capsula','Cartilago','Cerebro','Cilindros','Cistico','Citología','Coagulo','Colon','Condiloma','Conducto deferente','Conjuntiva','Cono','Cordon umbilical','Costilla','Cuello','Cuerda vocal',
  'Dedo','Disco','Diverticulo','Duodeno','Embarazo ectopico','Encia','Endocervix','Endometrio','Endoscopia','Epididimo','Epiplon','Escroto','Esofago','Estomago',
  'Falange','Faringe','Fibroma','Fibrosis de pared','Fistula','Fosa nasal','Ganglio','Gangrena','Gastrica','Glande','Glandula','Glandula salival','Granuloma',
  'Hemorroides','Hernia','Hidatide','Higado','Hipofisis','Hueso','Ileon','Inmunohistoquímica','Intestino',
  'Labio','Laringe','LCR','Legrado','Lengua','Lesión','Lipoma','Malar','Mama','Maxilar','Mediastino','Medula ósea','Membranas','Mesenterio','Mioma','Mola','Mucocele','Muscular',
  'Nariz','Nodulo','Oido','Ojo','Oreja','Orina','Oseo','Ovario',
  'PAP','Paladar','Pancreas','Paratiroides','Parpado','Parotida','Partes blandas','Pelvis','Pene','Pericardio','Perine','Peritoneo','Piel','Placenta','Pleura','Polipo','Prepucio','Prostata','Pulmon','Punción',
  'Quiste','Recto','Restos ovulares','Retroperitoneo','Riñón','RTU',
  'Sacro','Saco','Sigma','Sinovial','Suprarrenal','Taco consulta','Tacos','TCS','Tejido adiposo','Tendon','Teratoma','Testiculo','Timo','Tiroides','Trombo','Trompa','Tumor','Tunica albuginea',
  'Ulcera','Uña','Uretra','Ureter','Urinario','Utero','Vagina','Valvula cardiaca','Varices','Vascular','Vejiga','Vena','Vertebra','Vesicula biliar','Vulva'
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

