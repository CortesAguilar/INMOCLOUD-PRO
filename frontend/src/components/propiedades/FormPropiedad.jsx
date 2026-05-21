import { ESTADOS_MX } from '../../utils/calendario'
import s from '../../styles/propiedades'

const camposTexto = [
  { key: 'nombre',  label: 'Nombre de la propiedad' },
  { key: 'calle',   label: 'Calle y número' },
  { key: 'colonia', label: 'Colonia' },
]

export default function FormPropiedad({ form, setForm }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
      {camposTexto.map(c => (
        <div key={c.key}>
          <label style={s.label}>{c.label}</label>
          <input
            style={s.input}
            value={form[c.key]}
            onChange={e => setForm(f => ({ ...f, [c.key]: e.target.value }))}
          />
        </div>
      ))}
      <div>
        <label style={s.label}>Ciudad</label>
        <input
          style={s.input}
          value={form.ciudad}
          placeholder="Ej: Tijuana"
          onChange={e => setForm(f => ({ ...f, ciudad: e.target.value.replace(/[0-9]/g, '') }))}
        />
      </div>
      <div>
        <label style={s.label}>Estado</label>
        <select style={s.input} value={form.estado}
          onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
          <option value="">— Selecciona un estado —</option>
          {ESTADOS_MX.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      <div>
        <label style={s.label}>Código postal</label>
        <input
          style={s.input} type="text" inputMode="numeric" maxLength={5}
          value={form.codigo_postal} placeholder="Ej: 22000"
          onChange={e => setForm(f => ({ ...f, codigo_postal: e.target.value.replace(/[^0-9]/g, '').slice(0, 5) }))}
        />
      </div>
    </div>
  )
}