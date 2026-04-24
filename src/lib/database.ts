import { supabase } from './supabase';

// ============================================
// SERVICIO DE BASE DE DATOS
// Cada función lee/escribe en Supabase Y en localStorage (caché offline)
// ============================================

// --- APP CONFIG ---
export const db = {
  // ---- APP CONFIG (Super Admin) ----
  async getAppConfig() {
    try {
      const { data } = await supabase.from('app_config').select('*').eq('id', 'main').single();
      if (data) {
        const config = {
          precioMedico: data.precio_medico,
          appNombre: data.app_nombre,
          appVersion: data.app_version,
          soporteTelefono: data.soporte_telefono,
          soporteEmail: data.soporte_email,
          superAdminPassword: data.super_admin_password,
        };
        localStorage.setItem('superAdmin_config', JSON.stringify(config));
        return config;
      }
    } catch {}
    // Fallback localStorage
    try { return JSON.parse(localStorage.getItem('superAdmin_config') || '{}'); } catch { return {}; }
  },

  async saveAppConfig(config: any) {
    localStorage.setItem('superAdmin_config', JSON.stringify(config));
    try {
      await supabase.from('app_config').upsert({
        id: 'main',
        precio_medico: config.precioMedico,
        app_nombre: config.appNombre,
        app_version: config.appVersion,
        soporte_telefono: config.soporteTelefono,
        soporte_email: config.soporteEmail,
        super_admin_password: config.superAdminPassword,
        updated_at: new Date().toISOString(),
      });
    } catch (e) { console.error('Error saving app config:', e); }
  },

  // ---- LABORATORIES ----
  async getLabs(): Promise<any[]> {
    try {
      const { data } = await supabase.from('laboratories').select('*').order('created_at', { ascending: false });
      if (data && data.length >= 0) {
        const labs = data.map(l => ({
          id: l.id,
          labCode: l.lab_code,
          nombre: l.nombre,
          direccion: l.direccion,
          telefono: l.telefono,
          email: l.email,
          estado: l.estado,
          fechaAlta: l.fecha_alta,
          fechaVencimiento: l.fecha_vencimiento,
          medicosActivos: l.medicos_activos,
          adminUser: l.admin_user,
          adminPassword: l.admin_password,
          logoUrl: l.logo_url,
          logoMarginTop: l.logo_margin_top,
          infoMarginTop: l.info_margin_top,
          emailjsConfig: l.emailjs_config,
          labConfig: l.lab_config,
          adminConfig: l.admin_config,
          adminTecnicos: l.lab_config?.adminTecnicos || [],
          historialPagos: l.historial_pagos,
        }));
        localStorage.setItem('superAdmin_laboratories', JSON.stringify(labs));
        return labs;
      }
    } catch {}
    try { return JSON.parse(localStorage.getItem('superAdmin_laboratories') || '[]'); } catch { return []; }
  },

  async saveLab(lab: any) {
    // Update localStorage
    const labs = JSON.parse(localStorage.getItem('superAdmin_laboratories') || '[]');
    const idx = labs.findIndex((l: any) => l.id === lab.id);
    if (idx >= 0) labs[idx] = lab; else labs.push(lab);
    localStorage.setItem('superAdmin_laboratories', JSON.stringify(labs));

    try {
      await supabase.from('laboratories').upsert({
        id: lab.id,
        lab_code: lab.labCode,
        nombre: lab.nombre,
        direccion: lab.direccion,
        telefono: lab.telefono,
        email: lab.email,
        estado: lab.estado,
        fecha_alta: lab.fechaAlta,
        fecha_vencimiento: lab.fechaVencimiento,
        medicos_activos: lab.medicosActivos,
        admin_user: lab.adminUser,
        admin_password: lab.adminPassword,
        logo_url: lab.logoUrl,
        logo_margin_top: lab.logoMarginTop,
        info_margin_top: lab.infoMarginTop,
        emailjs_config: lab.emailjsConfig,
        lab_config: { ...(lab.labConfig || {}), adminTecnicos: lab.adminTecnicos || [] },
        admin_config: lab.adminConfig,
        historial_pagos: lab.historialPagos,
        updated_at: new Date().toISOString(),
      });
    } catch (e) { console.error('Error saving lab:', e); }
  },

  async saveLabs(labs: any[]) {
    localStorage.setItem('superAdmin_laboratories', JSON.stringify(labs));
    for (const lab of labs) {
      await this.saveLab(lab);
    }
  },

  async deleteLab(id: string) {
    const labs = JSON.parse(localStorage.getItem('superAdmin_laboratories') || '[]').filter((l: any) => l.id !== id);
    localStorage.setItem('superAdmin_laboratories', JSON.stringify(labs));
    try { await supabase.from('laboratories').delete().eq('id', id); } catch {}
  },

  // ---- REGISTERED DOCTORS ----
  async getDoctors(): Promise<any[]> {
    try {
      const { data } = await supabase.from('registered_doctors').select('*').order('registered_at', { ascending: false });
      if (data && data.length >= 0) {
        const doctors = data.map(d => ({
          id: d.id,
          firstName: d.first_name,
          lastName: d.last_name,
          email: d.email,
          hospital: d.hospital,
          hospitales: d.hospitales || [],
          whatsapp: d.whatsapp,
          labCode: d.lab_code,
          password: d.password,
          active: d.active,
          registeredAt: d.registered_at,
          profileChanges: d.profile_changes,
          ayudantes: d.ayudantes || [],
        }));
        localStorage.setItem('registeredDoctors', JSON.stringify(doctors));
        return doctors;
      }
    } catch {}
    try { return JSON.parse(localStorage.getItem('registeredDoctors') || '[]'); } catch { return []; }
  },

  async saveDoctor(doctor: any) {
    const doctors = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
    const idx = doctors.findIndex((d: any) => d.id === doctor.id);
    if (idx >= 0) doctors[idx] = doctor; else doctors.push(doctor);
    localStorage.setItem('registeredDoctors', JSON.stringify(doctors));

    try {
      await supabase.from('registered_doctors').upsert({
        id: doctor.id,
        first_name: doctor.firstName,
        last_name: doctor.lastName,
        email: doctor.email,
        hospital: doctor.hospital,
        hospitales: doctor.hospitales || [],
        whatsapp: doctor.whatsapp,
        lab_code: doctor.labCode,
        password: doctor.password,
        active: doctor.active !== false,
        registered_at: doctor.registeredAt,
        profile_changes: doctor.profileChanges,
        ayudantes: doctor.ayudantes || [],
        updated_at: new Date().toISOString(),
      });
    } catch (e) { console.error('Error saving doctor:', e); }
  },

  // ---- REMITOS ----
  async getRemitos(labCode?: string): Promise<any[]> {
    try {
      let query = supabase.from('remitos').select('*').order('fecha', { ascending: false });
      if (labCode) query = query.eq('lab_code', labCode);
      const { data } = await query;
      if (data && data.length >= 0) {
        const remitos = data.map(r => ({
          id: r.id,
          labCode: r.lab_code,
          medico: r.medico,
          email: r.email,
          doctorEmail: r.doctor_email,
          hospital: r.hospital,
          fecha: r.fecha,
          timestamp: r.timestamp,
          estado: r.estado,
          estadoEnvio: r.estado_envio,
          listoAt: r.listo_at,
          biopsiaListas: r.biopsia_listas,
          biopsias: r.biopsias,
          modificadoPorAdmin: r.modificado_por_admin,
          modificadoPorSolicitud: r.modificado_por_solicitud,
          modificadoAt: r.modificado_at,
          remitoNumber: r.remito_number,
          cargadoPor: r.cargado_por || '',
          esServicioAdicional: r.es_servicio_adicional,
          remitoOriginalId: r.remito_original_id,
          remitoOriginalFecha: r.remito_original_fecha,
          notaServicioAdicional: r.nota_servicio_adicional,
          materialRecibido: r.material_recibido,
          fechaMaterialRecibido: r.fecha_material_recibido,
          impreso: r.impreso,
          fechaImpreso: r.fecha_impreso,
        }));
        localStorage.setItem('adminRemitos', JSON.stringify(remitos));
        return remitos;
      }
    } catch {}
    try { return JSON.parse(localStorage.getItem('adminRemitos') || '[]'); } catch { return []; }
  },

  async saveRemito(remito: any) {
    const remitos = JSON.parse(localStorage.getItem('adminRemitos') || '[]');
    const idx = remitos.findIndex((r: any) => r.id === remito.id);
    if (idx >= 0) remitos[idx] = remito; else remitos.push(remito);
    localStorage.setItem('adminRemitos', JSON.stringify(remitos));

    try {
      await supabase.from('remitos').upsert({
        id: remito.id,
        lab_code: remito.labCode || '',
        medico: remito.medico,
        email: remito.email,
        doctor_email: remito.doctorEmail || remito.email,
        hospital: remito.hospital,
        fecha: remito.fecha,
        timestamp: remito.timestamp,
        estado: remito.estado,
        estado_envio: remito.estadoEnvio,
        listo_at: remito.listoAt,
        biopsia_listas: remito.biopsiaListas,
        biopsias: remito.biopsias,
        modificado_por_admin: remito.modificadoPorAdmin,
        modificado_por_solicitud: remito.modificadoPorSolicitud,
        modificado_at: remito.modificadoAt,
        remito_number: remito.remitoNumber,
        cargado_por: remito.cargadoPor || '',
        es_servicio_adicional: remito.esServicioAdicional,
        remito_original_id: remito.remitoOriginalId,
        remito_original_fecha: remito.remitoOriginalFecha,
        nota_servicio_adicional: remito.notaServicioAdicional,
        material_recibido: remito.materialRecibido || false,
        fecha_material_recibido: remito.fechaMaterialRecibido || null,
        impreso: remito.impreso || false,
        fecha_impreso: remito.fechaImpreso || null,
        updated_at: new Date().toISOString(),
      });
    } catch (e) { console.error('Error saving remito:', e); }
  },

  async saveRemitos(remitos: any[]) {
    localStorage.setItem('adminRemitos', JSON.stringify(remitos));
    for (const r of remitos) {
      await this.saveRemito(r);
    }
  },

  // UPDATE directo: marcar remito como anulado sin pasar por el upsert completo
  // (evita que tipos stale en otros campos hagan fallar el upsert)
  async marcarRemitoAnulado(remitoId: string, notaAnulacion: string) {
    // Actualizar localStorage primero
    try {
      const remitos = JSON.parse(localStorage.getItem('adminRemitos') || '[]');
      const idx = remitos.findIndex((r: any) => r.id === remitoId);
      if (idx >= 0) {
        remitos[idx] = { ...remitos[idx], notaServicioAdicional: notaAnulacion, modificadoPorSolicitud: true, modificadoAt: new Date().toISOString() };
        localStorage.setItem('adminRemitos', JSON.stringify(remitos));
      }
    } catch {}
    // UPDATE directo en Supabase con solo los campos que cambian
    const { error } = await supabase.from('remitos').update({
      nota_servicio_adicional: notaAnulacion,
      modificado_por_solicitud: true,
      modificado_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', remitoId);
    if (error) {
      console.error('❌ Error marcando remito anulado en Supabase:', error);
      throw error;
    }
    console.log('✅ Remito marcado como anulado en Supabase:', remitoId);
  },

  // ---- DOCTOR HISTORY ----
  async getDoctorHistory(doctorEmail: string): Promise<Record<string, any>> {
    try {
      const { data } = await supabase.from('doctor_history').select('*')
        .eq('doctor_email', doctorEmail.toLowerCase().trim())
        .order('created_at', { ascending: false });
      if (data && data.length >= 0) {
        const history: Record<string, any> = {};
        data.forEach(h => {
          history[h.id] = {
            id: h.id,
            remitoNumber: h.remito_number,
            cargadoPor: h.cargado_por || '',
            date: h.date,
            timestamp: h.timestamp,
            biopsies: h.biopsies,
            doctorInfo: h.doctor_info,
            totalCount: h.total_count,
          };
        });
        const key = `doctor_${doctorEmail.toLowerCase().trim().replace(/\s+/g, '')}_history`;
        localStorage.setItem(key, JSON.stringify(history));
        return history;
      }
    } catch {}
    try {
      const key = `doctor_${doctorEmail.toLowerCase().trim().replace(/\s+/g, '')}_history`;
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch { return {}; }
  },

  async saveDoctorHistoryEntry(doctorEmail: string, labCode: string, entry: any) {
    // Save to localStorage
    const key = `doctor_${doctorEmail.toLowerCase().trim().replace(/\s+/g, '')}_history`;
    const history = JSON.parse(localStorage.getItem(key) || '{}');
    history[entry.id] = entry;
    localStorage.setItem(key, JSON.stringify(history));

    try {
      await supabase.from('doctor_history').upsert({
        id: entry.id,
        remito_number: entry.remitoNumber,
        cargado_por: entry.cargadoPor || '',
        doctor_email: doctorEmail.toLowerCase().trim(),
        lab_code: labCode,
        date: entry.date,
        timestamp: entry.timestamp,
        biopsies: entry.biopsies,
        doctor_info: entry.doctorInfo,
        total_count: entry.totalCount || entry.biopsies?.length || 0,
      });
    } catch (e) { console.error('Error saving history:', e); }
  },

  // Actualizar servicios de una biopsia específica en doctor_history
  async updateDoctorBiopsyServices(doctorEmail: string, numeroPaciente: string, remitoNumber: string, updatedServices: any) {
    try {
      const email = doctorEmail.toLowerCase().trim();
      const { data } = await supabase.from('doctor_history').select('*').eq('doctor_email', email);
      if (!data) return false;

      for (const row of data) {
        const rn = row.remito_number || '';
        const matchRemito = remitoNumber && (rn === remitoNumber || row.id?.includes(remitoNumber));
        const biopsies = row.biopsies || [];
        const matchPaciente = biopsies.some((b: any) => b.number === numeroPaciente);

        if (matchRemito || matchPaciente) {
          const bioIdx = biopsies.findIndex((b: any) => b.number === numeroPaciente);
          if (bioIdx >= 0) {
            // Merge servicios
            biopsies[bioIdx].servicios = { ...biopsies[bioIdx].servicios, ...updatedServices };
            await supabase.from('doctor_history').update({ biopsies }).eq('id', row.id);
            // Actualizar localStorage
            const key = `doctor_${email.replace(/\s+/g, '')}_history`;
            try {
              const local = JSON.parse(localStorage.getItem(key) || '{}');
              if (local[row.id]) {
                local[row.id].biopsies = biopsies;
                localStorage.setItem(key, JSON.stringify(local));
              }
            } catch {}
            console.log('✅ updateDoctorBiopsyServices OK:', numeroPaciente);
            return true;
          }
        }
      }
      console.log('⚠️ updateDoctorBiopsyServices: no encontrado', numeroPaciente, remitoNumber);
      return false;
    } catch (e) { console.error('❌ updateDoctorBiopsyServices error:', e); return false; }
  },

  // ---- NOTIFICATIONS ----
  async getNotifications(medicoEmail?: string): Promise<any[]> {
    try {
      let query = supabase.from('doctor_notifications').select('*').order('fecha', { ascending: false });
      if (medicoEmail) query = query.eq('medico_email', medicoEmail.toLowerCase().trim());
      const { data } = await query;
      if (data && data.length >= 0) {
        const notifs = data.map(n => ({
          id: n.id,
          remitoId: n.remito_id,
          medicoEmail: n.medico_email,
          mensaje: n.mensaje,
          fecha: n.fecha,
          leida: n.leida,
          tipo: n.tipo,
        }));
        localStorage.setItem('doctorNotifications', JSON.stringify(notifs));
        return notifs;
      }
    } catch {}
    try { return JSON.parse(localStorage.getItem('doctorNotifications') || '[]'); } catch { return []; }
  },

  async saveNotification(notif: any) {
    const notifs = JSON.parse(localStorage.getItem('doctorNotifications') || '[]');
    const idx = notifs.findIndex((n: any) => n.id === notif.id);
    if (idx >= 0) notifs[idx] = notif; else notifs.push(notif);
    localStorage.setItem('doctorNotifications', JSON.stringify(notifs));

    try {
      await supabase.from('doctor_notifications').upsert({
        id: notif.id,
        remito_id: notif.remitoId,
        medico_email: (notif.medicoEmail || '').toLowerCase().trim(),
        mensaje: notif.mensaje,
        fecha: notif.fecha,
        leida: notif.leida,
        tipo: notif.tipo,
      });
    } catch (e) { console.error('Error saving notification:', e); }
  },

  async markNotificationRead(id: string) {
    const notifs = JSON.parse(localStorage.getItem('doctorNotifications') || '[]');
    const updated = notifs.map((n: any) => n.id === id ? { ...n, leida: true } : n);
    localStorage.setItem('doctorNotifications', JSON.stringify(updated));
    try { await supabase.from('doctor_notifications').update({ leida: true }).eq('id', id); } catch {}
  },

  // ---- PAYMENTS ----
  async getPayments(labCode?: string): Promise<any[]> {
    try {
      let query = supabase.from('doctor_payments').select('*').order('fecha', { ascending: false });
      if (labCode) query = query.eq('lab_code', labCode);
      const { data } = await query;
      if (data && data.length >= 0) {
        const payments = data.map(p => ({
          id: p.id,
          labCode: p.lab_code,
          medico: p.medico,
          monto: p.monto,
          metodo: p.metodo,
          fecha: p.fecha,
          registradoPor: p.registrado_por,
        }));
        localStorage.setItem('doctorPayments', JSON.stringify(payments));
        return payments;
      }
    } catch {}
    try { return JSON.parse(localStorage.getItem('doctorPayments') || '[]'); } catch { return []; }
  },

  async savePayment(payment: any) {
    // Solo guardar en Supabase — localStorage ya fue actualizado por el caller
    try {
      await supabase.from('doctor_payments').upsert({
        id: payment.id,
        lab_code: payment.labCode || '',
        medico: payment.medico,
        monto: payment.monto,
        metodo: payment.metodo,
        fecha: payment.fecha,
        registrado_por: payment.registradoPor,
      });
    } catch (e) { console.error('Error saving payment:', e); }
  },

  // ---- LAB CONFIG (per lab) ----
  async getLabConfig(labCode: string): Promise<any> {
    try {
      const { data } = await supabase.from('laboratories').select('lab_config').eq('lab_code', labCode).single();
      if (data?.lab_config && Object.keys(data.lab_config).length > 0) {
        localStorage.setItem('labConfig', JSON.stringify(data.lab_config));
        return data.lab_config;
      }
    } catch {}
    try { return JSON.parse(localStorage.getItem('labConfig') || '{}'); } catch { return {}; }
  },

  async saveLabConfig(labCode: string, config: any) {
    localStorage.setItem('labConfig', JSON.stringify(config));
    try {
      await supabase.from('laboratories').update({ lab_config: config, updated_at: new Date().toISOString() }).eq('lab_code', labCode);
    } catch {}
  },

  // ---- ADMIN CONFIG (per lab - prices, tissue types) ----
  async getAdminConfig(labCode: string): Promise<any> {
    try {
      const { data } = await supabase.from('laboratories').select('admin_config').eq('lab_code', labCode).single();
      if (data?.admin_config && Object.keys(data.admin_config).length > 0) {
        localStorage.setItem('adminConfig', JSON.stringify(data.admin_config));
        return data.admin_config;
      }
    } catch {}
    try { return JSON.parse(localStorage.getItem('adminConfig') || '{}'); } catch { return {}; }
  },

  async saveAdminConfig(labCode: string, config: any) {
    localStorage.setItem('adminConfig', JSON.stringify(config));
    try {
      await supabase.from('laboratories').update({ admin_config: config, updated_at: new Date().toISOString() }).eq('lab_code', labCode);
    } catch {}
  },

  // ---- SOLICITUDES (tacos, profundizaciones) ----
  async getSolicitudes(doctorEmail?: string, labCode?: string): Promise<any[]> {
    try {
      let query = supabase.from('solicitudes').select('*').order('solicitado_at', { ascending: false });
      if (doctorEmail) query = query.eq('doctor_email', doctorEmail.toLowerCase().trim());
      if (labCode) query = query.eq('lab_code', labCode);
      const { data } = await query;
      if (data && data.length >= 0) {
        const solicitudes = data.map(s => ({
          id: s.id,
          tipo: s.tipo,
          remitoNumber: s.remito_number,
          numeroPaciente: s.numero_paciente,
          tejido: s.tejido,
          cassettesSeleccionados: s.cassettes_seleccionados,
          cassetteLabels: s.cassette_labels,
          descripcion: s.descripcion,
          solicitadoPor: s.solicitado_por,
          solicitadoAt: s.solicitado_at,
          estado: s.estado,
          entregadoAt: s.entregado_at,
          entregadoPor: s.entregado_por,
          doctorEmail: s.doctor_email,
          labCode: s.lab_code,
          notas: s.notas,
        }));
        localStorage.setItem('solicitudes', JSON.stringify(solicitudes));
        return solicitudes;
      }
    } catch {}
    try { return JSON.parse(localStorage.getItem('solicitudes') || '[]'); } catch { return []; }
  },

  async saveSolicitud(sol: any) {
    const solicitudes = JSON.parse(localStorage.getItem('solicitudes') || '[]');
    const idx = solicitudes.findIndex((s: any) => s.id === sol.id);
    if (idx >= 0) solicitudes[idx] = sol; else solicitudes.push(sol);
    localStorage.setItem('solicitudes', JSON.stringify(solicitudes));

    try {
      await supabase.from('solicitudes').upsert({
        id: sol.id,
        tipo: sol.tipo,
        remito_number: sol.remitoNumber,
        numero_paciente: sol.numeroPaciente,
        tejido: sol.tejido,
        cassettes_seleccionados: sol.cassettesSeleccionados,
        cassette_labels: sol.cassetteLabels,
        descripcion: sol.descripcion,
        solicitado_por: sol.solicitadoPor,
        solicitado_at: sol.solicitadoAt,
        estado: sol.estado,
        entregado_at: sol.entregadoAt,
        entregado_por: sol.entregadoPor,
        doctor_email: sol.doctorEmail,
        lab_code: sol.labCode,
        notas: sol.notas,
      });
    } catch (e) { console.error('Error saving solicitud:', e); }
  },
};
