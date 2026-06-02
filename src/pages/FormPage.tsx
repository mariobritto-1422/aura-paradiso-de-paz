import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { DateInput } from '../components/DateInput'

const TIMEOUT_MS = 10 * 60 * 1000
const WARN_MS = 8 * 60 * 1000

const IC =
  'w-full border border-gray-300 rounded-xl px-4 py-3.5 text-gray-800 bg-white ' +
  'focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] transition-colors'

type Persona = {
  nombre: string
  dni: string
  fecha_nacimiento: string
  celular: string
  whatsapp: string
  email: string
  domicilio: string
  trabajo_ocupacion: string
  relacion_fallecido: string
  canal_notificacion: string
}

const EMPTY_P: Persona = {
  nombre: '', dni: '', fecha_nacimiento: '',
  celular: '', whatsapp: '', email: '',
  domicilio: '', trabajo_ocupacion: '',
  relacion_fallecido: '', canal_notificacion: 'WhatsApp',
}

type Screen = 'loading' | 'form' | 'success' | 'expired' | 'error'

const RELACIONES = ['Cónyuge', 'Hijo/a', 'Hermano/a', 'Padre/Madre', 'Otro']

function getFormRol(): 'solicitante' | 'garante' {
  const params = new URLSearchParams(window.location.search)
  return params.get('rol') === 'garante' ? 'garante' : 'solicitante'
}

