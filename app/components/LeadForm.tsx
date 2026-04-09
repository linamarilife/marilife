'use client'

import { useState } from 'react'

export default function LeadForm({ userData, onSuccess }: { userData: any, onSuccess: () => void }) {
  const [lead, setLead] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Basic validation
    if (!lead.name.trim()) {
      setError('Por favor ingrese su nombre')
      return
    }

    if (!lead.email.trim()) {
      setError('Por favor ingrese su email')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(lead.email)) {
      setError('Por favor ingrese un email válido')
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...lead,
          ...userData,
          phone: lead.phone.replace(/\D/g, ''),
        }),
      })

      if (!response.ok) {
        throw new Error("Error al enviar la información. Por favor intente nuevamente.")
      }

      setSuccess(true)
      
      // Call success callback
      setTimeout(() => {
        if (onSuccess) onSuccess()
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal. Por favor intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="mt-6 p-6 bg-white rounded-xl shadow text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">¡Información enviada!</h3>
        <p className="text-gray-600 mb-4">
          Un agente licenciado de Marilife le contactará en las próximas 24 horas.
        </p>
        <div className="text-left bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-900 mb-1">¿Qué puede esperar?</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Llamada al teléfono proporcionado
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Cotizaciones reales de HealthSherpa
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Asistencia con inscripción sin costo
            </li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 p-6 bg-white rounded-xl shadow animate-slide-up">
      <div className="flex items-start mb-4">
        <div className="bg-primary-100 text-primary-800 p-2 rounded-lg mr-3">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Obtenga cotizaciones reales</h3>
          <p className="text-sm text-gray-600">
            Complete este formulario y un agente licenciado le llamará con planes reales de Florida Blue, Aetna, Cigna y más.
          </p>
        </div>
      </div>

      <form onSubmit={submitLead} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
          <input
            type="text"
            placeholder="Ej: María González"
            value={lead.name}
            onChange={(e) => setLead({ ...lead, name: e.target.value })}
            className="input-field"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            placeholder="ej: maria@gmail.com"
            value={lead.email}
            onChange={(e) => setLead({ ...lead, email: e.target.value })}
            className="input-field"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="tel"
            placeholder="Ej: (561) 123-4567"
            value={lead.phone}
            onChange={(e) => setLead({ ...lead, phone: e.target.value })}
            className="input-field"
            disabled={loading}
            required
          />
          <p className="text-xs text-gray-500 mt-1">Un agente le llamará a este número en 24 horas</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center py-3 text-lg font-medium"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Enviando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              ¡Quiero mis cotizaciones reales!
            </>
          )}
        </button>

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Al enviar, acepta nuestra <a href="#" className="text-primary-600 hover:underline">Política de Privacidad</a> y 
            <a href="#" className="text-primary-600 hover:underline"> Términos de Servicio</a>. No compartimos su información con terceros.
          </p>
        </div>
      </form>
    </div>
  )
}