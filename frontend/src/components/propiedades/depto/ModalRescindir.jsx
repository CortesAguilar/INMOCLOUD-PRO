import { useState } from 'react'
import { Modal } from '../ui'
import { InputMonto } from './depto.primitivos'
import { st } from './depto.utils'
import s from '../../../styles/propiedades'

export default function ModalRescindir({ contrato, onConfirmar, onClose, guardando }) {
  const hoy = new Date().toISOString().split('T')[0]
  const [fechaFin, setFechaFin]     = useState(hoy)
  const [devolucion, setDevolucion] = useState(Number(contrato.monto_deposito))

  return (
    <Modal titulo="Rescindir contrato" onClose={onClose} ancho="440px">
      <p style={{ fontSize: '14px', color: '#555', marginBottom: '16px' }}>
        Finaliza el contrato de forma anticipada. Indica la fecha real de término
        y el monto del depósito a devolver al inquilino.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <label style={st.label}>
          Fecha de fin real
          <input
            type="date" value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
            style={st.input}
          />
        </label>

        <label style={st.label}>
          Monto a devolver del depósito
          <InputMonto value={devolucion} onChange={setDevolucion} />
          <span style={{ fontSize: '11px', color: '#888' }}>
            Depósito original: ${Number(contrato.monto_deposito).toLocaleString('es-MX')}
          </span>
        </label>
      </div>

      <div style={st.botonesRow}>
        <button style={s.btnSecundario} onClick={onClose} disabled={guardando}>
          Cancelar
        </button>
        <button
          style={{ ...s.btnPrimario, background: '#dc3545' }}
          onClick={() => onConfirmar({ fechaFin, devolucion })}
          disabled={guardando}
        >
          {guardando ? 'Guardando…' : 'Rescindir contrato'}
        </button>
      </div>
    </Modal>
  )
}
