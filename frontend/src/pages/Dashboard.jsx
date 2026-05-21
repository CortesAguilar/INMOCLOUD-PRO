import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../App'
import Propiedades from './Propiedades'
import Alertas from './Alertas'
import Finanzas from './Finanzas'
import Clientes from './Clientes'
import Bitacora from './Bitacora'
import cooltextTitle from '../assets/cooltextTitle.png'


const NAV = [
  { path: '/propiedades', label: '🏢 Propiedades', nombre: 'Propiedades' },
  { path: '/alertas', label: '🔔 Alertas', nombre: 'Alertas' },
  { path: '/finanzas', label: '📊 Finanzas', nombre: 'Finanzas' },
  { path: '/clientes', label: '👥 Clientes', nombre: 'Clientes' },
  { path: '/bitacora', label: '📋 Bitácora', nombre: 'Bitácora' },
]

export default function Dashboard() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tiempo, setTiempo] = useState(new Date())
  const [online, setOnline] = useState(null)
  const [totalAlertas, setTotalAlertas] = useState(0)

  const seccionActiva = NAV.find(item => item.path === location.pathname)?.nombre || 'Dashboard'

  useEffect(() => {
    const tick = setInterval(() => setTiempo(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  const checkAlertas = () => {
    api.get('/alertas')
      .then(res => {
        const keys = ['recibo_luz', 'recibo_agua', 'contratos_por_vencer', 'renta_sin_pagar', 'depto_sin_rentar', 'mantenimiento_excesivo']
        const total = keys.reduce((sum, k) => sum + (res.data[k]?.length || 0), 0)
        setTotalAlertas(total)
      })
      .catch(() => { })
  }

  // Verificar servidor y contar alertas cada 30 s
  useEffect(() => {
    const check = () => {
      api.get('/propiedades')
        .then(() => setOnline(true))
        .catch(() => setOnline(false))
    }
    check()
    checkAlertas()
    const i1 = setInterval(check, 30000)
    const i2 = setInterval(checkAlertas, 60000)
    return () => { clearInterval(i1); clearInterval(i2) }
  }, [])

  function logout() {
    setUser(null)
    navigate('/login', { replace: true })
  }

  const rolColor = {
    admin: '#0f3460',
    operador: '#2d6a4f',
    lector: '#7b4f00',
  }

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <img
            src={cooltextTitle}
            alt="Inmobiliaria"
            style={{ width: '100%', objectFit: 'contain' }}
          />
        </div>

        <div style={styles.reloj}>
          <span style={styles.relojHora}>
            {tiempo.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span style={styles.relojFecha}>
            {tiempo.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        <nav style={styles.nav}>
          {NAV.filter(item => item.path !== '/bitacora' || user?.rol === 'admin').map(item => {
            const activo = location.pathname === item.path
            const esAlertas = item.path === '/alertas'
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.navBtn,
                  background: activo ? 'rgba(255,255,255,0.15)' : 'transparent',
                  position: 'relative',
                }}
              >
                <span>{item.label}</span>
                {esAlertas && totalAlertas > 0 && (
                  <span style={styles.alertaBadge}>
                    {totalAlertas > 99 ? '99+' : totalAlertas}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div style={styles.serverStatus}>
          <span style={{
            ...styles.statusDot,
            background: online === null ? '#aaa' : online ? '#48bb78' : '#e53e3e',
            boxShadow: online ? '0 0 6px #48bb78' : online === false ? '0 0 6px #e53e3e' : 'none',
          }} />
          <span style={styles.statusText}>
            {online === null ? 'Verificando...' : online ? 'Servidor en línea' : 'Servidor desconectado'}
          </span>
        </div>

        <div style={styles.userBox}>
          <div style={{ ...styles.rolTag, background: rolColor[user?.rol] || '#333' }}>
            {user?.rol?.toUpperCase()}
          </div>
          <p style={styles.userName}>{user?.nombre}</p>
          <button style={styles.logoutBtn} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.seccionHeader}>
          <h2 style={styles.seccionTitulo}>{seccionActiva}</h2>
        </div>
        <Routes>
          <Route path="/" element={<Navigate to="/propiedades" replace />} />
          <Route path="/propiedades" element={<Propiedades rol={user?.rol} onAlertasChange={checkAlertas} />} />
          <Route path="/alertas" element={<Alertas onAlertasChange={checkAlertas} />} />
          <Route path="/finanzas" element={<Finanzas />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/bitacora" element={<Bitacora rol={user?.rol} />} />
        </Routes>
      </main>
    </div>
  )
}

const styles = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: '220px',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #0f3460 100%)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    gap: '8px',
    position: 'fixed',
    top: 0, left: 0, bottom: 0,
  },
  brand: {
    padding: '0 8px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  navBtn: {
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 12px',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background 0.2s',
  },
  alertaBadge: {
    background: '#ef4444',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '999px',
    lineHeight: '1.4',
    minWidth: '20px',
    textAlign: 'center',
    boxShadow: '0 0 8px #ef444488',
    animation: 'alertaPulse 2s ease-in-out infinite',
  },
  userBox: {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  rolTag: {
    color: 'white',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 10px',
    borderRadius: '999px',
    alignSelf: 'flex-start',
    letterSpacing: '0.05em',
  },
  userName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: 'white',
    borderRadius: '6px',
    padding: '8px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  main: {
    marginLeft: '220px',
    flex: 1,
    padding: '32px',
  },
  reloj: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 8px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '10px',
    marginBottom: '8px',
    gap: '2px',
  },
  relojHora: {
    color: 'white',
    fontSize: '22px',
    fontWeight: '700',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.05em',
  },
  relojFecha: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '11px',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  serverStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    marginBottom: '4px',
  },
  statusDot: {
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background 0.3s',
  },
  statusText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '11px',
  },
  seccionHeader: {
    marginBottom: '24px',
    borderBottom: '1px solid #e8edf3',
    paddingBottom: '12px',
  },
  seccionTitulo: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
}

// Inyectar keyframe para el badge pulsante
if (typeof document !== 'undefined' && !document.getElementById('dashboard-kf')) {
  const s = document.createElement('style')
  s.id = 'dashboard-kf'
  s.textContent = `
    @keyframes alertaPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.75; transform: scale(1.1); }
    }
  `
  document.head.appendChild(s)
}