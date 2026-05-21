import s from '../../styles/propiedades'

export default function PropiedadCard({ propiedad: p, seleccionada, modalDeptos, rol, onSelect, onEditar, onEliminar }) {
  const activa = seleccionada?.id_propiedad === p.id_propiedad && modalDeptos

  return (
    <div
      style={{ ...s.propCard, border: activa ? '2px solid #0f3460' : '2px solid transparent' }}
      onClick={() => onSelect(p)}
    >
      <div style={s.propCardTop}>
        <div style={s.propIcono}>🏢</div>
        <div style={s.propIdTag}>ID #{p.id_propiedad}</div>
        {rol === 'admin' && (
          <div style={s.propAcciones}>
            <button style={s.btnIcono} title="Editar"    onClick={e => onEditar(p, e)}>✏️</button>
            <button style={s.btnIcono} title="Eliminar"  onClick={e => { e.stopPropagation(); onEliminar(p) }}>🗑️</button>
          </div>
        )}
      </div>
      <p style={s.propNombre}>{p.nombre}</p>
      <p style={s.propDir}>{p.calle}, {p.colonia}</p>
      <p style={s.propDir}>{p.ciudad}, {p.estado} — CP {p.codigo_postal}</p>
      {p.fecha_registro && (
        <p style={s.propFecha}>Registrada: {new Date(p.fecha_registro).toLocaleDateString('es-MX')}</p>
      )}
    </div>
  )
}
