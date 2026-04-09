'use client'

import { useState } from 'react'
import Calculator from './components/Calculator'
import Results from './components/Results'
import LeadForm from './components/LeadForm'

export default function Home() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [userData, setUserData] = useState<any>(null)

  const handleCalculate = async (result: any) => {
    setLoading(true)
    // Save the user data for Results component
    setUserData(result)
    
    try {
      // Call the quote API
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: result.age,
          income: result.income,
          householdSize: result.householdSize,
          zipCode: result.zipCode,
          tobaccoUse: result.tobaccoUse,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to calculate quotes')
      }

      const quoteData = await response.json()
      setData(quoteData)
    } catch (error) {
      console.error('Error fetching quotes:', error)
      // Use local calculation as fallback
      const localResult = {
        ...result,
        premium: result.estimatedPremium,
        subsidy: result.subsidyAmount,
        planTier: result.planTier,
        quotes: [
          {
            provider: "Florida Blue",
            premium: Math.round(result.estimatedPremium * 0.9),
            deductible: 3500,
          },
          {
            provider: "Aetna",
            premium: Math.round(result.estimatedPremium * 1.1),
            deductible: 3000,
          },
        ],
      }
      setData(localResult)
    } finally {
      setLoading(false)
    }
  }

  const handleLeadSuccess = () => {
    alert('Thank you! A licensed agent will contact you shortly with your personalized plans.')
    // Reset the form after success
    setTimeout(() => {
      setData(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 2000)
  }

  return (
    <main>
      {/* Hero Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-800 text-sm font-semibold mb-4">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          ACA Open Enrollment Now Open
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          ¿Paga demasiado por su seguro médico?<br />
          <span className="text-primary-600">Puede calificar para $0/mes con subsidios ACA</span>
        </h1>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Más del 80% de los solicitantes en Florida califican para ayuda financiera. 
          Descubra cuánto puede ahorrar en menos de 30 segundos.
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <div className="flex items-center text-gray-700">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Agentes bilingües (Español/Inglés)
          </div>
          <div className="flex items-center text-gray-700">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Sin costo por nuestros servicios
          </div>
          <div className="flex items-center text-gray-700">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Seguro y confidencial
          </div>
        </div>
      </div>
      
      
      <Calculator onCalculate={handleCalculate} loading={loading} />
      
      {data && (
        <>
          <Results data={data} userData={userData} />
          <LeadForm userData={data} onSuccess={handleLeadSuccess} />
        </>
      )}

      {/* Stats Section */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-xl mx-auto">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-700">85%</div>
          <div className="text-xs text-gray-600">Califican para ayuda</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-700">$600+</div>
          <div className="text-xs text-gray-600">Ahorro mensual promedio</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-700">9M+</div>
          <div className="text-xs text-gray-600">Inscritos en ACA</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-700">24h</div>
          <div className="text-xs text-gray-600">Respuesta de agente</div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600 mb-4">Proveedores confiables en Florida</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-500 text-sm">
          <div className="font-medium">Florida Blue</div>
          <div className="font-medium">Aetna</div>
          <div className="font-medium">Cigna</div>
          <div className="font-medium">Oscar</div>
        </div>
      </div>
    </main>
  )
}