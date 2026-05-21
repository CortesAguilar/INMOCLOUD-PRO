import { useState } from 'react'
import { Modal } from '../ui'
import { fmtFecha } from './depto.utils'
import s from '../../../styles/propiedades'

// ─── Modal del historial ──────────────────────────────────────────────────────
function ModalHistorial({ historial, loadingHistorial, onCargarHistorial, onClose }) {
  // Carga lazy: si no se ha cargado todavía, disparar al montar
  const [cargando, setCargando] = useState(false)

  const disparar = async () => {
    if (historial !== null) return   // ya cargado
    setCargando(true)
    await onCargarHistorial()
    setCargando(false)
  }

  // Cargar al abrir el modal si todavía no hay datos
  // (usamos un ref-like trick con useState para que solo se llame una vez)
  const [disparado, setDisparado] = useState(false)
  if (!disparado) {
    setDisparado(true)
    disparar()
  }

  const mostrandoCarga = loadingHistorial || cargando

  return (
    <Modal titulo="🗂 Historial de contratos" onClose={onClose} ancho="600px">
      {mostrandoCarga ? (
        <p style={{ color: '#888', fontSize: '14px' }}>Cargando historial...</p>
      ) : !historial?.length ? (
        <p style={{ color: '#aaa', fontSize: '14px' }}>Sin contratos anteriores.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {historial.map(c => (
            <div
              key={c.id_contrato_renta}
              style={{
                background: '#f7f9fc',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '4px 16px',
                alignItems: 'start',
              }}
            >
              {/* Nombre */}
              <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#1a1a2e', gridColumn: '1 / -1' }}>
                {c.cliente_nombre} {c.apellido_paterno} {c.apellido_materno}
              </p>

              {/* Periodo */}
              <span style={{ fontSize: '12px', color: '#888' }}>
                📅 {fmtFecha(c.fecha_inicio)} → {fmtFecha(c.fecha_fin_real)}
              </span>

              {/* Renta */}
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#333', textAlign: 'right' }}>
                ${Number(c.renta_mensual).toLocaleString('es-MX')}/mes
              </span>

              {/* Depósito y devolución si existen */}
              {(c.monto_deposito || c.monto_devuelto) && (
                <span style={{ fontSize: '11px', color: '#aaa', gridColumn: '1 / -1' }}>
                  Depósito: ${Number(c.monto_deposito || 0).toLocaleString('es-MX')}
                  {c.monto_devuelto != null && (
                    <> · Devuelto: ${Number(c.monto_devuelto).toLocaleString('es-MX')}</>
                  )}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

// ─── Sección (solo muestra el botón) ─────────────────────────────────────────
export default function SeccionHistorial({ historial, loadingHistorial, verHistorial, onCargarHistorial }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div style={s.seccion}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={s.seccionTitulo}>🗂 Historial de contratos anteriores</p>
        <button style={s.btnSecundario} onClick={() => setAbierto(true)}>
          Ver historial
        </button>
      </div>

      {abierto && (
        <ModalHistorial
          historial={verHistorial ? historial : null}
          loadingHistorial={loadingHistorial}
          onCargarHistorial={onCargarHistorial}
          onClose={() => setAbierto(false)}
        />
      )}
    </div>
  )
}