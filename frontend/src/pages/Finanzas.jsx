import { useState, useEffect, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import api from '../api'

// ─── Paleta coherente con el resto del sistema ────────────────────────────────
const C = {
  ingreso:  '#10b981',
  gasto:    '#ef4444',
  saldo:    '#3b82f6',
  neutro:   '#94a3b8',
  fondo:    '#f7f9fc',
  borde:    '#e8edf3',
  texto:    '#1a1a2e',
  subtexto: '#64748b',
}

const MESES_ES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  return Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
function fmtDecimal(n) {
  return Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Tooltip personalizado ────────────────────────────────────────────────────
function TooltipCustom({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: `1px solid ${C.borde}`, borderRadius: 10,
      padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      fontSize: 13,
    }}>
      <p style={{ fontWeight: 700, color: C.texto, margin: '0 0 8px' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ margin: '3px 0', color: p.color, fontWeight: 600 }}>
          {p.name}: <span style={{ color: C.texto }}>${fmt(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icono, label, valor, sub, color, grande }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: grande ? '22px 24px' : '18px 20px',
      border: `1px solid ${C.borde}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column', gap: 6,
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: grande ? 26 : 22 }}>{icono}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.subtexto,
                       textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: grande ? 32 : 24, fontWeight: 800, color, lineHeight: 1 }}>
        ${fmt(valor)}
      </p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: C.subtexto }}>{sub}</p>}
    </div>
  )
}

// ─── Pill de ocupación ────────────────────────────────────────────────────────
function OcupacionCard({ resumen }) {
  const { total_deptos, deptos_rentados, deptos_promocion, deptos_mantenimiento, tasa_ocupacion } = resumen
  const pct = tasa_ocupacion || 0
  const color = pct >= 80 ? C.ingreso : pct >= 50 ? '#f59e0b' : C.gasto

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '18px 20px',
      border: `1px solid ${C.borde}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>🏢</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.subtexto,
                       textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Ocupación
        </span>
      </div>

      {/* Barra de progreso */}
      <div style={{ background: C.fondo, borderRadius: 999, height: 10, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 999,
          background: color, transition: 'width 0.6s ease',
        }} />
      </div>

      <p style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>
        {pct}%
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Rentados',      val: deptos_rentados,     color: C.ingreso },
          { label: 'En promoción',  val: deptos_promocion,    color: '#f59e0b' },
          { label: 'Mantenimiento', val: deptos_mantenimiento,color: C.gasto   },
          { label: 'Total',         val: total_deptos,        color: C.subtexto},
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: item.color }}>{item.val}</p>
            <p style={{ margin: 0, fontSize: 10, color: C.subtexto, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Selector de año ──────────────────────────────────────────────────────────
function SelectorAnio({ anios, anio, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button
        onClick={() => onChange(null)}
        style={{
          padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
          border: `1.5px solid ${anio === null ? C.saldo : C.borde}`,
          background: anio === null ? '#eff6ff' : '#fff',
          color: anio === null ? C.saldo : C.subtexto,
          fontWeight: anio === null ? 700 : 500,
        }}
      >
        Todos
      </button>
      {anios.map(a => (
        <button
          key={a}
          onClick={() => onChange(a)}
          style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
            border: `1.5px solid ${anio === a ? C.saldo : C.borde}`,
            background: anio === a ? '#eff6ff' : '#fff',
            color: anio === a ? C.saldo : C.subtexto,
            fontWeight: anio === a ? 700 : 500,
          }}
        >
          {a}
        </button>
      ))}
    </div>
  )
}

// ─── Tabla de propiedades ─────────────────────────────────────────────────────
function TablaPropiedades({ datos }) {
  const [orden, setOrden] = useState('ingresos')

  const sorted = [...datos].sort((a, b) => b[orden] - a[orden])
  const max = Math.max(...datos.map(d => d.ingresos), 1)

  const cols = [
    { key: 'ingresos',  label: 'Ingresos',   color: C.ingreso },
    { key: 'gastos',    label: 'Gastos',      color: C.gasto   },
    { key: 'saldo_neto',label: 'Saldo neto',  color: C.saldo   },
  ]

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${C.borde}` }}>
            <th style={th}>Propiedad</th>
            {cols.map(c => (
              <th key={c.key} style={{ ...th, cursor: 'pointer', color: orden === c.key ? c.color : C.subtexto }}
                  onClick={() => setOrden(c.key)}>
                {c.label} {orden === c.key ? '↓' : '↕'}
              </th>
            ))}
            <th style={th}>Participación</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.id_propiedad}
                style={{ background: i % 2 === 0 ? '#fff' : C.fondo, borderBottom: `1px solid ${C.borde}` }}>
              <td style={td}>
                <span style={{ fontWeight: 600, color: C.texto }}>🏢 {row.propiedad}</span>
              </td>
              <td style={{ ...td, color: C.ingreso, fontWeight: 600 }}>${fmt(row.ingresos)}</td>
              <td style={{ ...td, color: C.gasto,   fontWeight: 600 }}>${fmt(row.gastos)}</td>
              <td style={{
                ...td, fontWeight: 700,
                color: row.saldo_neto >= 0 ? C.ingreso : C.gasto,
              }}>
                {row.saldo_neto >= 0 ? '+' : ''}${fmt(row.saldo_neto)}
              </td>
              <td style={td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, background: C.fondo, borderRadius: 999, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(row.ingresos / max * 100).toFixed(1)}%`,
                      height: '100%', background: C.ingreso, borderRadius: 999,
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: C.subtexto, minWidth: 36, textAlign: 'right' }}>
                    {max > 0 ? (row.ingresos / max * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const th = {
  textAlign: 'left', padding: '10px 12px', fontSize: 11,
  fontWeight: 700, color: '#64748b', textTransform: 'uppercase',
  letterSpacing: '0.05em', whiteSpace: 'nowrap',
}
const td = { padding: '12px 12px', verticalAlign: 'middle' }

// ─── Sección wrapper ──────────────────────────────────────────────────────────
function Seccion({ titulo, children, accion }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '20px 22px',
      border: `1px solid ${C.borde}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 700, color: '#0f3460',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          {titulo}
        </p>
        {accion}
      </div>
      {children}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Finanzas() {
  const [resumen,       setResumen]       = useState(null)
  const [flujoMensual,  setFlujoMensual]  = useState([])
  const [porPropiedad,  setPorPropiedad]  = useState([])
  const [cargando,      setCargando]      = useState(true)
  const [anioFiltro,    setAnioFiltro]    = useState(null)

  const cargar = async () => {
    setCargando(true)
    try {
      const [r1, r2, r3] = await Promise.all([
        api.get('/finanzas/resumen'),
        api.get('/finanzas/flujo-mensual'),
        api.get('/finanzas/por-propiedad'),
      ])
      setResumen(r1.data)
      setFlujoMensual(r2.data)
      setPorPropiedad(r3.data)
    } catch (e) {
      console.error('Error cargando finanzas:', e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  // Años disponibles para el filtro
  const aniosDisponibles = useMemo(() =>
    [...new Set(flujoMensual.map(d => d.anio))].sort(), [flujoMensual])

  // Datos filtrados por año seleccionado
  const datosFlujo = useMemo(() =>
    anioFiltro ? flujoMensual.filter(d => d.anio === anioFiltro) : flujoMensual,
    [flujoMensual, anioFiltro])

  // Totales del periodo filtrado (para los KPIs de la gráfica)
  const totalesPeriodo = useMemo(() => ({
    ingresos: datosFlujo.reduce((s, d) => s + d.ingresos, 0),
    gastos:   datosFlujo.reduce((s, d) => s + d.gastos, 0),
    saldo:    datosFlujo.reduce((s, d) => s + d.saldo, 0),
  }), [datosFlujo])

  // ── Render ─────────────────────────────────────────────────────────────────
  if (cargando) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{
          height: i === 1 ? 110 : 280, borderRadius: 14,
          background: '#f0f4f8',
          animation: 'pulse 1.4s ease-in-out infinite',
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
    </div>
  )

  if (!resumen) return <p style={{ color: '#aaa' }}>No se pudieron cargar los datos.</p>

  return (
    <div>
      {/* ── KPIs globales ──────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 14, marginBottom: 20,
      }}>
        <KpiCard
          icono="💰" label="Ingresos totales"
          valor={resumen.total_ingresos} color={C.ingreso}
          sub="Suma de todos los pagos de renta"
        />
        <KpiCard
          icono="📤" label="Gastos totales"
          valor={resumen.total_gastos} color={C.gasto}
          sub="Deptos + propiedades"
        />
        <KpiCard
          icono="📊" label="Saldo neto"
          valor={resumen.saldo_neto}
          color={resumen.saldo_neto >= 0 ? C.ingreso : C.gasto}
          sub={resumen.saldo_neto >= 0 ? 'Balance positivo ✓' : 'Balance negativo ⚠'}
        />
        <OcupacionCard resumen={resumen} />
      </div>

      {/* ── Flujo mensual ─────────────────────────────────────────────── */}
      <Seccion
        titulo="📈 Flujo mensual — Ingresos vs Gastos"
        accion={
          <SelectorAnio
            anios={aniosDisponibles}
            anio={anioFiltro}
            onChange={setAnioFiltro}
          />
        }
      >
        {/* Mini KPIs del periodo */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Ingresos periodo', val: totalesPeriodo.ingresos, color: C.ingreso },
            { label: 'Gastos periodo',   val: totalesPeriodo.gastos,   color: C.gasto   },
            { label: 'Saldo periodo',    val: totalesPeriodo.saldo,    color: C.saldo   },
          ].map(item => (
            <div key={item.label} style={{
              background: C.fondo, borderRadius: 10, padding: '10px 16px',
              borderLeft: `3px solid ${item.color}`,
            }}>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: C.subtexto,
                          textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {item.label}
              </p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: item.color }}>
                {item.val >= 0 ? '' : '-'}${fmt(Math.abs(item.val))}
              </p>
            </div>
          ))}
        </div>

        {datosFlujo.length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: '40px 0' }}>
            Sin datos para el periodo seleccionado.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={datosFlujo} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIngreso" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.ingreso} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.ingreso} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradGasto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.gasto} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.gasto} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borde} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.subtexto }}
                     interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: C.subtexto }}
                     tickFormatter={v => `$${fmt(v)}`} width={80} />
              <Tooltip content={<TooltipCustom />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area type="monotone" dataKey="ingresos" name="Ingresos"
                    stroke={C.ingreso} strokeWidth={2.5}
                    fill="url(#gradIngreso)" dot={false} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="gastos" name="Gastos"
                    stroke={C.gasto} strokeWidth={2.5}
                    fill="url(#gradGasto)" dot={false} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Seccion>

      {/* ── Saldo neto por mes (barras) ───────────────────────────────── */}
      {datosFlujo.length > 0 && (
        <Seccion titulo="📊 Saldo neto mensual">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={datosFlujo} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borde} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.subtexto }}
                     interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: C.subtexto }}
                     tickFormatter={v => `$${fmt(v)}`} width={80} />
              <Tooltip content={<TooltipCustom />} />
              <ReferenceLine y={0} stroke={C.neutro} strokeDasharray="4 4" />
              <Bar dataKey="saldo" name="Saldo neto" radius={[4, 4, 0, 0]}>
                {datosFlujo.map((entry, i) => (
                  <Cell key={i} fill={entry.saldo >= 0 ? C.ingreso : C.gasto} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: C.subtexto, textAlign: 'center' }}>
            🟢 Meses con balance positivo · 🔴 Meses con balance negativo
          </p>
        </Seccion>
      )}

      {/* ── Por propiedad ─────────────────────────────────────────────── */}
      {porPropiedad.length > 0 && (
        <>
          <Seccion titulo="🏢 Ingresos vs Gastos por propiedad">
            <ResponsiveContainer width="100%" height={Math.max(200, porPropiedad.length * 60)}>
              <BarChart
                data={porPropiedad}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={C.borde} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: C.subtexto }}
                       tickFormatter={v => `$${fmt(v)}`} />
                <YAxis type="category" dataKey="propiedad"
                       tick={{ fontSize: 12, fill: C.texto, fontWeight: 600 }}
                       width={140} />
                <Tooltip content={<TooltipCustom />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ingresos" name="Ingresos" fill={C.ingreso} radius={[0, 4, 4, 0]} />
                <Bar dataKey="gastos"   name="Gastos"   fill={C.gasto}   radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Seccion>

          <Seccion titulo="📋 Detalle por propiedad">
            <TablaPropiedades datos={porPropiedad} />
          </Seccion>
        </>
      )}

      {porPropiedad.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 20px', background: '#fff',
          borderRadius: 14, border: `1px solid ${C.borde}`,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.texto, margin: '0 0 6px' }}>
            Sin datos financieros aún
          </p>
          <p style={{ fontSize: 13, color: C.subtexto, margin: 0 }}>
            Los reportes aparecerán cuando haya pagos y gastos registrados.
          </p>
        </div>
      )}
    </div>
  )
}