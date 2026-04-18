import React from 'react';

interface LandingPageProps {
  onGoToApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGoToApp }) => {
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
    { name: 'TC', full: 'Taco en Consulta', color: '#b45309', bg: '#fef3c7' }
  ];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#1e293b', overflowX: 'hidden' }}>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)',
        padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🔬</div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>BiopsyTracker</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a href="#funcionalidades" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Funcionalidades</a>
            <a href="#como-funciona" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Cómo funciona</a>
            <a href="#planes" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Planes</a>
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
          <h1 style={{ fontSize: '48px', fontWeight: 800, color: 'white', lineHeight: 1.1, margin: '0 0 20px' }}>
            Gestión de biopsias<br />
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              simple, rápida y profesional
            </span>
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 36px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            Conectamos al médico con el laboratorio en tiempo real. Desde la carga de la biopsia hasta la facturación mensual, todo en un solo sistema.
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
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'white', margin: '0 0 12px' }}>Todo lo que necesitás</h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)' }}>Un sistema completo para cada etapa del proceso</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { icon: '📱', title: 'Tablet del Médico', desc: 'Carga de biopsias desde el consultorio. Sin papel, sin errores.', color: '#60a5fa' },
              { icon: '🖥️', title: 'Panel del Lab', desc: 'Recibí remitos al instante. Gestioná muestras y estados.', color: '#34d399' },
              { icon: '💰', title: 'Facturación', desc: 'Detalle mensual automático por médico y centro médico.', color: '#fbbf24' },
              { icon: '🔔', title: 'Notificaciones', desc: 'El médico sabe cuándo su material llega y cuándo está listo.', color: '#fb923c' },
              { icon: '📊', title: 'Pizarrón Digital', desc: 'Pantalla en tiempo real para TV. Urgentes, pendientes y listos.', color: '#a78bfa' },
              { icon: '📧', title: 'Emails', desc: 'Facturación y recordatorios con diseño profesional por email.', color: '#f87171' },
              { icon: '🎙️', title: 'Dictado por Voz', desc: 'Dictá la macroscopía y se transcribe automáticamente.', color: '#22d3ee' },
              { icon: '🔒', title: 'Multi-laboratorio', desc: 'Cada lab con sus datos, médicos y facturación independientes.', color: '#94a3b8' },
            ].map((f, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.07)', borderRadius: '16px', padding: '28px 20px',
                textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)',
                transition: 'transform 0.2s, background 0.2s',
                backdropFilter: 'blur(4px)'
              }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              >
                <div style={{ fontSize: '44px', marginBottom: '12px', lineHeight: 1 }}>{f.icon}</div>
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
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'white', margin: '0 0 12px' }}>Cómo funciona</h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)' }}>4 pasos simples, desde la biopsia hasta la facturación</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            {workflow.map((w, i) => (
              <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: 800, color: 'white',
                  margin: '0 auto 16px', boxShadow: '0 4px 20px rgba(59,130,246,0.3)'
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
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Diseñado para</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ padding: '32px', borderRadius: '16px', border: '2px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏥</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Laboratorios de Anatomía Patológica</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#475569', lineHeight: 2 }}>
                <li>✓ Recibir remitos digitales al instante</li>
                <li>✓ Gestionar muestras y estados</li>
                <li>✓ Facturación y cobros automatizados</li>
                <li>✓ Pizarrón digital para el lab</li>
                <li>✓ Control de múltiples médicos</li>
                <li>✓ Emails profesionales a cada médico</li>
              </ul>
            </div>
            <div style={{ padding: '32px', borderRadius: '16px', border: '2px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>👨‍⚕️</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Médicos que envían biopsias</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#475569', lineHeight: 2 }}>
                <li>✓ Cargar biopsias desde la tablet</li>
                <li>✓ Múltiples centros médicos</li>
                <li>✓ Notificaciones cuando el estudio está listo</li>
                <li>✓ Historial y búsqueda avanzada</li>
                <li>✓ Estadísticas de su práctica</li>
                <li>✓ Solicitud de tacos y servicios adicionales</li>
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
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', position: 'relative' }}>
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', color: 'white', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Exclusivo para médicos
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', margin: '0 0 16px', lineHeight: 1.2 }}>
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
                  <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: '80px', marginBottom: '16px' }}>🎙️</div>
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
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Simple y accesible</h2>
            <p style={{ fontSize: '16px', color: '#64748b' }}>Sin contratos. Sin instalaciones complicadas. Funciona desde cualquier dispositivo.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ padding: '32px', borderRadius: '16px', border: '2px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Para el laboratorio</div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Panel completo de gestión</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#475569', lineHeight: 2, textAlign: 'left' }}>
                <li>✓ Dashboard en tiempo real</li>
                <li>✓ Gestión de remitos y biopsias</li>
                <li>✓ Facturación y cobros</li>
                <li>✓ Pizarrón digital</li>
                <li>✓ Emails profesionales</li>
                <li>✓ Soporte incluido</li>
              </ul>
            </div>
            <div style={{ padding: '32px', borderRadius: '16px', border: '2px solid #3b82f6', background: '#eff6ff', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: 'white', padding: '4px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>Recomendado</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Para el médico</div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Todo desde su tablet</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#475569', lineHeight: 2, textAlign: 'left' }}>
                <li>✓ Carga de biopsias ilimitada</li>
                <li>✓ Múltiples centros médicos</li>
                <li>✓ Notificaciones en tiempo real</li>
                <li>✓ Historial y búsqueda</li>
                <li>✓ Estadísticas y facturación</li>
                <li>✓ Ayudantes configurables</li>
              </ul>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#94a3b8', marginTop: '24px' }}>
            Consultá por planes y precios escribiendo a <strong>info@biopsytracker.com</strong>
          </p>
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
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>🔬 BiopsyTracker</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>— Software para laboratorios de anatomía patológica</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            © {new Date().getFullYear()} BiopsyTracker. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
