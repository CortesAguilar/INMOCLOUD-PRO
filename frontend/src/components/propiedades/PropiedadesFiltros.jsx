import { ESTADOS_MX } from '../../utils/calendario'
import s from '../../styles/propiedades'

export default function PropiedadesFiltros({ busqueda, setBusqueda, ordenCampo, setOrdenCampo, ordenDir, setOrdenDir }) {
  return (
    <>
      {/* Filtros */}
      <div style={s.filtrosBox}>
        <span style={s.filtrosLabel}>🔍 Filtrar</span>
        <input style={s.filtroInput} placeholder="Nombre"
          value={busqueda.nombre}
          onChange={e => setBusqueda(b => ({ ...b, nombre: e.target.value }))} />
        <input style={s.filtroInput} placeholder="Ciudad"
          value={busqueda.ciudad}
          onChange={e => setBusqueda(b => ({ ...b, ciudad: e.target.value.replace(/[0-9]/g, '') }))} />
        <select style={{ ...s.filtroInput, background: 'white', cursor: 'pointer' }}
          value={busqueda.estado}
          onChange={e => setBusqueda(b => ({ ...b, estado: e.target.value }))}>
          <option value="">Estado (todos)</option>
          {ESTADOS_MX.map(est => <option key={est} value={est}>{est}</option>)}
        </select>
        <input style={s.filtroInput} placeholder="Calle"
          value={busqueda.calle}
          onChange={e => setBusqueda(b => ({ ...b, calle: e.target.value }))} />
        <input style={{ ...s.filtroInput, width: '80px' }} placeholder="C.P." inputMode="numeric" maxLength={5}
          value={busqueda.cp}
          onChange={e => setBusqueda(b => ({ ...b, cp: e.target.value.replace(/[^0-9]/g, '').slice(0, 5) }))} />
        <button style={s.btnSecundario}
          onClick={() => setBusqueda({ nombre: '', estado: '', ciudad: '', cp: '', calle: '' })}>
          Limpiar
        </button>
      </div>

      {/* Ordenamiento */}
      <div style={s.ordenBox}>
        <span style={s.filtrosLabel}>↕️ Ordenar</span>
        <select style={s.select} value={ordenCampo} onChange={e => setOrdenCampo(e.target.value)}>
          <option value="id_propiedad">Por ID</option>
          <option value="nombre">Por nombre</option>
        </select>
        <select style={s.select} value={ordenDir} onChange={e => setOrdenDir(e.target.value)}>
          <option value="asc">Ascendente</option>
          <option value="desc">Descendente</option>
        </select>
      </div>
    </>
  )
}