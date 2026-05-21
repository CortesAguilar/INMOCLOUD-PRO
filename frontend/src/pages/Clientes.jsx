import { useState, useEffect, useMemo } from 'react'
import api from '../api'
import ModalNuevoCliente from '../components/propiedades/ModalNuevoCliente'

// ─── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  primario:  '#0f3460',
  acento:    '#0d6efd',
  verde:     '#10b981',
  rojo:      '#ef4444',
  amarillo:  '#f59e0b',
  fondo:     '#f7f9fc',
  borde:     '#e8edf3',
  texto:     '#1a1a2e',
  subtexto:  '#64748b',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtFecha(str) {
  if (!str) return '—'
  const s = String(str).slice(0, 10)
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-MX')
}

function fmtMonto(n) {
  return Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0 })
}

function calcularEdad(fechaNac) {
  if (!fechaNac) return null
  const s = String(fechaNac).slice(0, 10)
  const [y, m, d] = s.split('-').map(Number)
  const nac = new Date(y, m - 1, d)
  const hoy = new Date()
  let edad = hoy.getFullYear() - nac.getFullYear()
  if ((hoy.getMonth() - nac.getMonth() || hoy.getDate() - nac.getDate()) < 0) edad--
  return edad
}

function nombreCompleto(c) {
  return [c.nombre, c.segundo_nombre, c.apellido_paterno, c.apellido_materno]
    .filter(Boolean).join(' ')
}

function inicialesDe(c) {
  const n = (c.nombre || '').charAt(0)
  const a = (c.apellido_paterno || '').charAt(0)
  return (n + a).toUpperCase()
}

// ─── Avatar con iniciales ─────────────────────────────────────────────────────
function Avatar({ cliente, size = 44 }) {
  const colores = ['#6366f1','#0d6efd','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4']
  const color = colores[cliente.id_cliente % colores.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 800, flexShrink: 0,
      letterSpacing: '-0.02em',
    }}>
      {inicialesDe(cliente)}
    </div>
  )
}

// ─── Badge de estado ──────────────────────────────────────────────────────────
function BadgeActivo({ activo }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
      background: activo ? '#d1fae5' : C.fondo,
      color:      activo ? C.verde   : C.subtexto,
      border:     `1px solid ${activo ? '#6ee7b7' : C.borde}`,
    }}>
      {activo ? '● Contrato activo' : '○ Sin contrato'}
    </span>
  )
}

// ─── Tarjeta de cliente en la lista ──────────────────────────────────────────
function ClienteCard({ cliente, onClick }) {
  const [hover, setHover] = useState(false)
  const edad = calcularEdad(cliente.fecha_nacimiento)
  const generoLabel = cliente.genero === 'M' ? 'Masculino' : cliente.genero === 'F' ? 'Femenino' : null

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#fff', borderRadius: 12, padding: '16px 18px',
        border: `1.5px solid ${hover ? C.acento + '60' : C.borde}`,
        cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: hover ? `0 6px 20px rgba(13,110,253,0.1)` : '0 1px 4px rgba(0,0,0,0.05)',
        transform: hover ? 'translateY(-1px)' : 'none',
        display: 'flex', gap: 14, alignItems: 'center',
      }}
    >
      <Avatar cliente={cliente} size={48} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 14,
                      color: C.texto, whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis' }}>
            {nombreCompleto(cliente)}
          </p>
          <BadgeActivo activo={!!cliente.tiene_activo} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: C.subtexto }}>
            📱 {cliente.telefono}
          </span>
          {edad && (
            <span style={{ fontSize: 12, color: C.subtexto }}>
              🎂 {edad} años
            </span>
          )}
          {generoLabel && (
            <span style={{ fontSize: 12, color: C.subtexto }}>
              {cliente.genero === 'M' ? '♂' : '♀'} {generoLabel}
            </span>
          )}
          <span style={{ fontSize: 12, color: C.subtexto }}>
            #{cliente.id_cliente}
          </span>
        </div>
      </div>

      <span style={{ fontSize: 16, color: hover ? C.acento : '#ccc', transition: 'color 0.15s' }}>
        →
      </span>
    </div>
  )
}

