// Información del doctor
export interface DoctorInfo {
  firstName: string;
  lastName: string;
  hospitalName?: string;
  email?: string;
  loginDate: string;
}

// Servicios adicionales de Giemsa
export interface GiemsaServices {
  giemsa: boolean;
  pas: boolean;
  masson: boolean;
}

// Servicios adicionales para biopsias
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
  giemsaPASMasson: boolean;
  giemsaOptions?: GiemsaServices;
}

// Número de cassette con sufijo
export interface CassetteNumber {
  base: string;
  suffix: string;
}

// Formulario de biopsia
export interface BiopsyForm {
  number: string;
  tissueType: string;
  endoscopiaSubTypes: string[];
  type: string;
  cassettes: string;
  pieces: string;
  cassettesNumbers: CassetteNumber[] | string[];
  declassify: string;
  servicios: BiopsyServices;
  observations: string;
  timestamp?: string;
  date?: string;
}

// Entrada del historial
export interface HistoryEntry {
  id: string;
  date: string;
  biopsies: BiopsyForm[];
  doctorInfo: DoctorInfo;
  totalCount: number;
  timestamp: string;
}

// Acción de sincronización
export interface SyncAction {
  id: string;
  type: 'new_biopsy' | 'daily_report';
  biopsy?: BiopsyForm;
  biopsies?: BiopsyForm[];
  doctor: DoctorInfo;
  date: string;
  timestamp: string;
}

// Teclado virtual
export interface VirtualKeyboard {
  isOpen: boolean;
  type: 'numeric' | 'full';
  targetField: string;
  targetValue: string;
}

// Tipos específicos del panel de administrador
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
    giemsaPASMasson: number;
  };
}

export interface AdminRemito {
  id: string;
  medico: string;
  email: string;
  fecha: string;
  hospital: string;
  biopsias: AdminBiopsia[];
  estado: 'pendiente' | 'facturado';
}

export interface AdminConfiguracion {
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