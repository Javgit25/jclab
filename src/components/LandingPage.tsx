import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  Tablet, Monitor, DollarSign, Bell, BarChart3, Mail, Mic, Lock,
  Building2, Stethoscope, ClipboardList, Laptop, Wifi, Users, Gift,
  Smartphone, CheckCircle
} from 'lucide-react';

interface LandingPageProps {
  onGoToApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGoToApp }) => {
  // Contadores animados
  const [counts, setCounts] = useState({ biopsias: 0, labs: 0, medicos: 0 });
  const [countsTarget, setCountsTarget] = useState({ biopsias: 0, labs: 0, medicos: 0 });
  const [countsVisible, setCountsVisible] = useState(false);
  const countsRef = useRef<HTMLDivElement>(null);

  // FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Formulario de contacto
  const [contactForm, setContactForm] = useState({ nombre: '', email: '', laboratorio: '', telefono: '', mensaje: '' });
  const [contactSent, setContactSent] = useState(false);

  // Cargar datos reales de Supabase
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [{ count: biopsias }, { count: labs }, { count: medicos }] = await Promise.all([
          supabase.from('remitos').select('*', { count: 'exact', head: true }),
          supabase.from('laboratories').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
          supabase.from('registered_doctors').select('*', { count: 'exact', head: true }).eq('active', true),
        ]);
        setCountsTarget({ biopsias: biopsias || 0, labs: labs || 0, medicos: medicos || 0 });
      } catch {}
    };
    loadCounts();
  }, []);

  // Animación de conteo al hacer scroll
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !countsVisible) setCountsVisible(true);
    }, { threshold: 0.3 });
    if (countsRef.current) observer.observe(countsRef.current);
    return () => observer.disconnect();
  }, [countsVisible]);

  useEffect(() => {
    if (!countsVisible) return;
    const duration = 1500;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCounts({
        biopsias: Math.round(countsTarget.biopsias * ease),
        labs: Math.round(countsTarget.labs * ease),
        medicos: Math.round(countsTarget.medicos * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [countsVisible, countsTarget]);

  const workflow = [
    { step: '1', title: 'El médico carga', desc: 'Desde su tablet, registra cada biopsia con tipo de tejido, cassettes y servicios especiales.' },
    { step: '2', title: 'El lab recibe', desc: 'El remito llega al instante al panel del laboratorio. Se marca como recibido y se procesa.' },
    { step: '3', title: 'Notificación', desc: 'Cuando el estudio está listo, el médico recibe una notificación en su tablet con sonido.' },
    { step: '4', title: 'Facturación', desc: 'A fin de mes, el lab envía la facturación detallada por email con un solo click.' }
  ];

  const tiposEstudio = [
    { name: 'BX', full: 'Biopsia', color: '#166534', bg: '#dcfce7' },
    { name: 'PQ', full: 'Pieza Quirúrgica', color: '#c2410c', bg: '#fed7aa' },
    { name: 'PAP', full: 'Papanicolaou', color: '#be185d', bg: '#fce7f3' },
    { name: 'CITO', full: 'Citología', color: '#7c3aed', bg: '#ede9fe' },
    { name: 'IHQ', full: 'Inmunohistoquímica', color: '#0369a1', bg: '#e0f2fe' },
    { name: 'TC', full: 'Taco en Consulta', color: '#b45309', bg: '#fef3c7' },
    { name: 'CE', full: 'Coloraciones Especiales', color: '#059669', bg: '#d1fae5' }
  ];

  const features = [
    { icon: <Tablet size={32} />, title: 'Tablet del Médico', desc: 'Carga de biopsias desde el laboratorio. Sin papel, sin errores.', color: '#60a5fa' },
    { icon: <Monitor size={32} />, title: 'Panel del Lab', desc: 'Recibí remitos al instante. Gestioná muestras y estados.', color: '#34d399' },
    { icon: <DollarSign size={32} />, title: 'Facturación', desc: 'Detalle mensual automático por médico y centro médico.', color: '#fbbf24' },
    { icon: <Bell size={32} />, title: 'Notificaciones', desc: 'El médico sabe cuándo su material llega y cuándo está listo.', color: '#fb923c' },
    { icon: <BarChart3 size={32} />, title: 'Pizarrón Digital', desc: 'Pantalla en tiempo real de urgentes, pendientes y listos.', color: '#a78bfa' },
    { icon: <Mail size={32} />, title: 'Emails', desc: 'Facturación y recordatorios con diseño profesional por email.', color: '#f87171' },
    { icon: <Mic size={32} />, title: 'Dictado por Voz', desc: 'Dictá la macroscopía y se transcribe automáticamente.', color: '#22d3ee' },
    { icon: <Lock size={32} />, title: 'Multi-laboratorio', desc: 'Cada lab con sus datos, médicos y facturación independientes.', color: '#94a3b8' },
  ];

  const faqsLab = [
    { q: '¿Necesito instalar algo en el laboratorio?', a: 'No. Solo necesitás una PC con navegador web y conexión a internet.', icon: <Laptop size={20} /> },
    { q: '¿Cuántos médicos puedo tener?', a: 'Sin límite. Cada médico con múltiples centros y ayudantes.', icon: <Users size={20} /> },
    { q: '¿Los datos están seguros?', a: 'Sí. Servidores seguros con datos completamente aislados por laboratorio.', icon: <Lock size={20} /> },
    { q: '¿Puedo probarlo gratis?', a: 'Sí. Ofrecemos el primer mes de prueba gratis sin compromiso.', icon: <Gift size={20} /> },
    { q: '¿Puedo cambiar los precios?', a: 'Sí. Los remitos existentes conservan sus precios originales. Los nuevos usan los precios actualizados.', icon: <DollarSign size={20} /> },
    { q: '¿Cómo se envía la facturación?', a: 'Con un click se envía por email a cada médico con detalle profesional.', icon: <Mail size={20} /> },
  ];
  const faqsMedico = [
    { q: '¿Qué necesito para usar la app?', a: 'Se te entrega una tablet configurada lista para usar. Solo ingresás tu email y contraseña.', icon: <Tablet size={20} /> },
    { q: '¿Funciona sin internet?', a: 'Sí. Los datos se guardan localmente y se sincronizan cuando vuelve la conexión.', icon: <Wifi size={20} /> },
    { q: '¿Puedo trabajar en varios centros?', a: 'Sí. Podés configurar múltiples centros médicos y elegir desde cuál trabajás al ingresar.', icon: <Building2 size={20} /> },
    { q: '¿Cómo sé cuando mi estudio está listo?', a: 'Recibís una notificación con sonido en la tablet cuando el laboratorio marca tu estudio como listo.', icon: <Bell size={20} /> },
    { q: '¿Qué es el dictado por voz?', a: 'Podés dictar la macroscopía mientras trabajás y se transcribe automáticamente. Queda guardado en la nube.', icon: <Mic size={20} /> },
    { q: '¿Puedo solicitar servicios adicionales?', a: 'Sí. Podés pedir tacos, profundizaciones y coloraciones especiales desde la tablet.', icon: <Stethoscope size={20} /> },
  ];

  const counterItems = [
    { value: counts.biopsias, label: 'Remitos procesados', icon: <ClipboardList size={32} />, gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
    { value: counts.labs, label: 'Laboratorios activos', icon: <Building2 size={32} />, gradient: 'linear-gradient(135deg, #10b981, #3b82f6)' },
    { value: counts.medicos, label: 'Médicos registrados', icon: <Stethoscope size={32} />, gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#1e293b', overflowX: 'hidden' }}>

      {/* Responsive styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .landing-nav-links {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
        }
        .landing-nav-link {
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }
        .landing-nav-link:hover {
          color: white;
        }
        .landing-macro-btn {
          background: rgba(255,255,255,0.1);
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .landing-hero-title {
          font-size: 48px;
          font-weight: 800;
          color: white;
          line-height: 1.1;
          margin: 0 0 20px;
        }
        .landing-hero-sub {
          font-size: 18px;
          color: rgba(255,255,255,0.7);
          line-height: 1.6;
          margin: 0 0 36px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        .landing-features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .landing-workflow-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .landing-para-quien-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .landing-dictado-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }
        .landing-planes-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          max-width: 700px;
          margin: 0 auto;
        }
        .landing-counters-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          text-align: center;
        }
        .landing-counter-value {
          font-size: 48px;
          font-weight: 800;
          line-height: 1;
        }
        .landing-contact-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .landing-tipos-flex {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .landing-footer-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .landing-section-title {
          font-size: 36px;
          font-weight: 800;
          margin: 0 0 12px;
        }
        .landing-dictado-title {
          font-size: 32px;
          font-weight: 800;
          color: white;
          margin: 0 0 16px;
          line-height: 1.2;
        }

        @media (max-width: 768px) {
          .landing-nav-links {
            display: none !important;
          }
          .landing-macro-btn {
            display: none !important;
          }
          .landing-hero-title {
            font-size: 28px !important;
          }
          .landing-hero-sub {
            font-size: 15px !important;
          }
          .landing-features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .landing-workflow-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .landing-para-quien-grid {
            grid-template-columns: 1fr !important;
          }
          .landing-dictado-grid {
            grid-template-columns: 1fr !important;
          }
          .landing-planes-grid {
            grid-template-columns: 1fr !important;
          }
          .landing-counters-grid {
            grid-template-columns: 1fr !important;
          }
          .landing-counter-value {
            font-size: 36px !important;
          }
          .landing-contact-row {
            grid-template-columns: 1fr !important;
          }
          .landing-section-title {
            font-size: 26px !important;
          }
          .landing-dictado-title {
            font-size: 24px !important;
          }
          .landing-tipos-flex {
            gap: 8px;
          }
          .landing-footer-inner {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)',
        padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img src={`${import.meta.env.BASE_URL}assets/biopsytracker_logo_recortado.svg`} alt="BiopsyTracker" style={{ height: '60px', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div className="landing-nav-links">
            <a href="#funcionalidades" className="landing-nav-link">Funcionalidades</a>
            <a href="#como-funciona" className="landing-nav-link">Cómo funciona</a>
            <a href="#planes" className="landing-nav-link">Planes</a>
            <a href="#contacto" className="landing-nav-link">Contacto</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
            <button
              className="landing-macro-btn"
              onClick={() => { const url = window.location.origin + window.location.pathname + '?macro='; const code = prompt('Ingresá el código de tu laboratorio:'); if (code) window.location.href = url + code.toUpperCase(); }}
            >
              <Mic size={14} /> Macroscopía
            </button>
            <button onClick={onGoToApp} style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
              border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '14px',
              fontWeight: 700, cursor: 'pointer'
            }}>
              Ingresar
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1e40af 100%)',
        padding: '140px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-block', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', color: '#93c5fd', fontWeight: 600, marginBottom: '24px' }}>
            Software para Laboratorios de Anatomía Patológica
          </div>
          <h1 className="landing-hero-title">
            Gestión de biopsias<br />
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              simple, rápida y profesional
            </span>
          </h1>
          <p className="landing-hero-sub">
            Conectamos al médico patólogo con el laboratorio en tiempo real. Desde la carga de la biopsia hasta la facturación mensual, todo en un solo sistema.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onGoToApp} style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
              border: 'none', padding: '14px 32px', borderRadius: '10px', fontSize: '16px',
              fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(37,99,235,0.4)'
            }}>
              Comenzar ahora
            </button>
            <a href="#como-funciona" style={{
              background: 'rgba(255,255,255,0.1)', color: 'white',
              border: '1px solid rgba(255,255,255,0.2)', padding: '14px 32px', borderRadius: '10px',
              fontSize: '16px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none'
            }}>
              Ver cómo funciona
            </a>
          </div>
        </div>
      </section>

      {/* Tipos de estudio */}
      <section style={{ background: '#f8fafc', padding: '40px 24px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>Tipos de estudio soportados</p>
          <div className="landing-tipos-flex">
            {tiposEstudio.map((t, i) => (
              <div key={i} style={{ background: t.bg, color: t.color, padding: '8px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '14px' }}>
                {t.name} <span style={{ fontWeight: 400, fontSize: '12px', opacity: 0.8 }}>— {t.full}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="landing-section-title" style={{ color: 'white' }}>Todo lo que necesitás</h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)' }}>Un sistema completo para cada etapa del proceso</p>
          </div>
          <div className="landing-features-grid">
            {features.map((f, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.07)', borderRadius: '16px', padding: '28px 20px',
                textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)',
                transition: 'transform 0.2s, background 0.2s',
                backdropFilter: 'blur(4px)'
              }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              >
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center', color: f.color }}>{f.icon}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: f.color, marginBottom: '6px' }}>{f.title}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" style={{ padding: '80px 24px', background: '#0f172a' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="landing-section-title" style={{ color: 'white' }}>Cómo funciona</h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)' }}>4 pasos simples, desde la biopsia hasta la facturación</p>
          </div>
          <div className="landing-workflow-grid">
            {workflow.map((w, i) => (
              <div key={i} style={{ textAlign: 'center', position: 'relative', cursor: 'default', transition: 'transform 0.3s ease' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: 800, color: 'white',
                  margin: '0 auto 16px', boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
                  transition: 'box-shadow 0.3s ease'
                }}>{w.step}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: '0 0 8px' }}>{w.title}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quién */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="landing-section-title" style={{ color: '#0f172a' }}>Diseñado para</h2>
          </div>
          <div className="landing-para-quien-grid">
            <div style={{ padding: '32px', borderRadius: '16px', border: '2px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ marginBottom: '12px', color: '#3b82f6' }}><Building2 size={40} /></div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Laboratorios de Anatomía Patológica</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#475569', lineHeight: 2 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Recibir remitos digitales al instante</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Gestionar muestras y estados</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Facturación y cobros automatizados</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Pizarrón digital para el lab</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Control de múltiples médicos</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Emails profesionales a cada médico</li>
              </ul>
            </div>
            <div style={{ padding: '32px', borderRadius: '16px', border: '2px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ marginBottom: '12px', color: '#8b5cf6' }}><Stethoscope size={40} /></div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Médicos Patólogos</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#475569', lineHeight: 2 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Cargar biopsias desde la tablet</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Dictado por voz de macroscopía</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Múltiples centros médicos</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Notificaciones cuando el estudio está listo</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Historial y búsqueda avanzada</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Solicitud de tacos y servicios adicionales</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios especiales */}
      <section style={{ padding: '60px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 24px' }}>Servicios especiales incluidos</h2>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Cassette Urgente 24hs', 'Corte en Blanco', 'Corte IHQ', 'Giemsa / PAS / Masson', 'Profundización', 'Taco en Consulta', 'Citología PAAF', 'Citología Líquidos'].map((s, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, color: '#1e40af' }}>
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destacado: Dictado por voz */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #1e3a5f 0%, #7c3aed 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="landing-dictado-grid" style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', color: 'white', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Exclusivo para médicos
            </div>
            <h2 className="landing-dictado-title">
              Dictado por voz para<br />macroscopía
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, margin: '0 0 24px' }}>
              Olvidate de tipear. Dictá la descripción macroscópica directamente desde la tablet y queda registrada en la nube, asociada a cada biopsia.
            </p>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 24px' }}>
              Muchos médicos pagan un servicio de dictado por separado. Con BiopsyTracker, el dictado viene incluido y queda vinculado al paciente y al remito.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Dictá y se transcribe automáticamente', 'Queda guardado en la nube para siempre', 'Accedé desde cualquier dispositivo', 'Sin costo extra — incluido en el plan'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'white' }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle size={14} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', color: 'white' }}><Mic size={64} /></div>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Grabando...</span>
                </div>
                <p style={{ fontSize: '14px', color: 'white', fontStyle: 'italic', margin: 0, textAlign: 'left', lineHeight: 1.6 }}>
                  "Fragmento de tejido gástrico antral de 0.3 cm, superficie lisa, coloración blanquecina..."
                </p>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Se transcribe en tiempo real y se guarda automáticamente</div>
            </div>
          </div>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="landing-section-title" style={{ color: '#0f172a' }}>Simple y accesible</h2>
            <p style={{ fontSize: '16px', color: '#64748b' }}>Sin contratos. Sin instalaciones complicadas. Funciona desde cualquier dispositivo.</p>
          </div>
          <div className="landing-planes-grid">
            <div style={{ padding: '32px', borderRadius: '16px', border: '2px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Para el laboratorio</div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Panel completo de gestión</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#475569', lineHeight: 2, textAlign: 'left' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Dashboard en tiempo real</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Gestión de remitos y biopsias</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Facturación y cobros</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Pizarrón digital</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Emails profesionales</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Soporte incluido</li>
              </ul>
            </div>
            <div style={{ padding: '32px', borderRadius: '16px', border: '2px solid #e2e8f0', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Para el médico</div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Todo desde su tablet</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#475569', lineHeight: 2, textAlign: 'left' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Carga de biopsias ilimitada</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Múltiples centros médicos</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Notificaciones en tiempo real</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Historial y búsqueda</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Estadísticas y facturación</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} /> Ayudantes configurables</li>
              </ul>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#94a3b8', marginTop: '24px' }}>
            Consultá por planes y precios escribiendo a <strong>info@biopsytracker.com</strong>
          </p>
        </div>
      </section>

      {/* Contador animado */}
      <section ref={countsRef} style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle at 30% 70%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="landing-counters-grid" style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
          {counterItems.map((c, i) => (
            <div key={i} style={{
              padding: '32px 20px', borderRadius: '20px',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(4px)',
              transform: countsVisible ? 'translateY(0)' : 'translateY(30px)',
              opacity: countsVisible ? 1 : 0,
              transition: `all 0.6s ease ${i * 0.15}s`
            }}>
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center', color: 'rgba(255,255,255,0.7)' }}>{c.icon}</div>
              <div className="landing-counter-value" style={{
                background: c.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                {c.value > 0 ? c.value.toLocaleString() : '—'}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{c.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f0fdfa 100%)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="landing-section-title" style={{ color: '#0f172a' }}>Preguntas frecuentes</h2>
            <p style={{ fontSize: '15px', color: '#64748b' }}>Todo lo que necesitás saber antes de empezar</p>
          </div>
          <div className="landing-para-quien-grid">
            {/* FAQ Laboratorio */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Building2 size={18} style={{ color: '#2563eb' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px' }}>Para el Laboratorio</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {faqsLab.map((faq, i) => {
                  const key = 'lab_' + i;
                  const isOpen = openFaq === i;
                  return (
                    <div key={key} style={{ background: isOpen ? 'white' : 'rgba(255,255,255,0.7)', borderRadius: '10px', overflow: 'hidden', border: isOpen ? '2px solid #2563eb' : '1px solid rgba(0,0,0,0.06)', transition: 'all 0.3s ease' }}>
                      <button onClick={() => setOpenFaq(isOpen ? null : i)} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ flexShrink: 0, color: isOpen ? '#2563eb' : '#64748b', display: 'flex' }}>{faq.icon}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: isOpen ? '#2563eb' : '#1e293b', flex: 1 }}>{faq.q}</span>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: isOpen ? '#2563eb' : '#f1f5f9', color: isOpen ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'all 0.3s' }}>+</span>
                      </button>
                      <div style={{ maxHeight: isOpen ? '200px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease', padding: isOpen ? '0 16px 12px 46px' : '0 16px 0 46px' }}>
                        <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{faq.a}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* FAQ Médico */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Stethoscope size={18} style={{ color: '#7c3aed' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '1px' }}>Para el Médico</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {faqsMedico.map((faq, i) => {
                  const key = 'med_' + i;
                  const idx = i + 100;
                  const isOpen = openFaq === idx;
                  return (
                    <div key={key} style={{ background: isOpen ? 'white' : 'rgba(255,255,255,0.7)', borderRadius: '10px', overflow: 'hidden', border: isOpen ? '2px solid #7c3aed' : '1px solid rgba(0,0,0,0.06)', transition: 'all 0.3s ease' }}>
                      <button onClick={() => setOpenFaq(isOpen ? null : idx)} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ flexShrink: 0, color: isOpen ? '#7c3aed' : '#64748b', display: 'flex' }}>{faq.icon}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: isOpen ? '#7c3aed' : '#1e293b', flex: 1 }}>{faq.q}</span>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: isOpen ? '#7c3aed' : '#f1f5f9', color: isOpen ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'all 0.3s' }}>+</span>
                      </button>
                      <div style={{ maxHeight: isOpen ? '200px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease', padding: isOpen ? '0 16px 12px 46px' : '0 16px 0 46px' }}>
                        <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{faq.a}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario de contacto */}
      <section id="contacto" style={{ padding: '80px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Solicitá una demo</h2>
            <p style={{ fontSize: '15px', color: '#64748b' }}>Dejanos tus datos y nos ponemos en contacto para mostrarte el sistema</p>
          </div>
          {contactSent ? (
            <div style={{ background: '#dcfce7', border: '2px solid #86efac', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center', color: '#22c55e' }}><CheckCircle size={48} /></div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>Mensaje enviado</div>
              <div style={{ fontSize: '14px', color: '#15803d' }}>Nos pondremos en contacto a la brevedad.</div>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <div className="landing-contact-row">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Nombre *</label>
                  <input type="text" value={contactForm.nombre} onChange={e => setContactForm(p => ({ ...p, nombre: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="Tu nombre" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Email *</label>
                  <input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="tu@email.com" />
                </div>
              </div>
              <div className="landing-contact-row">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Laboratorio</label>
                  <input type="text" value={contactForm.laboratorio} onChange={e => setContactForm(p => ({ ...p, laboratorio: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="Nombre del laboratorio" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Teléfono</label>
                  <input type="tel" value={contactForm.telefono} onChange={e => setContactForm(p => ({ ...p, telefono: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="Tu teléfono" />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Mensaje</label>
                <textarea value={contactForm.mensaje} onChange={e => setContactForm(p => ({ ...p, mensaje: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                  placeholder="Contanos sobre tu laboratorio o consultá lo que necesites" />
              </div>
              <button
                onClick={async () => {
                  if (!contactForm.nombre.trim() || !contactForm.email.trim()) { alert('Completá nombre y email'); return; }
                  try {
                    await supabase.from('contact_requests').insert({
                      nombre: contactForm.nombre.trim(),
                      email: contactForm.email.trim(),
                      laboratorio: contactForm.laboratorio.trim(),
                      telefono: contactForm.telefono.trim(),
                      mensaje: contactForm.mensaje.trim(),
                      created_at: new Date().toISOString()
                    });
                    // Enviar notificación por email
                    try {
                      // Cargar config de EmailJS desde el primer lab
                      if (!localStorage.getItem('emailjsConfig')) {
                        const { data: labs } = await supabase.from('laboratories').select('emailjs_config').eq('estado', 'activo').limit(1);
                        if (labs?.[0]?.emailjs_config) localStorage.setItem('emailjsConfig', JSON.stringify(labs[0].emailjs_config));
                      }
                      const { sendEmail, isEmailConfigured } = await import('../utils/emailService');
                      if (isEmailConfigured()) {
                        await sendEmail({
                          toEmail: 'info@biopsytracker.io',
                          toName: 'BiopsyTracker',
                          subject: 'Nueva consulta desde la web — ' + contactForm.nombre.trim(),
                          messageHtml: '<div style="font-family:Arial,sans-serif;max-width:500px;">' +
                            '<h2 style="color:#0f172a;">Nueva consulta desde la web</h2>' +
                            '<p><strong>Nombre:</strong> ' + contactForm.nombre.trim() + '</p>' +
                            '<p><strong>Email:</strong> ' + contactForm.email.trim() + '</p>' +
                            (contactForm.laboratorio.trim() ? '<p><strong>Laboratorio:</strong> ' + contactForm.laboratorio.trim() + '</p>' : '') +
                            (contactForm.telefono.trim() ? '<p><strong>Teléfono:</strong> ' + contactForm.telefono.trim() + '</p>' : '') +
                            (contactForm.mensaje.trim() ? '<p><strong>Mensaje:</strong> ' + contactForm.mensaje.trim() + '</p>' : '') +
                            '<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />' +
                            '<p style="color:#94a3b8;font-size:12px;">Enviado desde biopsytracker.io</p></div>',
                          fromName: 'BiopsyTracker Web',
                        });
                      }
                    } catch {}
                  } catch {}
                  setContactSent(true);
                }}
                style={{
                  width: '100%', padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px',
                  fontWeight: 700, cursor: 'pointer'
                }}
              >
                Enviar solicitud
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Final */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', margin: '0 0 16px' }}>Modernizá tu laboratorio hoy</h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 32px' }}>
            Sin instalaciones, sin contratos largos. Empezá a usar BiopsyTracker en minutos.
          </p>
          <button onClick={onGoToApp} style={{
            background: 'white', color: '#1e40af',
            border: 'none', padding: '16px 40px', borderRadius: '12px', fontSize: '16px',
            fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            Comenzar ahora
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', padding: '32px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="landing-footer-inner" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={`${import.meta.env.BASE_URL}assets/biopsytracker_logo_recortado.svg`} alt="BiopsyTracker" style={{ height: '36px', filter: 'brightness(0) invert(1)' }} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>— Software para laboratorios de anatomía patológica</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            &copy; {new Date().getFullYear()} BiopsyTracker. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