// ─── Modal de perfil ──────────────────────────────────────────────────────────
function ModalPerfil({ clienteBase, onClose }) {
  const [perfil,   setPerfil]   = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api.get(`/clientes/${clienteBase.id_cliente}/perfil`)
      .then(r => setPerfil(r.data))
      .catch(() => setPerfil(null))
      .finally(() => setCargando(false))
  }, [clienteBase.id_cliente])

  const edad = calcularEdad(clienteBase.fecha_nacimiento)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620,
          maxHeight: '88vh', overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header con avatar */}
        <div style={{
          background: `linear-gradient(135deg, ${C.primario} 0%, #1e4a7a 100%)`,
          borderRadius: '16px 16px 0 0', padding: '24px 24px 20px',
          display: 'flex', gap: 16, alignItems: 'center',
          position: 'relative',
        }}>
          <Avatar cliente={clienteBase} size={64} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#fff' }}>
              {nombreCompleto(clienteBase)}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                📱 {clienteBase.telefono}
              </span>
              {edad && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                  🎂 {edad} años
                </span>
              )}
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                Cliente #{clienteBase.id_cliente}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: 8, color: '#fff', width: 32, height: 32,
              cursor: 'pointer', fontSize: 16, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {cargando ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[80, 120, 160].map(h => (
                <div key={h} style={{
                  height: h, borderRadius: 10, background: C.fondo,
                  animation: 'pulse 1.4s ease-in-out infinite',
                }} />
              ))}
            </div>
          ) : !perfil ? (
            <p style={{ color: C.subtexto }}>No se pudo cargar el perfil.</p>
          ) : (
            <>
              {/* Stats rápidas */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 10, marginBottom: 20,
              }}>
                {[
                  { icono: '📋', label: 'Contratos',      val: perfil.stats.num_contratos,                          color: C.acento  },
                  { icono: '💰', label: 'Total pagado',   val: `$${fmtMonto(perfil.stats.total_pagado)}`,           color: C.verde   },
                  { icono: '📅', label: 'Registrado',     val: fmtFecha(clienteBase.fecha_registro),                color: C.subtexto},
                  { icono: '⚡', label: 'Estado',          val: perfil.stats.tiene_activo ? 'Activo' : 'Inactivo',  color: perfil.stats.tiene_activo ? C.verde : C.subtexto },
                ].map(item => (
                  <div key={item.label} style={{
                    background: C.fondo, borderRadius: 10, padding: '12px 14px',
                    borderLeft: `3px solid ${item.color}`,
                  }}>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: C.subtexto,
                                textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {item.icono} {item.label}
                    </p>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: item.color }}>
                      {item.val}
                    </p>
                  </div>
                ))}
              </div>

              {/* Contrato activo destacado */}
              {perfil.stats.tiene_activo && perfil.stats.contrato_activo && (
                <div style={{
                  background: '#f0fdf4', border: `1.5px solid #86efac`,
                  borderRadius: 12, padding: '14px 16px', marginBottom: 20,
                }}>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700,
                               color: C.verde, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ● Contrato activo
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 13 }}>
                    {[
                      ['Propiedad',  `${perfil.stats.contrato_activo.propiedad} — Depto ${perfil.stats.contrato_activo.departamento}`],
                      ['Renta',      `$${fmtMonto(perfil.stats.contrato_activo.renta_mensual)}/mes`],
                      ['Inicio',     fmtFecha(perfil.stats.contrato_activo.fecha_inicio)],
                      ['Vence',      fmtFecha(perfil.stats.contrato_activo.fecha_fin_programada)],
                      ['Total pagado', `$${fmtMonto(perfil.stats.contrato_activo.total_pagado)}`],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <span style={{ color: C.subtexto }}>{label}: </span>
                        <span style={{ fontWeight: 600, color: C.texto }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historial de contratos */}
              <p style={{
                margin: '0 0 12px', fontSize: 12, fontWeight: 700,
                color: C.primario, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                📋 Historial de contratos
              </p>

              {perfil.contratos.length === 0 ? (
                <p style={{ color: C.subtexto, fontSize: 13 }}>Sin contratos registrados.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {perfil.contratos.map(c => {
                    const esActivo = c.estado === 'activo'
                    const rentaMeses = c.num_pagos
                    return (
                      <div key={c.id_contrato_renta} style={{
                        background: esActivo ? '#f0fdf4' : C.fondo,
                        border: `1px solid ${esActivo ? '#86efac' : C.borde}`,
                        borderRadius: 10, padding: '12px 14px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                                      alignItems: 'flex-start', marginBottom: 6 }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 13, color: C.texto }}>
                              🏢 {c.propiedad} — Depto {c.departamento}
                            </span>
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                            background: esActivo ? '#d1fae5' : '#f1f5f9',
                            color: esActivo ? C.verde : C.subtexto,
                          }}>
                            {esActivo ? 'Activo' : 'Finalizado'}
                          </span>
                        </div>

                        <div style={{
                          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                          gap: '3px 16px', fontSize: 12, color: C.subtexto,
                        }}>
                          <span>📅 {fmtFecha(c.fecha_inicio)} → {fmtFecha(esActivo ? c.fecha_fin_programada : c.fecha_fin_real)}</span>
                          <span>💵 ${fmtMonto(c.renta_mensual)}/mes</span>
                          <span>💰 Pagado: ${fmtMonto(c.total_pagado)}</span>
                          <span>🧾 {rentaMeses} pago{rentaMeses !== 1 ? 's' : ''}</span>
                          {c.monto_deposito && (
                            <span>🔒 Depósito: ${fmtMonto(c.monto_deposito)}</span>
                          )}
                          {c.monto_devuelto != null && (
                            <span>↩ Devuelto: ${fmtMonto(c.monto_devuelto)}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Clientes() {
  const [clientes,         setClientes]         = useState([])
  const [cargando,         setCargando]         = useState(true)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [modalNuevoCliente,   setModalNuevoCliente]   = useState(false)

  // Filtros
  const [busqueda,  setBusqueda]  = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')  // 'todos' | 'activo' | 'inactivo'
  const [filtroGenero, setFiltroGenero] = useState('todos')  // 'todos' | 'M' | 'F'
  const [ordenCampo,   setOrdenCampo]   = useState('apellido_paterno')
  const [ordenDir,     setOrdenDir]     = useState('asc')

  const cargar = async () => {
    setCargando(true)
    try {
      // vista_contratos_activos incluye cr.id_cliente tras el fix en vistas.sql
      const [rCli, rContratos] = await Promise.all([
        api.get('/clientes'),
        api.get('/contratos'),
      ])
      const idsConActivo = new Set(
        rContratos.data.map(c => c.id_cliente).filter(Boolean)
      )
      const enriquecidos = rCli.data.map(c => ({
        ...c,
        tiene_activo: idsConActivo.has(c.id_cliente),
      }))
      setClientes(enriquecidos)
    } catch (e) {
      console.error('Error cargando clientes:', e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  // Filtrado + ordenamiento
  const clientesFiltrados = useMemo(() => {
    const b = busqueda.toLowerCase()
    return clientes
      .filter(c => {
        if (filtroEstado === 'activo'   && !c.tiene_activo) return false
        if (filtroEstado === 'inactivo' && c.tiene_activo)  return false
        if (filtroGenero !== 'todos' && c.genero !== filtroGenero) return false
        if (!b) return true
        return (
          nombreCompleto(c).toLowerCase().includes(b) ||
          (c.telefono || '').includes(b)              ||
          String(c.id_cliente).includes(b)
        )
      })
      .sort((a, b) => {
        const va = String(a[ordenCampo] || '').toLowerCase()
        const vb = String(b[ordenCampo] || '').toLowerCase()
        return ordenDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      })
  }, [clientes, busqueda, filtroEstado, filtroGenero, ordenCampo, ordenDir])

  const totalActivos = clientes.filter(c => c.tiene_activo).length

  const handleClienteCreado = (nuevoCliente) => {
    // Añadir a la lista local con tiene_activo = false (recién creado, sin contrato)
    setClientes(prev => [...prev, { ...nuevoCliente, tiene_activo: false }])
    setModalNuevoCliente(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Fila superior: botón nuevo cliente */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => setModalNuevoCliente(true)}
          style={{
            padding: '9px 18px', borderRadius: 8, border: 'none',
            background: C.primario, color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Nuevo cliente
        </button>
      </div>

      {/* Resumen */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12, marginBottom: 20,
      }}>
        {[
          { icono: '👥', label: 'Total clientes',  val: clientes.length,                  color: C.acento  },
          { icono: '✅', label: 'Con contrato',    val: totalActivos,                     color: C.verde   },
          { icono: '💤', label: 'Sin contrato',    val: clientes.length - totalActivos,   color: C.subtexto},
        ].map(item => (
          <div key={item.label} style={{
            background: '#fff', borderRadius: 12, padding: '16px 18px',
            border: `1px solid ${C.borde}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            borderLeft: `4px solid ${item.color}`,
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: C.subtexto,
                        textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {item.icono} {item.label}
            </p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: item.color }}>
              {cargando ? '—' : item.val}
            </p>
          </div>
        ))}
      </div>

      {/* Barra de filtros */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '14px 16px',
        border: `1px solid ${C.borde}`, marginBottom: 16,
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Búsqueda */}
        <input
          style={{
            flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8,
            border: `1px solid ${C.borde}`, fontSize: 13, outline: 'none',
          }}
          placeholder="🔍 Buscar por nombre, teléfono o ID..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          autoFocus
        />

        {/* Estado */}
        {['todos','activo','inactivo'].map(v => (
          <button key={v} onClick={() => setFiltroEstado(v)} style={{
            padding: '7px 13px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
            border: `1.5px solid ${filtroEstado === v ? C.acento : C.borde}`,
            background: filtroEstado === v ? '#eff6ff' : '#fff',
            color: filtroEstado === v ? C.acento : C.subtexto,
            fontWeight: filtroEstado === v ? 700 : 500,
          }}>
            {v === 'todos' ? 'Todos' : v === 'activo' ? '● Con contrato' : '○ Sin contrato'}
          </button>
        ))}

        {/* Género */}
        {[['todos','Todos'],['M','♂ Masc.'],['F','♀ Fem.']].map(([v, lbl]) => (
          <button key={v} onClick={() => setFiltroGenero(v)} style={{
            padding: '7px 13px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
            border: `1.5px solid ${filtroGenero === v ? C.primario : C.borde}`,
            background: filtroGenero === v ? '#eef2fa' : '#fff',
            color: filtroGenero === v ? C.primario : C.subtexto,
            fontWeight: filtroGenero === v ? 700 : 500,
          }}>
            {lbl}
          </button>
        ))}

        {/* Orden */}
        <select
          style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.borde}`,
                   fontSize: 12, background: '#fff', cursor: 'pointer' }}
          value={ordenCampo}
          onChange={e => setOrdenCampo(e.target.value)}
        >
          <option value="apellido_paterno">Apellido</option>
          <option value="nombre">Nombre</option>
          <option value="fecha_registro">Fecha registro</option>
          <option value="id_cliente">ID</option>
        </select>
        <button
          onClick={() => setOrdenDir(d => d === 'asc' ? 'desc' : 'asc')}
          style={{
            padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
            border: `1px solid ${C.borde}`, background: '#fff', color: C.subtexto,
          }}
        >
          {ordenDir === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>

        {/* Contador */}
        <span style={{ fontSize: 12, color: C.subtexto, marginLeft: 'auto' }}>
          {clientesFiltrados.length} de {clientes.length}
        </span>
      </div>

      {/* Lista */}
      {cargando ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{
              height: 76, borderRadius: 12, background: '#f0f4f8',
              animation: 'pulse 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.08}s`,
            }} />
          ))}
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px', background: '#fff',
          borderRadius: 14, border: `1px solid ${C.borde}`,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.texto, margin: '0 0 6px' }}>
            {clientes.length === 0 ? 'Sin clientes registrados' : 'Sin resultados'}
          </p>
          <p style={{ fontSize: 13, color: C.subtexto, margin: 0 }}>
            {clientes.length === 0
              ? 'Los clientes se crean al registrar un contrato de renta.'
              : 'Prueba con otros filtros.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {clientesFiltrados.map(c => (
            <ClienteCard
              key={c.id_cliente}
              cliente={c}
              onClick={() => setClienteSeleccionado(c)}
            />
          ))}
        </div>
      )}

      {/* Modal de perfil */}
      {clienteSeleccionado && (
        <ModalPerfil
          clienteBase={clienteSeleccionado}
          onClose={() => setClienteSeleccionado(null)}
        />
      )}

      {/* Modal nuevo cliente */}
      {modalNuevoCliente && (
        <ModalNuevoCliente
          onClienteCreado={handleClienteCreado}
          onClose={() => setModalNuevoCliente(false)}
        />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
    </div>
  )
}