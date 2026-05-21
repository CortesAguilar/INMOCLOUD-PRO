import { Modal } from './ui'
import s from '../../styles/propiedades'

export default function ModalGastoProp({ propNombre, formGastoProp, setFormGastoProp, msgError, guardando, onRegistrar, onClose }) {
  return (
    <Modal titulo={`Registrar gasto — ${propNombre}`} onClose={onClose}>
      <label style={s.label}>Concepto</label>
      <input style={s.input} value={formGastoProp.concepto}
        onChange={e => setFormGastoProp(g => ({ ...g, concepto: e.target.value }))} />

      <label style={{ ...s.label, marginTop: '10px' }}>Monto ($)</label>
      <input style={s.input} type="text" inputMode="numeric" placeholder="Ej: 1500"
        value={formGastoProp.monto}
        onChange={e => setFormGastoProp(g => ({ ...g, monto: e.target.value.replace(/[^0-9]/g, '').slice(0, 8) }))} />

      <label style={{ ...s.label, marginTop: '10px' }}>Categoría</label>
      <select style={s.input} value={formGastoProp.categoria}
        onChange={e => setFormGastoProp(g => ({ ...g, categoria: e.target.value }))}>
        <option value="predial">Predial</option>
        <option value="mantenimiento">Mantenimiento</option>
        <option value="limpieza">Limpieza</option>
        <option value="seguro">Seguro</option>
        <option value="otro">Otro</option>
      </select>

      <label style={{ ...s.label, marginTop: '10px' }}>Fecha</label>
      <input style={s.input} type="date" value={formGastoProp.fecha_gasto}
        onChange={e => setFormGastoProp(g => ({ ...g, fecha_gasto: e.target.value }))} />

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