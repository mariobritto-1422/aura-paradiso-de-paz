import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const TIMEOUT_MS = 10 * 60 * 1000
const WARN_MS = 8 * 60 * 1000

const INPUT_CLASS =
  'w-full border border-gray-300 rounded-xl px-4 py-3.5 text-gray-800 bg-white ' +
  'focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] transition-colors'

type FormState = {
  nombre: string
  dni: string
  telefono: string
  whatsapp: string
  email: string
  relacion_fallecido: string
  canal_notificacion: string
}

type Screen = 'loading' | 'form' | 'success' | 'expired' | 'error'

const EMPTY: FormState = {
  nombre: '',
  dni: '',
  telefono: '',
  whatsapp: '',
  email: '',
  relacion_fallecido: '',
  canal_notificacion: '',
}

export default function FormPage() {
  const [screen, setScreen] = useState<Screen>('loading')
  const [token, setToken] = useState('')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [sameTel, setSameTel] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dupModal, setDupModal] = useState(false)
  const [warnVisible, setWarnVisible] = useState(false)
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
      .upsert({ session_token: t, estado: 'activo' }, { onConflict: 'session_token', ignoreDuplicates: true })

    if (error) {
      setScreen('error')
      return
    }

    setScreen('form')
    warnRef.current = setTimeout(() => setWarnVisible(true), WARN_MS)
    timerRef.current = setTimeout(async () => {
      await supabase
        .from('deudos_fichados')
        .update({ estado: 'abandonado' })
        .eq('session_token', t)
        .eq('estado', 'activo')
      setScreen('expired')
    }, TIMEOUT_MS)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      if (name === 'telefono' && sameTel) next.whatsapp = value
      return next
    })
  }

  function toggleSameTel(checked: boolean) {
    setSameTel(checked)
    if (checked) setForm(prev => ({ ...prev, whatsapp: prev.telefono }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const { data: dups } = await supabase
      .from('deudos_fichados')
      .select('id')
      .eq('dni', form.dni)
      .eq('estado', 'completo')
      .gte('created_at', since)

    if (dups && dups.length > 0) {
      setSaving(false)
      setDupModal(true)
      return
    }

    await saveForm()
  }

  async function saveForm() {
    setSaving(true)
    clearTimeout(timerRef.current)
    clearTimeout(warnRef.current)

    const payload = sameTel ? { ...form, whatsapp: form.telefono } : form
    const { error } = await supabase
      .from('deudos_fichados')
      .update({ ...payload, estado: 'completo' })
      .eq('session_token', token)

    setSaving(false)

    if (error) {
      setScreen('error')
      return
    }

    sessionStorage.setItem('aura_status', 'completo')
    setDupModal(false)
    setScreen('success')
  }

  if (screen === 'loading') return <Loading />
  if (screen === 'success') return <Success />
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
          Complete sus datos de contacto.<br />
          Un asesor de Paraíso de Paz se comunicará con usted a la brevedad.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Nombre completo">
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              className={INPUT_CLASS}
              placeholder="Ingrese su nombre completo"
              autoComplete="name"
            />
          </Field>

          <Field label="DNI">
            <input
              type="text"
              inputMode="numeric"
              name="dni"
              value={form.dni}
              onChange={handleChange}
              required
              className={INPUT_CLASS}
              placeholder="Sin puntos ni espacios"
              autoComplete="off"
            />
          </Field>

          <Field label="Teléfono">
            <input
              type="tel"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              required
              className={INPUT_CLASS}
              placeholder="376 154-12345"
              autoComplete="tel"
            />
          </Field>

          <div>
            <Field label="WhatsApp">
              <input
                type="tel"
                name="whatsapp"
                value={sameTel ? form.telefono : form.whatsapp}
                onChange={handleChange}
                required
                disabled={sameTel}
                className={INPUT_CLASS + (sameTel ? ' opacity-60 bg-gray-50' : '')}
                placeholder="376 154-12345"
              />
            </Field>
            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sameTel}
                onChange={e => toggleSameTel(e.target.checked)}
                className="w-4 h-4 accent-[#1B3A6B]"
              />
              <span className="text-sm text-gray-500">Mismo número que el teléfono</span>
            </label>
          </div>

          <Field label="Email">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className={INPUT_CLASS}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
            />
          </Field>

          <Field label="Relación con el fallecido">
            <select
              name="relacion_fallecido"
              value={form.relacion_fallecido}
              onChange={handleChange}
              required
              className={INPUT_CLASS}
            >
              <option value="">Seleccione una opción</option>
              <option>Cónyuge</option>
              <option>Hijo/a</option>
              <option>Hermano/a</option>
              <option>Padre/Madre</option>
              <option>Otro</option>
            </select>
          </Field>

          <Field label="Canal de notificación preferido">
            <select
              name="canal_notificacion"
              value={form.canal_notificacion}
              onChange={handleChange}
              required
              className={INPUT_CLASS}
            >
              <option value="">Seleccione una opción</option>
              <option>WhatsApp</option>
              <option>Email</option>
            </select>
          </Field>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#1B3A6B] text-white py-4 rounded-xl text-base font-medium disabled:opacity-60 active:bg-[#152e57] transition-colors"
            >
              {saving ? 'Enviando...' : 'Enviar mis datos'}
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

function Header() {
  return (
    <div className="bg-[#1B3A6B] text-white py-7 px-4 text-center">
      <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 border-2 border-[#B8956A]/40">
        <img
          src="/Paraiso_de_Paz.png"
          alt="Paraíso de Paz"
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
        />
      </div>
      <h1 className="text-lg font-semibold tracking-wide">Cochería Paraíso de Paz</h1>
      <p className="text-[#B8956A] text-sm mt-1 italic">Hacemos más fácil, tus momentos difíciles</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} <span className="text-[#B8956A]">*</span>
      </label>
      {children}
    </div>
  )
}

function Modal({
  title, body, confirmLabel, onConfirm, onCancel, disabled,
}: {
  title: string; body: string; confirmLabel: string
  onConfirm: () => void; onCancel: () => void; disabled: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-[#1B3A6B] font-semibold text-base mb-2">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-5">{body}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="flex-1 py-3 rounded-xl bg-[#1B3A6B] text-white text-sm font-medium disabled:opacity-60"
          >
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
        <img
          src="/Paraiso_de_Paz.png"
          alt="Paraíso de Paz"
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
        />
      </div>
      <p className="text-[#B8956A] text-sm">Cargando...</p>
    </div>
  )
}

function Success() {
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
          Sus datos han sido recibidos. Un asesor de Paraíso de Paz se comunicará con usted a la brevedad.
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
          El tiempo para completar el formulario ha vencido. Por favor escanee el QR nuevamente para iniciar una nueva sesión.
        </p>
        <p className="text-gray-500 text-sm">
          ¿Necesita atención inmediata?{' '}
          <a href="tel:037644757850" className="text-[#1B3A6B] underline font-medium">
            (0376) 4475785
          </a>
        </p>
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
          No pudimos conectar con el sistema. Por favor intente nuevamente o comuníquese directamente.
        </p>
        <a href="tel:037644757850" className="text-[#1B3A6B] underline text-sm font-medium mb-4">
          (0376) 4475785
        </a>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#1B3A6B] text-white px-6 py-3 rounded-xl text-sm font-medium"
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
