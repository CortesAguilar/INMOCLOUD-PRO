import { useEffect, useState } from 'react'
import api from '../api'
import { generarCalendario } from '../utils/calendario'

const formPropVacio   = { nombre: '', calle: '', colonia: '', ciudad: '', estado: '', codigo_postal: '' }
const formDeptoVacio  = { numero: '', num_recamaras: '', num_banos: '', contrato_luz: '', contrato_agua: '' }
const formGastoPropVacio  = { concepto: '', monto: '', categoria: 'mantenimiento', fecha_gasto: new Date().toISOString().slice(0, 10) }
const formGastoDeptoVacio = { descripcion: '', monto: '', categoria: 'mantenimiento', fecha_gasto: new Date().toISOString().slice(0, 10) }
const formPagoVacio       = { monto: '', fecha_pago: new Date().toISOString().slice(0, 10) }

export function usePropiedades(onAlertasChange) {
  // ── Datos principales ──────────────────────────────────────────────────────
  const [propiedades,       setPropiedades]       = useState([])
  const [seleccionada,      setSeleccionada]      = useState(null)
  const [deptos,            setDeptos]            = useState([])
  const [loading,           setLoading]           = useState(true)
  const [loadingDeptos,     setLoadingDeptos]     = useState(false)

  // ── Búsqueda y orden ───────────────────────────────────────────────────────
  const [busqueda,   setBusqueda]   = useState({ nombre: '', estado: '', ciudad: '', cp: '', calle: '' })
  const [ordenCampo, setOrdenCampo] = useState('id_propiedad')
  const [ordenDir,   setOrdenDir]   = useState('asc')

  // ── Modales de propiedad ───────────────────────────────────────────────────
  const [modalDeptos,    setModalDeptos]    = useState(false)
  const [modalAgregar,   setModalAgregar]   = useState(false)
  const [modalEditar,    setModalEditar]    = useState(null)
  const [modalEliminar,  setModalEliminar]  = useState(null)
  const [modalGastoProp, setModalGastoProp] = useState(false)
  const [modalVerGastos, setModalVerGastos] = useState(false)

  // ── Modal detalle departamento ─────────────────────────────────────────────
  const [deptoSeleccionado, setDeptoSeleccionado] = useState(null)
  const [modalDepto,        setModalDepto]        = useState(false)
  const [infoDepto,         setInfoDepto]         = useState(null)
  const [gastosDepto,       setGastosDepto]       = useState([])
  const [loadingDepto,      setLoadingDepto]      = useState(false)
  const [historial,         setHistorial]         = useState(null)
  const [loadingHistorial,  setLoadingHistorial]  = useState(false)
  const [verHistorial,      setVerHistorial]      = useState(false)

  // ── Sub-modales de departamento ────────────────────────────────────────────
  const [modalPago,       setModalPago]       = useState(false)
  const [modalGastoDepto, setModalGastoDepto] = useState(false)
  const [modalAddDepto,   setModalAddDepto]   = useState(false)

  // ── Gastos de propiedad ────────────────────────────────────────────────────
  const [gastosProp,        setGastosProp]        = useState([])
  const [loadingGastosProp, setLoadingGastosProp] = useState(false)

  // ── Formularios ───────────────────────────────────────────────────────────
  const [form,           setForm]           = useState(formPropVacio)
  const [formDepto,      setFormDepto]      = useState(formDeptoVacio)
  const [formGastoProp,  setFormGastoProp]  = useState(formGastoPropVacio)
  const [formPago,       setFormPago]       = useState(formPagoVacio)
  const [formGastoDepto, setFormGastoDepto] = useState(formGastoDeptoVacio)

  // ── Estado general ────────────────────────────────────────────────────────
  const [guardando, setGuardando] = useState(false)
  const [msgError,  setMsgError]  = useState('')

  // ── Confirmación previa al guardar ────────────────────────────────────────
  // confirmar: null | { tipo: 'propiedad' | 'departamento' }
  const [confirmar, setConfirmar] = useState(null)

  // ── Bloquear scroll al abrir modales ──────────────────────────────────────
  useEffect(() => {
    const hayModal = modalDeptos || modalAgregar || modalEditar || modalEliminar ||
                     modalGastoProp || modalDepto || modalPago || modalGastoDepto ||
                     modalAddDepto || modalVerGastos || !!confirmar
    document.body.style.overflow = hayModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modalDeptos, modalAgregar, modalEditar, modalEliminar, modalGastoProp,
      modalDepto, modalPago, modalGastoDepto, modalAddDepto, modalVerGastos, confirmar])

  useEffect(() => { cargarPropiedades() }, [])

  // ── Carga de datos ────────────────────────────────────────────────────────
  function cargarPropiedades() {
    setLoading(true)
    api.get('/propiedades').then(res => { setPropiedades(res.data); setLoading(false) })
  }

  function seleccionarPropiedad(p) {
    setSeleccionada(p)
    setDeptos([])
    setLoadingDeptos(true)
    setModalDeptos(true)
    api.get(`/propiedades/${p.id_propiedad}/departamentos`).then(res => {
      setDeptos(res.data)
      setLoadingDeptos(false)
    })
  }

  function cerrarModalDeptos() {
    setModalDeptos(false)
    setSeleccionada(null)
    setDeptos([])
  }

  function abrirDepto(d) {
    setDeptoSeleccionado(d)
    setInfoDepto(null)
    setGastosDepto([])
    setVerHistorial(false)
    setHistorial(null)
    setLoadingDepto(true)
    setModalDepto(true)
    Promise.all([
      api.get(`/departamentos/${d.id_departamento}/contrato-activo`),
      api.get(`/departamentos/${d.id_departamento}/gastos`),
    ]).then(([resInfo, resGastos]) => {
      setInfoDepto(resInfo.data)
      setGastosDepto(resGastos.data)
      setLoadingDepto(false)
    }).catch(() => setLoadingDepto(false))
  }

  function cerrarModalDepto() {
    setModalDepto(false)
    setDeptoSeleccionado(null)
    setInfoDepto(null)
    setGastosDepto([])
    setVerHistorial(false)
    setHistorial(null)
  }

  /**
   * Recarga el estado del departamento abierto sin cerrar el modal.
   * Se llama desde ModalDetalleDepto tras rescindir, renovar, crear contrato
   * o cambiar estado (promocion ↔ mantenimiento).
   */
  async function refrescarDepto() {
    if (!deptoSeleccionado) return
    setLoadingDepto(true)
    // Cuando se llega desde una alerta, seleccionada puede ser null.
    // deptoSeleccionado.id_propiedad siempre existe porque el endpoint
    // /departamentos lo devuelve en el JOIN con propiedad.
    const idPropiedad = seleccionada?.id_propiedad ?? deptoSeleccionado.id_propiedad
    try {
      const [resDeptos, resInfo, resGastos] = await Promise.all([
        api.get(`/propiedades/${idPropiedad}/departamentos`),
        api.get(`/departamentos/${deptoSeleccionado.id_departamento}/contrato-activo`),
        api.get(`/departamentos/${deptoSeleccionado.id_departamento}/gastos`),
      ])
      setDeptos(resDeptos.data)
      setInfoDepto(resInfo.data)
      setGastosDepto(resGastos.data)
      const deptoActualizado = resDeptos.data.find(
        d => d.id_departamento === deptoSeleccionado.id_departamento
      )
      if (deptoActualizado) setDeptoSeleccionado(deptoActualizado)
      onAlertasChange?.()
    } catch (e) {
      console.error('Error al refrescar departamento:', e)
    } finally {
      setLoadingDepto(false)
    }
  }

  function cargarHistorial() {
    if (historial) { setVerHistorial(true); return }
    setLoadingHistorial(true)
    api.get(`/departamentos/${deptoSeleccionado.id_departamento}/historial-contratos`).then(res => {
      setHistorial(res.data)
      setLoadingHistorial(false)
      setVerHistorial(true)
    })
  }

  function abrirVerGastos() {
    setGastosProp([])
    setLoadingGastosProp(true)
    setModalVerGastos(true)
    api.get(`/propiedades/${seleccionada.id_propiedad}/gastos`)
      .then(res => { setGastosProp(res.data); setLoadingGastosProp(false) })
      .catch(() => setLoadingGastosProp(false))
  }

  function abrirEditar(p, e) {
    e.stopPropagation()
    setForm({
      nombre: p.nombre || '', calle: p.calle || '', colonia: p.colonia || '',
      ciudad: p.ciudad || '', estado: p.estado || '', codigo_postal: p.codigo_postal || '',
    })
    setMsgError('')
    setModalEditar(p)
  }

  // ── Filtrado y ordenamiento ───────────────────────────────────────────────
  const propFiltradas = propiedades
    .filter(p =>
      p.nombre?.toLowerCase().includes(busqueda.nombre.toLowerCase()) &&
      (busqueda.estado === '' || p.estado === busqueda.estado) &&
      p.ciudad?.toLowerCase().includes(busqueda.ciudad.toLowerCase()) &&
      (p.codigo_postal || '').toString().includes(busqueda.cp) &&
      p.calle?.toLowerCase().includes(busqueda.calle.toLowerCase())
    )
    .sort((a, b) => {
      const va = ordenCampo === 'nombre' ? a.nombre : a.id_propiedad
      const vb = ordenCampo === 'nombre' ? b.nombre : b.id_propiedad
      if (va < vb) return ordenDir === 'asc' ? -1 : 1
      if (va > vb) return ordenDir === 'asc' ? 1 : -1
      return 0
    })

  // ── Confirmación ──────────────────────────────────────────────────────────

  /**
   * Valida el formulario de propiedad y, si pasa, abre el popup de confirmación.
   * El botón "Añadir propiedad" llama a esto en lugar de agregarPropiedad() directamente.
   */
  function solicitarConfirmacionPropiedad() {
    setMsgError('')
    if (!form.nombre.trim())         { setMsgError('El nombre de la propiedad es requerido.');  return }
    if (!form.calle.trim())          { setMsgError('La calle y número son requeridos.');         return }
    if (!form.colonia.trim())        { setMsgError('La colonia es requerida.');                  return }
    if (!form.ciudad.trim())         { setMsgError('La ciudad es requerida.');                   return }
    if (!form.estado)                { setMsgError('Selecciona un estado.');                     return }
    if (form.codigo_postal.length !== 5) { setMsgError('El código postal debe tener 5 dígitos.'); return }
    setConfirmar({ tipo: 'propiedad' })
  }

  /**
   * Valida el formulario de departamento y, si pasa, abre el popup de confirmación.
   * El botón "Añadir departamento" llama a esto en lugar de agregarDepartamento() directamente.
   */
  function solicitarConfirmacionDepto() {
    setMsgError('')
    const rec = parseInt(formDepto.num_recamaras)
    const ban = parseInt(formDepto.num_banos)
    if (!formDepto.numero.trim())              { setMsgError('El número de departamento es requerido.');   return }
    if (isNaN(rec) || rec <= 0 || rec > 99)   { setMsgError('Recámaras debe ser un número entre 1 y 99.'); return }
    if (isNaN(ban) || ban <= 0 || ban > 99)   { setMsgError('Baños debe ser un número entre 1 y 99.');    return }
    if (!formDepto.contrato_luz.trim())        { setMsgError('El contrato de luz es requerido.');          return }
    if (!formDepto.contrato_agua.trim())       { setMsgError('El contrato de agua es requerido.');         return }
    setConfirmar({ tipo: 'departamento' })
  }

  function cancelarConfirmacion() {
    setConfirmar(null)
  }

  /**
   * Se llama desde el popup al presionar "Confirmar y guardar".
   * Delega a la función real según el tipo.
   */
  async function ejecutarConfirmado() {
    if (confirmar?.tipo === 'propiedad')   await agregarPropiedad()
    if (confirmar?.tipo === 'departamento') await agregarDepartamento()
  }

  // ── Datos para mostrar en el popup de confirmación ────────────────────────

  const filasConfirmacionPropiedad = [
    { label: 'Nombre',        valor: form.nombre },
    { label: 'Calle',         valor: form.calle },
    { label: 'Colonia',       valor: form.colonia },
    { label: 'Ciudad',        valor: form.ciudad },
    { label: 'Estado',        valor: form.estado },
    { label: 'Código postal', valor: form.codigo_postal },
  ]

  const filasConfirmacionDepto = [
    { label: 'Propiedad',      valor: seleccionada?.nombre },
    { label: 'No. Depto',      valor: formDepto.numero },
    { label: 'Recámaras',      valor: formDepto.num_recamaras },
    { label: 'Baños',          valor: formDepto.num_banos },
    { label: 'Contrato luz',   valor: formDepto.contrato_luz },
    { label: 'Contrato agua',  valor: formDepto.contrato_agua },
    { label: 'Estado inicial', valor: 'Promoción' },
  ]

  // ── CRUD (se ejecutan sólo tras confirmación) ─────────────────────────────
  async function agregarPropiedad() {
    setGuardando(true); setMsgError('')
    try {
      await api.post('/propiedades', form)
      setConfirmar(null)
      setModalAgregar(false)
      setForm(formPropVacio)
      cargarPropiedades()
    } catch { setMsgError('Error al guardar la propiedad.') }
    finally { setGuardando(false) }
  }

  async function editarPropiedad() {
    setGuardando(true); setMsgError('')
    try {
      await api.put(`/propiedades/${modalEditar.id_propiedad}`, form)
      setModalEditar(null); setForm(formPropVacio); cargarPropiedades()
    } catch { setMsgError('Error al editar la propiedad.') }
    finally { setGuardando(false) }
  }

  async function eliminarPropiedad() {
    setGuardando(true)
    try {
      await api.delete(`/propiedades/${modalEliminar.id_propiedad}`)
      setModalEliminar(null); cargarPropiedades()
    } catch { alert('Error al eliminar. Verifica que no tenga departamentos activos.') }
    finally { setGuardando(false) }
  }

  async function registrarGastoProp() {
    setGuardando(true); setMsgError('')
    try {
      await api.post('/gastos/propiedad', {
        id_propiedad: seleccionada.id_propiedad,
        descripcion:  formGastoProp.concepto,
        categoria:    formGastoProp.categoria,
        monto:        parseFloat(formGastoProp.monto),
        fecha_gasto:  formGastoProp.fecha_gasto,
      })
      setModalGastoProp(false)
      setFormGastoProp(formGastoPropVacio)
    } catch { setMsgError('Error al registrar el gasto.') }
    finally { setGuardando(false) }
  }

  async function registrarPago(montoLiquidacion) {
    setMsgError('')
    const monto = parseFloat(formPago.monto)
    if (!monto || monto <= 0) { setMsgError('Ingresa un monto válido.'); return }
    if (monto > montoLiquidacion) {
      setMsgError(`El monto excede el monto de liquidación ($${montoLiquidacion.toLocaleString('es-MX')}). No puedes pagar más de lo que resta del contrato.`)
      return
    }
    setGuardando(true)
    try {
      await api.post('/pagos/renta', {
        id_contrato_renta: infoDepto.contrato.id_contrato_renta,
        monto,
        fecha_pago: formPago.fecha_pago,
      })
      setModalPago(false)
      setFormPago(formPagoVacio)
      onAlertasChange?.()
      const [resInfo, resGastos] = await Promise.all([
        api.get(`/departamentos/${deptoSeleccionado.id_departamento}/contrato-activo`),
        api.get(`/departamentos/${deptoSeleccionado.id_departamento}/gastos`),
      ])
      setInfoDepto(resInfo.data)
      setGastosDepto(resGastos.data)
    } catch { setMsgError('Error al registrar el pago.') }
    finally { setGuardando(false) }
  }

  async function registrarGastoDepto() {
    setGuardando(true); setMsgError('')
    try {
      await api.post('/gastos/departamento', {
        id_departamento: deptoSeleccionado.id_departamento,
        ...formGastoDepto,
        monto: parseFloat(formGastoDepto.monto),
      })
      setModalGastoDepto(false)
      setFormGastoDepto(formGastoDeptoVacio)
      api.get(`/departamentos/${deptoSeleccionado.id_departamento}/gastos`)
        .then(res => setGastosDepto(res.data))
    } catch { setMsgError('Error al registrar el gasto.') }
    finally { setGuardando(false) }
  }

  async function agregarDepartamento() {
    setGuardando(true); setMsgError('')
    const rec = parseInt(formDepto.num_recamaras)
    const ban = parseInt(formDepto.num_banos)
    try {
      await api.post('/departamentos', {
        id_propiedad:  seleccionada.id_propiedad,
        numero:        formDepto.numero.trim(),
        num_recamaras: rec,
        num_banos:     ban,
        contrato_luz:  formDepto.contrato_luz.trim(),
        contrato_agua: formDepto.contrato_agua.trim(),
      })
      setConfirmar(null)
      setModalAddDepto(false)
      setFormDepto(formDeptoVacio)
      setLoadingDeptos(true)
      const res = await api.get(`/propiedades/${seleccionada.id_propiedad}/departamentos`)
      setDeptos(res.data)
      setLoadingDeptos(false)
    } catch { setMsgError('Error al agregar el departamento. Verifica que el número o los contratos no estén repetidos.') }
    finally { setGuardando(false) }
  }

  // ── Calendario del contrato activo (derivado, no es estado) ──────────────
  const calendarioActivo = infoDepto?.contrato
    ? generarCalendario(
        infoDepto.contrato.fecha_inicio,
        infoDepto.contrato.fecha_fin_programada,
        infoDepto.pagos || [],
        Number(infoDepto.contrato.renta_mensual)
      )
    : null

  const montoLiquidacion = calendarioActivo?.montoLiquidacion ?? 0

  return {
    // datos
    propiedades, propFiltradas, seleccionada, deptos, loading, loadingDeptos,
    // búsqueda / orden
    busqueda, setBusqueda, ordenCampo, setOrdenCampo, ordenDir, setOrdenDir,
    // modales propiedad
    modalDeptos, setModalDeptos, cerrarModalDeptos,
    modalAgregar, setModalAgregar,
    modalEditar,  setModalEditar,
    modalEliminar, setModalEliminar,
    modalGastoProp, setModalGastoProp,
    modalVerGastos, setModalVerGastos,
    // depto detalle
    deptoSeleccionado, modalDepto, infoDepto, gastosDepto,
    loadingDepto, historial, loadingHistorial, verHistorial,
    cerrarModalDepto,
    // sub-modales depto
    modalPago, setModalPago,
    modalGastoDepto, setModalGastoDepto,
    modalAddDepto, setModalAddDepto,
    // gastos propiedad
    gastosProp, loadingGastosProp,
    // formularios
    form, setForm,
    formDepto, setFormDepto,
    formGastoProp, setFormGastoProp,
    formPago, setFormPago,
    formGastoDepto, setFormGastoDepto,
    // calendario activo
    montoLiquidacion,
    // estado
    guardando, msgError, setMsgError,
    // confirmación previa
    confirmar,
    cancelarConfirmacion,
    ejecutarConfirmado,
    solicitarConfirmacionPropiedad,
    solicitarConfirmacionDepto,
    filasConfirmacionPropiedad,
    filasConfirmacionDepto,
    // acciones
    seleccionarPropiedad, abrirDepto, cargarHistorial, abrirVerGastos, abrirEditar, refrescarDepto,
    agregarPropiedad, editarPropiedad, eliminarPropiedad,
    registrarGastoProp, registrarPago, registrarGastoDepto, agregarDepartamento,
  }
}