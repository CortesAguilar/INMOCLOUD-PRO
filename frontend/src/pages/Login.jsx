import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../App'
import logoTecNM from '../assets/Logo-TecNM.png'
import logoITT from '../assets/logo_ITT.png'
import cooltextTitle from '../assets/cooltextTitle.png'

export default function Login() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuth()

  async function handleLogin() {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/login', { usuario, password })
      setUser(res.data)           // guarda en memoria (se pierde al refrescar)
      navigate('/', { replace: true })
    } catch (e) {
      setError('Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.logos}>
          <img src={logoTecNM} alt="TecNM" style={styles.logoImg} />
          <img src={logoITT} alt="ITT" style={{ ...styles.logoImg, marginLeft: '20px' }} />
        </div>
        <p style={styles.topBarText}>
          INMOCLOUD PRO es un proyecto escolar de Ingeniería en Sistemas Computacionales
          para el Instituto Tecnológico de Tijuana hecho por Javier Ulises Cortés Aguilar
          en mayo de 2026, no maneja propiedades de renta reales.
        </p>
      </div>

      <div style={styles.container}>
        <div style={styles.left}>
          <div style={styles.overlay}>
            <img
              src={cooltextTitle}
              alt="Gestión Inmobiliaria"
              style={{ width: '100%', maxWidth: '900px', marginBottom: '40px' }}
            />
            <p style={styles.heroTitle}>Administra contratos, pagos y alertas desde un solo lugar.</p>
          </div>
        </div>
        <div style={styles.right}>
          <div style={styles.formBox}>
            <p style={styles.brand}>GESTION INMOBILIARIA</p>
            <h2 style={styles.formTitle}>Bienvenido</h2>
            <p style={styles.formSub}>Inicia sesión para continuar</p>
            <label style={styles.label}>Usuario</label>
            <input style={styles.input} placeholder="Ingresa tu usuario" value={usuario} onChange={e => setUsuario(e.target.value)} />
            <label style={styles.label}>Contraseña</label>
            <input style={styles.input} type="password" placeholder="Ingresa tu contraseña" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            {error && <p style={styles.error}>{error}</p>}
            <button style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
              {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </button>
            <div style={styles.divider} />
            <p style={styles.rolesTitle}>Usuarios de prueba</p>
            <div style={styles.rolesGrid}>
              <code style={styles.code}>admin_principal</code>
              <code style={styles.code}>Admin#2024!</code>
              <code style={styles.code}>operador_01</code>
              <code style={styles.code}>Oper#2024!</code>
              <code style={styles.code}>lector_01</code>
              <code style={styles.code}>Lect#2024!</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const IMG = 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&q=80'

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: 'system-ui, sans-serif',
  },
  container: {
    display: 'flex',
    flex: 1,
  },
  left: {
    flex: 1,
    backgroundImage: `url(${IMG})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(10, 30, 60, 0.62)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '48px',
  },
  heroTitle: {
    color: 'white',
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 12px',
    lineHeight: 1.3,
    maxWidth: '420px',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: '16px',
    margin: 0,
    maxWidth: '380px',
    lineHeight: 1.6,
  },
  right: {
    width: '440px',
    flexShrink: 0,
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 40px',
  },
  formBox: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  brand: {
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    color: '#0f3460',
    margin: '0 0 8px',
  },
  formTitle: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0 0 2px',
  },
  formSub: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 20px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '2px',
  },
  input: {
    padding: '11px 14px',
    borderRadius: '7px',
    border: '1px solid #d0d5dd',
    fontSize: '15px',
    outline: 'none',
    color: '#1a1a2e',
    marginBottom: '6px',
  },
  button: {
    marginTop: '6px',
    padding: '13px',
    borderRadius: '7px',
    border: 'none',
    background: '#0f3460',
    color: 'white',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.01em',
  },
  error: {
    color: '#c0392b',
    fontSize: '13px',
    margin: '0',
  },
  divider: {
    borderTop: '1px solid #eee',
    margin: '8px 0 4px',
  },
  rolesTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#888',
    margin: '0 0 6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  rolesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
  },
  code: {
    fontSize: '12px',
    color: '#0f3460',
    background: '#eef2fa',
    padding: '5px 10px',
    borderRadius: '5px',
    fontFamily: 'monospace',
  },
  topBar: {
    width: '100%',
    height: '100px',
    background: '#41648e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  logos: {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
  },
  logoImg: {
    height: '90px',
    objectFit: 'contain',
  },
  topBarText: {
    color: 'rgb(255, 255, 255)',
    fontSize: '11px',
    maxWidth: '320px',
    textAlign: 'justify',
    lineHeight: 1.5,
    margin: 0,
  },
}