export default function FormPage() {
  const formRol = getFormRol()
  const [screen, setScreen] = useState<Screen>('loading')
  const [token, setToken] = useState('')
  const [sol, setSol] = useState<Persona>(EMPTY_P)
  const [gar, setGar] = useState<Persona>(EMPTY_P)
  const [sameTelSol, setSameTelSol] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dupModal, setDupModal] = useState(false)
  const [warnVisible, setWarnVisible] = useState(false)
  const [dateErr, setDateErr] = useState({ sol: '', gar: '' })
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const warnRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    initSession()
    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(warnRef.current)
    }
  }, [])

  async function initSession() {
    const savedToken = sessionStorage.getItem('aura_token')
    const savedStatus = sessionStorage.getItem('aura_status')

    if (savedToken && savedStatus === 'completo') {
      setToken(savedToken)
      setScreen('success')
      return
    }

    const t = savedToken ?? crypto.randomUUID()
    if (!savedToken) sessionStorage.setItem('aura_token', t)
    setToken(t)

    const { error } = await supabase
      .from('deudos_fichados')
      .upsert({ session_token: t, estado: 'activo', rol: formRol }, { onConflict: 'session_token', ignoreDuplicates: true })

    if (error) { setScreen('error'); return }

    setScreen('form')
    warnRef.current = setTimeout(() => setWarnVisible(true), WARN_MS)
    timerRef.current = setTimeout(async () => {
      await supabase.from('deudos_fichados')
        .update({ estado: 'abandonado' })
        .eq('session_token', t)
        .eq('estado', 'activo')
      setScreen('expired')
    }, TIMEOUT_MS)
  }

  function chSol(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setSol(prev => ({ ...prev, [name]: value, ...(name === 'celular' && sameTelSol ? { whatsapp: value } : {}) }))
  }

  function chGar(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setGar(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (formRol === 'solicitante') {
      if (!sol.fecha_nacimiento) {
        setDateErr({ sol: 'Ingresá una fecha válida en formato DD/MM/AAAA', gar: '' })
        return
      }
      // Verificar duplicado por DNI en últimos 30 min
      setSaving(true)
      const since = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      const { data: dups } = await supabase
        .from('deudos_fichados')
        .select('id')
        .eq('dni', sol.dni)
        .eq('estado', 'completo')
        .gte('created_at', since)
      if (dups && dups.length > 0) {
        setSaving(false)
        setDupModal(true)
        return
      }
    } else {
      // garante
      if (!gar.fecha_nacimiento) {
        setDateErr({ sol: '', gar: 'Ingresá una fecha válida en formato DD/MM/AAAA' })
        return
      }
    }

    await saveForm()
  }

  async function saveForm() {
    setSaving(true)
    clearTimeout(timerRef.current)
    clearTimeout(warnRef.current)

    let saveError: unknown = null

    if (formRol === 'solicitante') {
      const whatsappSol = sameTelSol ? sol.celular : sol.whatsapp
      const { error } = await supabase
        .from('deudos_fichados')
        .update({
          nombre: sol.nombre,
          dni: sol.dni,
          fecha_nacimiento: sol.fecha_nacimiento || null,
          telefono: sol.celular,
          whatsapp: whatsappSol,
          email: sol.email || null,
          domicilio: sol.domicilio || null,
          trabajo_ocupacion: sol.trabajo_ocupacion || null,
          relacion_fallecido: sol.relacion_fallecido,
          canal_notificacion: sol.canal_notificacion,
          rol: 'solicitante',
          estado: 'completo',
        })
        .eq('session_token', token)
      saveError = error
    } else {
      const { error } = await supabase
        .from('deudos_fichados')
        .update({
          nombre: gar.nombre,
          dni: gar.dni,
          fecha_nacimiento: gar.fecha_nacimiento || null,
          telefono: gar.celular,
          whatsapp: gar.celular,
          domicilio: gar.domicilio || null,
          trabajo_ocupacion: gar.trabajo_ocupacion || null,
          relacion_fallecido: gar.relacion_fallecido,
          rol: 'garante',
          estado: 'completo',
        })
        .eq('session_token', token)
      saveError = error
    }

    setSaving(false)

    if (saveError) { setScreen('error'); return }

    sessionStorage.setItem('aura_status', 'completo')
    setDupModal(false)
    setScreen('success')
  }

  if (screen === 'loading') return <Loading />
  if (screen === 'success') return <Success formRol={formRol} />
  if (screen === 'expired') return <Expired />
  if (screen === 'error') return <Error />

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      <Header />

      {warnVisible && (
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 px-4 py-3 text-sm text-center">
          Tiene 2 minutos para completar el formulario.
        </div>
      )}

      <div className="max-w-lg mx-auto px-5 py-8">
        <p className="text-gray-600 text-sm leading-relaxed mb-8 text-center">
          {formRol === 'solicitante'
            ? <>Complete sus datos como <strong>Solicitante</strong>.<br />Un asesor de Paraíso de Paz se comunicará a la brevedad.</>
            : <>Complete los datos del <strong>Garante</strong> del servicio.<br />Un asesor de Paraíso de Paz se comunicará a la brevedad.</>
          }
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {formRol === 'solicitante' ? (
            /* ── SECCIÓN SOLICITANTE ── */
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-[#1B3A6B] px-5 py-3 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#B8956A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">A</span>
                <h2 className="text-white text-sm font-semibold">Datos del Solicitante</h2>
                <span className="text-[#B8956A] text-xs">(quien contrata el servicio)</span>
              </div>
              <div className="p-5 space-y-4">
                <Field label="Apellido y Nombre">
                  <input type="text" name="nombre" value={sol.nombre} onChange={chSol}
                    required className={IC} placeholder="Apellido, Nombre completo" autoComplete="name" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="DNI">
                    <input type="text" inputMode="numeric" name="dni" value={sol.dni} onChange={chSol}
                      required className={IC} placeholder="Sin puntos" autoComplete="off" />
                  </Field>
                  <Field label="Fecha de nacimiento" required>
                    <DateInput
                      value={sol.fecha_nacimiento}
                      onChange={iso => { setSol(p => ({ ...p, fecha_nacimiento: iso })); setDateErr(e => ({ ...e, sol: '' })) }}
                      error={dateErr.sol}
                    />
                  </Field>
                </div>
                <Field label="Celular">
                  <input type="tel" name="celular" value={sol.celular} onChange={chSol}
                    required className={IC} placeholder="376 154-12345" autoComplete="tel" />
                </Field>
                <div>
                  <Field label="WhatsApp">
                    <input type="tel" name="whatsapp" value={sameTelSol ? sol.celular : sol.whatsapp}
                      onChange={chSol} required disabled={sameTelSol}
                      className={IC + (sameTelSol ? ' opacity-60 bg-gray-50' : '')}
                      placeholder="376 154-12345" />
                  </Field>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                    <input type="checkbox" checked={sameTelSol}
                      onChange={e => { setSameTelSol(e.target.checked); if (e.target.checked) setSol(p => ({ ...p, whatsapp: p.celular })) }}
                      className="w-4 h-4 accent-[#1B3A6B]" />
                    <span className="text-sm text-gray-500">Mismo número que el celular</span>
                  </label>
                </div>
                <Field label="Email" required={false}>
                  <input type="email" name="email" value={sol.email} onChange={chSol}
                    className={IC} placeholder="correo@ejemplo.com" autoComplete="email" />
                </Field>
                <Field label="Domicilio">
                  <input type="text" name="domicilio" value={sol.domicilio} onChange={chSol}
                    required className={IC} placeholder="Calle, número, barrio..." />
                </Field>
                <Field label="Trabajo / Ocupación">
                  <input type="text" name="trabajo_ocupacion" value={sol.trabajo_ocupacion} onChange={chSol}
                    className={IC} placeholder="Empresa u ocupación" />
                </Field>
                <Field label="Relación con el fallecido">
                  <select name="relacion_fallecido" value={sol.relacion_fallecido} onChange={chSol}
                    required className={IC}>
                    <option value="">Seleccione una opción</option>
                    {RELACIONES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Canal de notificación preferido">
                  <select name="canal_notificacion" value={sol.canal_notificacion} onChange={chSol}
                    required className={IC}>
                    <option>WhatsApp</option>
                    <option>Email</option>
                  </select>
                </Field>
              </div>
            </div>
          ) : (
            /* ── SECCIÓN GARANTE ── */
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-[#1B3A6B] px-5 py-3 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#B8956A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">G</span>
                <h2 className="text-white text-sm font-semibold">Datos del Garante</h2>
                <span className="text-[#B8956A] text-xs">(quien puede retirar documentación)</span>
              </div>
              <div className="p-5 space-y-4">
                <Field label="Apellido y Nombre">
                  <input type="text" name="nombre" value={gar.nombre} onChange={chGar}
                    required className={IC} placeholder="Apellido, Nombre completo" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="DNI">
                    <input type="text" inputMode="numeric" name="dni" value={gar.dni} onChange={chGar}
                      required className={IC} placeholder="Sin puntos" autoComplete="off" />
                  </Field>
                  <Field label="Fecha de nacimiento" required>
                    <DateInput
                      value={gar.fecha_nacimiento}
                      onChange={iso => { setGar(p => ({ ...p, fecha_nacimiento: iso })); setDateErr(e => ({ ...e, gar: '' })) }}
                      error={dateErr.gar}
                    />
                  </Field>
                </div>
                <Field label="Celular">
                  <input type="tel" name="celular" value={gar.celular} onChange={chGar}
                    required className={IC} placeholder="376 154-12345" />
                </Field>
                <Field label="Domicilio">
                  <input type="text" name="domicilio" value={gar.domicilio} onChange={chGar}
                    required className={IC} placeholder="Calle, número, barrio..." />
                </Field>
                <Field label="Trabajo / Ocupación">
                  <input type="text" name="trabajo_ocupacion" value={gar.trabajo_ocupacion} onChange={chGar}
                    className={IC} placeholder="Empresa u ocupación" />
                </Field>
                <Field label="Relación con el fallecido">
                  <select name="relacion_fallecido" value={gar.relacion_fallecido} onChange={chGar}
                    required className={IC}>
                    <option value="">Seleccione una opción</option>
                    {RELACIONES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          )}

          <div className="pt-2 pb-4">
            <button type="submit" disabled={saving}
              className="w-full bg-[#1B3A6B] text-white py-4 rounded-xl text-base font-medium disabled:opacity-60 active:bg-[#152e57] transition-colors">
              {saving ? 'Enviando...' : 'Enviar datos'}
            </button>
            <p className="text-center text-gray-400 text-xs mt-3">
              Sus datos son confidenciales y solo serán utilizados por el equipo de Paraíso de Paz.
            </p>
          </div>
        </form>
      </div>

      {dupModal && (
        <Modal
          title="Registro previo detectado"
          body="En los últimos 30 minutos se registró un formulario con el mismo DNI. ¿Desea registrar este nuevo contacto de todas formas?"
          confirmLabel={saving ? 'Guardando...' : 'Confirmar'}
          onConfirm={saveForm}
          onCancel={() => { setSaving(false); setDupModal(false) }}
          disabled={saving}
        />
      )}
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Header() {
  return (
    <div className="bg-[#1B3A6B] text-white py-7 px-4 text-center">
      <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 border-2 border-[#B8956A]/40">
        <img src="/PP_jpg.png" alt="Paraíso de Paz" className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
      </div>
      <h1 className="text-lg font-semibold tracking-wide">Empresa Paraíso de Paz</h1>
      <p className="text-[#B8956A] text-sm mt-1 italic">Hacemos más fácil, tus momentos difíciles</p>
    </div>
  )
}

function Field({ label, children, required = true }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{' '}
        {required
          ? <span className="text-[#B8956A]">*</span>
          : <span className="text-gray-400 text-xs font-normal">(opcional)</span>}
      </label>
      {children}
    </div>
  )
}

function Modal({ title, body, confirmLabel, onConfirm, onCancel, disabled }: {
  title: string; body: string; confirmLabel: string
  onConfirm: () => void; onCancel: () => void; disabled: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-[#1B3A6B] font-semibold text-base mb-2">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-5">{body}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={disabled}
            className="flex-1 py-3 rounded-xl bg-[#1B3A6B] text-white text-sm font-medium disabled:opacity-60">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="min-h-screen bg-[#1B3A6B] flex flex-col items-center justify-center">
      <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-[#B8956A]/40">
        <img src="/PP_jpg.png" alt="Paraíso de Paz" className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
      </div>
      <p className="text-[#B8956A] text-sm">Cargando...</p>
    </div>
  )
}

function Success({ formRol }: { formRol: 'solicitante' | 'garante' }) {
  return (
    <div className="min-h-screen bg-[#f8f7f5] flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-[#1B3A6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-[#1B3A6B] text-xl font-semibold mb-3">Datos registrados</h2>
        <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
          {formRol === 'garante'
            ? 'Los datos del garante han sido recibidos. Un asesor de Paraíso de Paz se comunicará a la brevedad.'
            : 'Sus datos han sido recibidos. Un asesor de Paraíso de Paz se comunicará con usted a la brevedad.'}
        </p>
        <p className="text-[#B8956A] text-sm mt-6 italic">Estamos aquí para acompañarlos.</p>
      </div>
    </div>
  )
}

function Expired() {
  return (
    <div className="min-h-screen bg-[#f8f7f5] flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-[#1B3A6B] text-xl font-semibold mb-3">Sesión expirada</h2>
        <p className="text-gray-600 text-sm leading-relaxed max-w-xs mb-6">
          El tiempo para completar el formulario ha vencido. Por favor escanee el QR nuevamente.
        </p>
        <a href="tel:037644757850" className="text-[#1B3A6B] underline text-sm font-medium">
          (0376) 4475785
        </a>
      </div>
    </div>
  )
}

function Error() {
  return (
    <div className="min-h-screen bg-[#f8f7f5] flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-[#1B3A6B] text-xl font-semibold mb-3">Error de conexión</h2>
        <p className="text-gray-600 text-sm leading-relaxed max-w-xs mb-6">
          No pudimos conectar con el sistema. Intente nuevamente o comuníquese directamente.
        </p>
        <button onClick={() => window.location.reload()}
          className="bg-[#1B3A6B] text-white px-6 py-3 rounded-xl text-sm font-medium">
          Reintentar
        </button>
      </div>
    </div>
  )
}
