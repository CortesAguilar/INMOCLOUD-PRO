import { Modal } from './ui'
import s from '../../styles/propiedades'

export default function ModalGastoDepto({ deptoNumero, formGastoDepto, setFormGastoDepto, msgError, guardando, onRegistrar, onClose }) {
  return (
    <Modal titulo={`Registrar gasto — Depto ${deptoNumero}`} onClose={onClose} ancho="400px">
      <label style={s.label}>Descripción</label>
      <input style={s.input} value={formGastoDepto.descripcion}
        onChange={e => setFormGastoDepto(g => ({ ...g, descripcion: e.target.value }))} />

      <label style={{ ...s.label, marginTop: '10px' }}>Monto ($)</label>
      <input style={s.input} type="text" inputMode="numeric" placeholder="Ej: 800"
        value={formGastoDepto.monto}
        onChange={e => setFormGastoDepto(g => ({ ...g, monto: e.target.value.replace(/[^0-9]/g, '') }))} />

      <label style={{ ...s.label, marginTop: '10px' }}>Categoría</label>
      <select style={s.input} value={formGastoDepto.categoria}
        onChange={e => setFormGastoDepto(g => ({ ...g, categoria: e.target.value }))}>
        <option value="reparacion">Reparación</option>
        <option value="mantenimiento">Mantenimiento</option>
        <option value="servicio">Servicio</option>
        <option value="limpieza">Limpieza</option>
      </select>

      <label style={{ ...s.label, marginTop: '10px' }}>Fecha</label>
      <input style={s.input} type="date" value={formGastoDepto.fecha_gasto}
        onChange={e => setFormGastoDepto(g => ({ ...g, fecha_gasto: e.target.value }))} />

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
