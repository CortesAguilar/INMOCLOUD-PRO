import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

// ─── Paleta de colores por tipo de alerta ─────────────────────────────────────
const CFG = {
  recibo_luz: {
    icono:     '💡',
    titulo:    'Recibos de luz vencidos',
    color:     '#b45309',
    bg:        '#fef3c7',
    border:    '#fde68a',
    badgeBg:   '#f59e0b',
    badgeText: '#fff',
    desc:      (a) => `Depto ${a.departamento} — ${a.propiedad}`,
    sub:       (a) => `$${Number(a.monto).toLocaleString('es-MX')} · Venció hace ${a.dias_vencido ?? '?'} días`,
    getId:     (a) => a.id_departamento,
  },
  recibo_agua: {
    icono:     '💧',
    titulo:    'Recibos de agua vencidos',
    color:     '#1d4ed8',
    bg:        '#eff6ff',
    border:    '#bfdbfe',
    badgeBg:   '#3b82f6',
    badgeText: '#fff',
    desc:      (a) => `Depto ${a.departamento} — ${a.propiedad}`,
    sub:       (a) => `$${Number(a.monto).toLocaleString('es-MX')} · Venció hace ${a.dias_vencido ?? '?'} días`,
    getId:     (a) => a.id_departamento,
  },
  contratos_por_vencer: {
    icono:     '📋',
    titulo:    'Contratos próximos a vencer',
    color:     '#7c3aed',
    bg:        '#f5f3ff',
    border:    '#ddd6fe',
    badgeBg:   '#7c3aed',
    badgeText: '#fff',
    desc:      (a) => `Depto ${a.departamento} — ${a.propiedad}`,
    sub:       (a) => `Vence en ${a.dias_para_vencer} días · ${a.cliente}`,
    getId:     (a) => a.id_departamento,
  },
  renta_sin_pagar: {
    icono:     '💸',
    titulo:    'Rentas sin pagar este mes',
    color:     '#dc2626',
    bg:        '#fff1f2',
    border:    '#fecdd3',
    badgeBg:   '#ef4444',
    badgeText: '#fff',
    desc:      (a) => `Depto ${a.departamento} — ${a.propiedad}`,
    sub:       (a) => `$${Number(a.renta_mensual).toLocaleString('es-MX')}/mes · ${a.cliente}`,
    getId:     (a) => a.id_departamento,
  },
  depto_sin_rentar: {
    icono:     '🏠',
    titulo:    'Departamentos sin rentar',
    color:     '#059669',
    bg:        '#ecfdf5',
    border:    '#a7f3d0',
    badgeBg:   '#10b981',
    badgeText: '#fff',
    desc:      (a) => `Depto ${a.numero} — ${a.propiedad}`,
    sub:       (a) => `${a.estado_depto} · ${a.dias_sin_rentar} días sin inquilino`,
    getId:     (a) => a.id_departamento,
  },
  mantenimiento_excesivo: {
    icono:     '🔧',
    titulo:    'Mantenimiento excesivo en contrato activo',
    color:     '#b45309',
    bg:        '#fff7ed',
    border:    '#fed7aa',
    badgeBg:   '#f97316',
    badgeText: '#fff',
    desc:      (a) => `Depto ${a.departamento} — ${a.propiedad}`,
    sub:       (a) => `${a.total_mantenimientos} gastos de mantenimiento · ${a.cliente}`,
    getId:     (a) => a.id_departamento,
  },
}

// ─── Orden de secciones ───────────────────────────────────────────────────────
const SECCIONES = [
  'renta_sin_pagar',
  'recibo_luz',
  'recibo_agua',
  'contratos_por_vencer',
  'depto_sin_rentar',
  'mantenimiento_excesivo',
]

