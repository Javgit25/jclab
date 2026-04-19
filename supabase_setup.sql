-- ============================================
-- BIOPSYTRACKER - ESQUEMA DE BASE DE DATOS
-- ============================================

-- 1. CONFIGURACIÓN GLOBAL DE LA APP (Super Admin)
CREATE TABLE app_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  precio_medico NUMERIC DEFAULT 35000,
  app_nombre TEXT DEFAULT 'BiopsyTracker',
  app_version TEXT DEFAULT '2.5.0',
  soporte_telefono TEXT DEFAULT '',
  soporte_email TEXT DEFAULT 'support@biopsytracker.com',
  super_admin_password TEXT DEFAULT 'superadmin2025',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar config inicial
INSERT INTO app_config (id) VALUES ('main') ON CONFLICT DO NOTHING;

-- 2. LABORATORIOS
CREATE TABLE laboratories (
  id TEXT PRIMARY KEY,
  lab_code TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  direccion TEXT DEFAULT '',
  telefono TEXT DEFAULT '',
  email TEXT DEFAULT '',
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido', 'vencido')),
  fecha_alta TIMESTAMPTZ DEFAULT now(),
  fecha_vencimiento TIMESTAMPTZ,
  medicos_activos INTEGER DEFAULT 0,
  admin_user TEXT DEFAULT 'admin',
  admin_password TEXT DEFAULT 'admin123',
  logo_url TEXT DEFAULT '',
  logo_margin_top INTEGER DEFAULT 0,
  info_margin_top INTEGER DEFAULT 0,
  emailjs_config JSONB DEFAULT '{}',
  lab_config JSONB DEFAULT '{}',
  admin_config JSONB DEFAULT '{}',
  historial_pagos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. MÉDICOS REGISTRADOS
CREATE TABLE registered_doctors (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  hospital TEXT DEFAULT '',
  hospitales JSONB DEFAULT '[]',
  whatsapp TEXT DEFAULT '',
  lab_code TEXT NOT NULL REFERENCES laboratories(lab_code),
  password TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  ayudantes JSONB DEFAULT '[]',
  registered_at TIMESTAMPTZ DEFAULT now(),
  profile_changes JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3b. MACROSCOPÍA (Dictado por voz)
CREATE TABLE IF NOT EXISTS macroscopia (
  id TEXT PRIMARY KEY,
  doctor_email TEXT NOT NULL,
  lab_code TEXT NOT NULL,
  numero_paciente TEXT NOT NULL,
  tejido TEXT DEFAULT '',
  remito_number TEXT DEFAULT '',
  transcripcion TEXT NOT NULL DEFAULT '',
  duracion_segundos INTEGER DEFAULT 0,
  dictado_por TEXT DEFAULT '',
  hospital TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_macroscopia_doctor ON macroscopia(doctor_email);
CREATE INDEX IF NOT EXISTS idx_macroscopia_lab ON macroscopia(lab_code);
CREATE INDEX IF NOT EXISTS idx_macroscopia_paciente ON macroscopia(numero_paciente);

-- 3c. SOLICITUDES DE CONTACTO (Landing Page)
CREATE TABLE IF NOT EXISTS contact_requests (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  laboratorio TEXT DEFAULT '',
  telefono TEXT DEFAULT '',
  mensaje TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_doctors_email ON registered_doctors(email);
CREATE INDEX idx_doctors_lab_code ON registered_doctors(lab_code);

-- 4. REMITOS (del admin)
CREATE TABLE remitos (
  id TEXT PRIMARY KEY,
  lab_code TEXT NOT NULL REFERENCES laboratories(lab_code),
  medico TEXT NOT NULL,
  email TEXT NOT NULL,
  doctor_email TEXT,
  hospital TEXT DEFAULT '',
  fecha TIMESTAMPTZ NOT NULL,
  timestamp TIMESTAMPTZ,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'facturado')),
  estado_envio TEXT,
  listo_at TIMESTAMPTZ,
  biopsia_listas JSONB DEFAULT '[]',
  biopsias JSONB NOT NULL DEFAULT '[]',
  modificado_por_admin BOOLEAN DEFAULT false,
  modificado_por_solicitud BOOLEAN DEFAULT false,
  modificado_at TIMESTAMPTZ,
  es_servicio_adicional BOOLEAN DEFAULT false,
  remito_original_id TEXT,
  remito_original_fecha TIMESTAMPTZ,
  nota_servicio_adicional TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_remitos_lab_code ON remitos(lab_code);
CREATE INDEX idx_remitos_email ON remitos(email);
CREATE INDEX idx_remitos_fecha ON remitos(fecha);

-- 5. HISTORIAL DEL MÉDICO (entries de remitos)
CREATE TABLE doctor_history (
  id TEXT PRIMARY KEY,
  doctor_email TEXT NOT NULL,
  lab_code TEXT NOT NULL,
  date TEXT NOT NULL,
  timestamp TIMESTAMPTZ,
  biopsies JSONB NOT NULL DEFAULT '[]',
  doctor_info JSONB NOT NULL DEFAULT '{}',
  total_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_history_doctor ON doctor_history(doctor_email);
CREATE INDEX idx_history_lab ON doctor_history(lab_code);

-- 6. NOTIFICACIONES
CREATE TABLE doctor_notifications (
  id TEXT PRIMARY KEY,
  remito_id TEXT,
  medico_email TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  fecha TIMESTAMPTZ DEFAULT now(),
  leida BOOLEAN DEFAULT false,
  tipo TEXT DEFAULT 'modificacion',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_email ON doctor_notifications(medico_email);

-- 7. PAGOS
CREATE TABLE doctor_payments (
  id TEXT PRIMARY KEY,
  lab_code TEXT NOT NULL REFERENCES laboratories(lab_code),
  medico TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  metodo TEXT DEFAULT 'efectivo',
  fecha TIMESTAMPTZ NOT NULL,
  registrado_por TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_lab ON doctor_payments(lab_code);
CREATE INDEX idx_payments_medico ON doctor_payments(medico);

-- ============================================
-- DESHABILITAR RLS PARA SIMPLICIDAD INICIAL
-- (En producción se configuraría por lab_code)
-- ============================================
ALTER TABLE app_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE laboratories DISABLE ROW LEVEL SECURITY;
ALTER TABLE registered_doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE remitos DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_payments DISABLE ROW LEVEL SECURITY;
