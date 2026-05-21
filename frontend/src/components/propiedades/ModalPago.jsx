import { Modal } from './ui'
import s from '../../styles/propiedades'

export default function ModalPago({ montoLiquidacion, formPago, setFormPago, msgError, guardando, onRegistrar, onClose }) {
  return (
    <Modal titulo="Registrar pago de renta" onClose={onClose} ancho="400px">
      <div style={{ background: '#f7f9fc', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#555' }}>
        Monto de liquidación restante:{' '}
        <strong style={{ color: '#0f3460' }}>${montoLiquidacion.toLocaleString('es-MX')}</strong>
      </div>

      <label style={s.label}>Monto ($)</label>
      <input style={s.input} type="text" inputMode="numeric" placeholder="Ej: 5000"
        value={formPago.monto}
        onChange={e => setFormPago(p => ({ ...p, monto: e.target.value.replace(/[^0-9]/g, '') }))} />

      <label style={{ ...s.label, marginTop: '10px' }}>Fecha de pago</label>
      <input style={s.input} type="date" value={formPago.fecha_pago}
        onChange={e => setFormPago(p => ({ ...p, fecha_pago: e.target.value }))} />

      {msgError && <p style={s.error}>{msgError}</p>}
      <div style={s.modalBtns}>
        <button style={s.btnSecundario} onClick={onClose}>Cancelar</button>
        <button style={s.btnPrimario} onClick={onRegistrar} disabled={guardando}>
          {guardando ? 'Registrando...' : 'Registrar'}
        </button>
      </div>
    </Modal>
  )
}