// ─── Tarjeta individual de alerta ─────────────────────────────────────────────
function AlertaCard({ alerta, cfg, onClickAlerta }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onClickAlerta(alerta, cfg)}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '14px',
        padding:        '14px 16px',
        borderRadius:   '10px',
        border:         `1.5px solid ${hover ? cfg.color + '60' : cfg.border}`,
        background:     hover ? cfg.bg : '#fff',
        cursor:         'pointer',
        transition:     'all 0.16s ease',
        transform:      hover ? 'translateX(4px)' : 'none',
        boxShadow:      hover ? `0 4px 16px ${cfg.color}18` : '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Ícono */}
      <div style={{
        width:          '40px',
        height:         '40px',
        borderRadius:   '10px',
        background:     cfg.bg,
        border:         `1px solid ${cfg.border}`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '20px',
        flexShrink:     0,
      }}>
        {cfg.icono}
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin:     '0 0 2px',
          fontSize:   '13px',
          fontWeight: '600',
          color:      '#1a1a2e',
          whiteSpace: 'nowrap',
          overflow:   'hidden',
          textOverflow: 'ellipsis',
        }}>
          {cfg.desc(alerta)}
        </p>
        <p style={{
          margin:   0,
          fontSize: '12px',
          color:    '#888',
        }}>
          {cfg.sub(alerta)}
        </p>
      </div>

      {/* Flecha */}
      <span style={{
        fontSize:   '16px',
        color:      hover ? cfg.color : '#ccc',
        transition: 'color 0.16s',
        flexShrink: 0,
      }}>
        →
      </span>
    </div>
  )
}

