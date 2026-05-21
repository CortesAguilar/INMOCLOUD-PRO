import { useState } from 'react'
import { Modal } from '../ui'
import { SelectorDuracion, InputMonto } from './depto.primitivos'
import { parsearLocal, fmtFecha, st } from './depto.utils'
import { calcularFechaFin } from '../../../utils/calendario'
import s from '../../../styles/propiedades'

export default function ModalRenovar({ contrato, onConfirmar, onClose, guardando }) {
  const [duracion,    setDuracion]    = useState(12)
  const [nuevaRenta, setNuevaRenta]  = useState(Number(contrato.renta_mensual))

  // Día siguiente al fin programado actual (sin offset UTC)
  const fechaInicio = (() => {
    const d = parsearLocal(contrato.fecha_fin_programada)
    d.setDate(d.getDate() + 1)
    const y  = d.getFullYear()
    const m  = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  })()

  const fechaFin = calcularFechaFin(fechaInicio, duracion)

  return (
    <Modal titulo="Renovar contrato" onClose={onClose} ancho="460px">
      <p style={{ fontSize: '14px', color: '#555', marginBottom: '16px' }}>
        La renovación extiende el mismo contrato cambiando la fecha de fin.
        Opcionalmente puedes ajustar la renta mensual.
      </p>

      <div style={{ ...st.infoBloque, marginBottom: '16px' }}>
        <span style={st.infoLabel}>Nueva fecha de inicio</span>
        <span style={st.infoVal}>{fmtFecha(fechaInicio)}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
        <div>
          <p style={{ ...st.label, marginBottom: '8px' }}>Duración de la renovación</p>
          <SelectorDuracion duracion={duracion} onChange={setDuracion} />
        </div>

        <div style={st.infoBloque}>
          <span style={st.infoLabel}>Nueva fecha de fin</span>
          <span style={{ ...st.infoVal, color: '#0d6efd' }}>{fmtFecha(fechaFin)}</span>
        </div>

        <label style={st.label}>
          Nueva renta mensual
          <InputMonto value={nuevaRenta} onChange={setNuevaRenta} />
          {nuevaRenta !== Number(contrato.renta_mensual) && (
            <span style={{ fontSize: '11px', color: '#856404' }}>
              ⚠ Renta anterior: ${Number(contrato.renta_mensual).toLocaleString('es-MX')}
            </span>
          )}
        </label>
      </div>

      <div style={st.botonesRow}>
        <button style={s.btnSecundario} onClick={onClose} disabled={guardando}>
          Cancelar
        </button>
        <button
          style={s.btnPrimario}
          onClick={() => onConfirmar({ nuevaFechaFin: fechaFin, nuevaRentaMensual: nuevaRenta })}
          disabled={guardando}
        >
          {guardando ? 'Guardando…' : 'Confirmar renovación'}
        </button>
      </div>
    </Modal>
  )
}
