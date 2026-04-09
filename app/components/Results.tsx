'use client'

interface SubsidyResult {
  fplPercent: number
  expectedContribution: number
  benchmarkPremium: number
  subsidyAmount: number
  estimatedPremium: number
  planTier: string
  savings: number
}

import { getEnrollmentUrl } from '@/lib/providers'

export default function Results({ data, userData }: { data: any, userData?: any }) {
  if (!data) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleEnrollClick = () => {
    if (!userData) {
      alert('Please complete the contact form first')
      return
    }
    
    const enrollmentUrl = getEnrollmentUrl({
      age: userData.age,
      zipCode: userData.zipCode,
      householdSize: userData.householdSize,
      income: userData.income,
      tobaccoUse: userData.tobaccoUse,
      subsidyResult: data,
    })
    
    // Open in new tab
    window.open(enrollmentUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mt-6 p-6 bg-green-50 rounded-xl animate-slide-up">
      <div className="flex items-start mb-4">
        <div className="bg-green-100 text-green-800 p-2 rounded-lg mr-3">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold">
            ¡Califica para ${formatCurrency(data.subsidy)}/mes en subsidios!
          </h2>
          <p className="text-gray-700">
            Su prima estimada: <span className="font-bold text-primary-700">${formatCurrency(data.premium)}/mes</span>
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600">Subsidio mensual</div>
            <div className="text-2xl font-bold text-green-700">${formatCurrency(data.subsidy)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Prima estimada</div>
            <div className="text-2xl font-bold text-primary-700">${formatCurrency(data.premium)}</div>
          </div>
        </div>
        <p className="text-xs text-gray-600 text-center mt-2">
          Nivel de plan: <span className="font-medium">{data.planTier}</span>
        </p>
      </div>

      {data.quotes && data.quotes.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Ejemplos de planes disponibles:</h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Ejemplos</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Estos son planes de ejemplo basados en su perfil. Un agente licenciado le proveerá cotizaciones reales de Florida Blue, Aetna, Cigna y más.
          </p>
          {data.quotes.map((q: any, i: number) => (
            <div key={i} className="p-3 bg-white rounded mb-2 border border-gray-200 hover:border-primary-300 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium text-gray-900">{q.provider}</span>
                  <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{q.planType}</span>
                </div>
                <span className="font-bold text-primary-700">$${q.premium}/mes</span>
              </div>
              {q.deductible && (
                <div className="text-sm text-gray-600 mt-1 flex justify-between">
                  <span>Deducible: $${q.deductible}</span>
                  <span>Máximo fuera de bolsillo: $${q.maxOutOfPocket || q.deductible * 2}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
        <div className="flex items-start mb-2">
          <svg className="w-5 h-5 text-primary-700 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-bold text-gray-900">Próximo paso: Complete el formulario de contacto</h4>
            <p className="text-sm text-gray-700">
              Un agente licenciado de Marilife le llamará en 24 horas para:
            </p>
            <ul className="text-sm text-gray-700 mt-1 space-y-1">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Proporcionar cotizaciones reales de HealthSherpa
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Explicar beneficios y coberturas
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Asistirle con la inscripción sin costo
              </li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-primary-200">
          <strong>Nota:</strong> No estamos afiliados al gobierno. Esto no es HealthCare.gov.
          Los montos mostrados son estimados basados en su información.
        </p>
      </div>

      {/* Legal Disclaimer */}
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-xs text-yellow-800 font-medium mb-1">
              Información importante:
            </p>
            <p className="text-xs text-yellow-800">
              No estamos afiliados ni respaldados por ninguna agencia gubernamental. 
              Esto no es HealthCare.gov. Las estimaciones pueden variar. Las primas reales 
              dependen de la selección del plan, la aseguradora y la determinación final de elegibilidad.
              Un agente licenciado le proporcionará cotizaciones reales.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}