// ─── Sección de un tipo de alerta ─────────────────────────────────────────────
function SeccionAlertas({ tipo, alertas, onClickAlerta }) {
  const cfg      = CFG[tipo]
  const count    = alertas?.length || 0
  const sinItems = count === 0
  const [expandida, setExpandida] = useState(false)

  return (
    <div style={{
      background:   '#fff',
      borderRadius: '14px',
      border:       `1px solid #f0f0f0`,
      overflow:     'hidden',
      boxShadow:    '0 2px 8px rgba(0,0,0,0.06)',
      opacity:      sinItems ? 0.6 : 1,
    }}>
      {/* Header de sección */}
      <button
        onClick={() => setExpandida(e => !e)}
        style={{
          width:          '100%',
          display:        'flex',
          alignItems:     'center',
          gap:            '12px',
          padding:        '16px 20px',
          background:     'none',
          border:         'none',
          borderBottom:   expandida ? `1px solid #f5f5f5` : 'none',
          cursor:         'pointer',
          textAlign:      'left',
        }}
      >
        <span style={{ fontSize: '22px' }}>{cfg.icono}</span>
        <span style={{
          flex:       1,
          fontSize:   '14px',
          fontWeight: '700',
          color:      sinItems ? '#aaa' : cfg.color,
        }}>
          {cfg.titulo}
        </span>
        {/* Badge conteo — gris si es 0, color normal si hay alertas */}
        <span style={{
          background:   sinItems ? '#e5e7eb' : cfg.badgeBg,
          color:        sinItems ? '#6b7280' : cfg.badgeText,
          fontSize:     '12px',
          fontWeight:   '700',
          padding:      '3px 10px',
          borderRadius: '999px',
          minWidth:     '28px',
          textAlign:    'center',
        }}>
          {count}
        </span>
        {/* Chevron */}
        <span style={{
          fontSize:   '12px',
          color:      '#aaa',
          transform:  expandida ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 0.2s',
          marginLeft: '4px',
        }}>
          ▼
        </span>
      </button>

      {/* Lista de alertas o mensaje vacío */}
      {expandida && (
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           '8px',
          padding:       '12px 16px 16px',
        }}>
          {sinItems ? (
            <p style={{
              margin:    0,
              fontSize:  '13px',
              color:     '#aaa',
              textAlign: 'center',
              padding:   '8px 0',
            }}>
              ✓ Sin alertas en esta categoría
            </p>
          ) : (
            alertas.map((a, i) => (
              <AlertaCard
                key={i}
                alerta={a}
                cfg={cfg}
                onClickAlerta={onClickAlerta}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Resumen total ─────────────────────────────────────────────────────────────
function ResumenTotal({ alertas, onRefrescar, cargando }) {
  const total = SECCIONES.reduce((sum, k) => sum + (alertas[k]?.length || 0), 0)

  const items = SECCIONES
    .filter(k => alertas[k]?.length > 0)
    .map(k => ({ cfg: CFG[k], count: alertas[k].length }))

  return (
    <div style={{
      background:     'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
      borderRadius:   '16px',
      padding:        '24px 28px',
      marginBottom:   '24px',
      color:          '#fff',
      display:        'flex',
      alignItems:     'center',
      gap:            '24px',
      flexWrap:       'wrap',
    }}>
      {/* Total */}
      <div style={{ flex: 1, minWidth: '160px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Alertas activas
        </p>
        <p style={{ margin: 0, fontSize: '42px', fontWeight: '800', lineHeight: 1, color: total > 0 ? '#fbbf24' : '#4ade80' }}>
          {cargando ? '—' : total}
        </p>
        {total === 0 && !cargando && (
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#4ade80' }}>¡Todo en orden! ✓</p>
        )}
      </div>

      {/* Mini chips por tipo */}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {items.map(({ cfg, count }) => (
            <span key={cfg.titulo} style={{
              background:   'rgba(255,255,255,0.12)',
              border:       '1px solid rgba(255,255,255,0.18)',
              borderRadius: '8px',
              padding:      '6px 12px',
              fontSize:     '12px',
              display:      'flex',
              alignItems:   'center',
              gap:          '6px',
              color:        '#fff',
            }}>
              <span>{cfg.icono}</span>
              <span style={{ fontWeight: '700' }}>{count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Botón refrescar */}
      <button
        onClick={onRefrescar}
        disabled={cargando}
        style={{
          background:   'rgba(255,255,255,0.12)',
          border:       '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          color:        '#fff',
          padding:      '10px 16px',
          fontSize:     '13px',
          cursor:       cargando ? 'default' : 'pointer',
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
          opacity:      cargando ? 0.6 : 1,
          transition:   'background 0.15s',
          flexShrink:   0,
        }}
      >
        <span style={{
          display:   'inline-block',
          animation: cargando ? 'spin 1s linear infinite' : 'none',
        }}>
          🔄
        </span>
        {cargando ? 'Actualizando…' : 'Actualizar'}
      </button>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Alertas({ onAlertasChange }) {
  const [alertas,  setAlertas]  = useState({})
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  const cargar = () => {
    setCargando(true)
    api.get('/alertas')
      .then(res => { setAlertas(res.data); onAlertasChange?.() })
      .catch(() => setAlertas({}))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  // Al hacer clic en una alerta, navegamos a /propiedades pasando el id_departamento
  // en el state de React Router para que Propiedades.jsx lo reciba y abra el depto.
  const handleClickAlerta = (alerta, cfg) => {
    const idDepto = cfg.getId(alerta)
    if (!idDepto) return
    navigate('/propiedades', {
      state: { abrirDepartamento: idDepto },
    })
  }

  const totalAlertas = SECCIONES.reduce((sum, k) => sum + (alertas[k]?.length || 0), 0)

  return (
    <div>
      {/* Resumen */}
      <ResumenTotal
        alertas={alertas}
        onRefrescar={cargar}
        cargando={cargando}
      />

      {/* Nota informativa */}
      <p style={{
        fontSize:     '13px',
        color:        '#888',
        marginBottom: '20px',
        background:   '#f7f9fc',
        borderRadius: '8px',
        padding:      '10px 14px',
        borderLeft:   '3px solid #0f3460',
      }}>
        💡 Haz clic en cualquier alerta para ir directamente al departamento correspondiente.
      </p>

      {/* Estado de carga */}
      {cargando && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              background:   '#fff',
              borderRadius: '14px',
              height:       '80px',
              border:       '1px solid #f0f0f0',
              animation:    'pulse 1.4s ease-in-out infinite',
            }} />
          ))}
        </div>
      )}

      {/* Secciones — siempre visibles, colapsadas si no tienen alertas */}
      {!cargando && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {SECCIONES.map(tipo => (
            <SeccionAlertas
              key={tipo}
              tipo={tipo}
              alertas={alertas[tipo]}
              onClickAlerta={handleClickAlerta}
            />
          ))}
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}