-- Migración: Agregar columna hospitales a registered_doctors
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2026-04-15

-- Agregar columna hospitales (array JSON de centros médicos)
ALTER TABLE registered_doctors ADD COLUMN IF NOT EXISTS hospitales JSONB DEFAULT '[]';

-- Migrar datos existentes: si el doctor tiene hospital, copiarlo a hospitales
UPDATE registered_doctors
SET hospitales = jsonb_build_array(hospital)
WHERE hospital IS NOT NULL AND hospital != '' AND (hospitales IS NULL OR hospitales = '[]'::jsonb);
