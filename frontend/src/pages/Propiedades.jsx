import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { usePropiedades } from '../hooks/usePropiedades'
import PropiedadesFiltros   from '../components/propiedades/PropiedadesFiltros'
import PropiedadCard        from '../components/propiedades/PropiedadCard'
import FormPropiedad        from '../components/propiedades/FormPropiedad'
import ModalDepartamentos   from '../components/propiedades/ModalDepartamentos'
import ModalDetalleDepto    from '../components/propiedades/depto'
import ModalPago            from '../components/propiedades/ModalPago'
import ModalGastoDepto      from '../components/propiedades/ModalGastoDepto'
import ModalGastoProp       from '../components/propiedades/ModalGastoProp'
import ModalAddDepto        from '../components/propiedades/ModalAddDepto'
import ModalVerGastos       from '../components/propiedades/ModalVerGastos'
import ModalConfirmacion    from '../components/propiedades/ModalConfirmacion'
import { Modal }            from '../components/propiedades/ui'
import s from '../styles/propiedades'
import api from '../api'

export default function Propiedades({ rol, onAlertasChange }) {
  const h = usePropiedades(onAlertasChange)
  const location = useLocation()

  /**
   * Si venimos desde Alertas con state.abrirDepartamento = id_departamento,
   * esperamos a que las propiedades carguen y luego buscamos el depto
   * y lo abrimos automáticamente.
   *
   * El flag se consume una sola vez (window.history.replaceState limpia el state
   * para que no se repita al refrescar).
   */
  useEffect(() => {
    const idDepto = location.state?.abrirDepartamento
    if (!idDepto || h.loading) return

    // Limpiar el state para que no vuelva a dispararse
    window.history.replaceState({}, '')

    // Buscar el departamento en todas las propiedades
    const abrirDepto = async () => {
      try {
        // Obtenemos todos los deptos del endpoint general
        const res = await api.get('/departamentos')
        const depto = res.data.find(d => d.id_departamento === idDepto)
        if (!depto) return

        // Primero abrimos la propiedad (carga sus deptos y abre ModalDepartamentos)
        // pero necesitamos abrir directamente el depto sin pasar por el modal de propiedad.
        // Usamos abrirDepto del hook directamente:
        h.abrirDepto(depto)
      } catch (e) {
        console.error('No se pudo abrir el departamento desde alerta:', e)
      }
    }

    abrirDepto()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, h.loading])

  if (h.loading) return <p style={{ color: '#666' }}>Cargando propiedades...</p>

  return (
    <div>
      {/* Barra superior */}
      <div style={s.topRow}>
        <span style={s.contador}>{h.propFiltradas.length} de {h.propiedades.length} propiedades</span>
        {rol === 'admin' && (
          <button style={s.btnPrimario} onClick={() => { h.setForm({}); h.setMsgError(''); h.setModalAgregar(true) }}>
            + Agregar propiedad
          </button>
        )}
      </div>

      <PropiedadesFiltros
        busqueda={h.busqueda}       setBusqueda={h.setBusqueda}
        ordenCampo={h.ordenCampo}   setOrdenCampo={h.setOrdenCampo}
        ordenDir={h.ordenDir}       setOrdenDir={h.setOrdenDir}
      />

      {/* Grid de propiedades */}
      <div style={s.propGrid}>
        {h.propFiltradas.map(p => (
          <PropiedadCard key={p.id_propiedad}
            propiedad={p} seleccionada={h.seleccionada} modalDeptos={h.modalDeptos} rol={rol}
            onSelect={h.seleccionarPropiedad}
            onEditar={h.abrirEditar}
            onEliminar={p => h.setModalEliminar(p)}
          />
        ))}
        {h.propFiltradas.length === 0 && <p style={{ color: '#aaa', gridColumn: '1/-1' }}>Sin resultados.</p>}
      </div>

      {/* ── Modales ── */}
      {h.modalDeptos && h.seleccionada && (
        <ModalDepartamentos
          seleccionada={h.seleccionada} deptos={h.deptos} loadingDeptos={h.loadingDeptos} rol={rol}
          onClose={h.cerrarModalDeptos}
          onAbrirDepto={h.abrirDepto}
          onAbrirGastoProp={() => { h.setMsgError(''); h.setModalGastoProp(true) }}
          onAbrirVerGastos={h.abrirVerGastos}
          onAbrirAddDepto={() => { h.setMsgError(''); h.setModalAddDepto(true) }}
        />
      )}

      {h.modalDepto && h.deptoSeleccionado && (
        <ModalDetalleDepto
          deptoSeleccionado={h.deptoSeleccionado} infoDepto={h.infoDepto}
          gastosDepto={h.gastosDepto} loadingDepto={h.loadingDepto}
          historial={h.historial} loadingHistorial={h.loadingHistorial} verHistorial={h.verHistorial}
          rol={rol} guardando={h.guardando} msgError={h.msgError}
          onClose={h.cerrarModalDepto}
          onCargarHistorial={h.cargarHistorial}
          onAbrirPago={() => { h.setMsgError(''); h.setModalPago(true) }}
          onAbrirGastoDepto={() => { h.setMsgError(''); h.setModalGastoDepto(true) }}
          onRefrescar={h.refrescarDepto}
        />
      )}

      {h.modalPago && (
        <ModalPago
          montoLiquidacion={h.montoLiquidacion}
          formPago={h.formPago} setFormPago={h.setFormPago}
          msgError={h.msgError} guardando={h.guardando}
          onRegistrar={() => h.registrarPago(h.montoLiquidacion)}
          onClose={() => h.setModalPago(false)}
        />
      )}

      {h.modalGastoDepto && (
        <ModalGastoDepto
          deptoNumero={h.deptoSeleccionado?.numero}
          formGastoDepto={h.formGastoDepto} setFormGastoDepto={h.setFormGastoDepto}
          msgError={h.msgError} guardando={h.guardando}
          onRegistrar={h.registrarGastoDepto}
          onClose={() => h.setModalGastoDepto(false)}
        />
      )}

      {h.modalGastoProp && (
        <ModalGastoProp
          propNombre={h.seleccionada?.nombre}
          formGastoProp={h.formGastoProp} setFormGastoProp={h.setFormGastoProp}
          msgError={h.msgError} guardando={h.guardando}
          onRegistrar={h.registrarGastoProp}
          onClose={() => h.setModalGastoProp(false)}
        />
      )}

      {h.modalAddDepto && (
        <ModalAddDepto
          propNombre={h.seleccionada?.nombre}
          formDepto={h.formDepto} setFormDepto={h.setFormDepto}
          msgError={h.msgError} guardando={h.guardando}
          onSolicitarConfirmacion={h.solicitarConfirmacionDepto}
          onClose={() => h.setModalAddDepto(false)}
        />
      )}

      {h.modalVerGastos && h.seleccionada && (
        <ModalVerGastos
          propNombre={h.seleccionada.nombre}
          gastosProp={h.gastosProp} loadingGastosProp={h.loadingGastosProp}
          onClose={() => h.setModalVerGastos(false)}
        />
      )}

      {h.modalAgregar && (
        <Modal titulo="Nueva propiedad" onClose={() => h.setModalAgregar(false)}>
          <FormPropiedad form={h.form} setForm={h.setForm} />
          {h.msgError && <p style={s.error}>{h.msgError}</p>}
          <div style={s.modalBtns}>
            <button style={s.btnSecundario} onClick={() => h.setModalAgregar(false)}>Cancelar</button>
            <button style={s.btnPrimario} onClick={h.solicitarConfirmacionPropiedad} disabled={h.guardando}>
              Guardar
            </button>
          </div>
        </Modal>
      )}

      {h.modalEditar && (
        <Modal titulo={`Editar — ${h.modalEditar.nombre}`} onClose={() => h.setModalEditar(null)}>
          <FormPropiedad form={h.form} setForm={h.setForm} />
          {h.msgError && <p style={s.error}>{h.msgError}</p>}
          <div style={s.modalBtns}>
            <button style={s.btnSecundario} onClick={() => h.setModalEditar(null)}>Cancelar</button>
            <button style={s.btnPrimario} onClick={h.editarPropiedad} disabled={h.guardando}>
              {h.guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}

      {h.modalEliminar && (
        <Modal titulo="Confirmar eliminación" onClose={() => h.setModalEliminar(null)}>
          <p style={{ color: '#333', marginBottom: '16px' }}>
            ¿Seguro que deseas eliminar <strong>{h.modalEliminar.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <div style={s.modalBtns}>
            <button style={s.btnSecundario} onClick={() => h.setModalEliminar(null)}>Cancelar</button>
            <button style={{ ...s.btnPrimario, background: '#e53e3e' }} onClick={h.eliminarPropiedad} disabled={h.guardando}>
              {h.guardando ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Popup de confirmación (encima de todo) ── */}
      {h.confirmar && (
        <ModalConfirmacion
          titulo={h.confirmar.tipo === 'propiedad' ? 'Confirmar nueva propiedad' : 'Confirmar nuevo departamento'}
          descripcion="Revisa que los datos sean correctos antes de guardar."
          filas={h.confirmar.tipo === 'propiedad' ? h.filasConfirmacionPropiedad : h.filasConfirmacionDepto}
          onConfirmar={h.ejecutarConfirmado}
          onCancelar={h.cancelarConfirmacion}
          guardando={h.guardando}
          colorBoton={h.confirmar.tipo === 'propiedad' ? '#1d4ed8' : '#2d6a4f'}
        />
      )}
    </div>
  )
}