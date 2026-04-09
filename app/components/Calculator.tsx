'use client'

import { useState } from 'react'
import { calculateSubsidy } from '@/lib/aca'

interface CalculatorProps {
  onCalculate: (result: any) => void
  loading: boolean
}

export default function Calculator({ onCalculate, loading }: CalculatorProps) {
  const [form, setForm] = useState({
    age: 35,
    householdSize: 1,
    income: 45000,
    zipCode: '33101', // Miami, FL
    tobaccoUse: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (form.age < 18 || form.age > 100) {
      newErrors.age = 'La edad debe estar entre 18 y 100 años'
    }
    
    if (form.householdSize < 1 || form.householdSize > 10) {
      newErrors.householdSize = 'El tamaño del hogar debe estar entre 1 y 10 personas'
    }
    
    if (form.income < 10000 || form.income > 200000) {
      newErrors.income = 'El ingreso debe estar entre $10,000 y $200,000'
    }
    
    if (!/^\d{5}$/.test(form.zipCode)) {
      newErrors.zipCode = 'Por favor ingrese un código ZIP válido de 5 dígitos'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    // Calculate subsidy
    const result = calculateSubsidy(form)
    onCalculate(result)
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSliderChange = (field: string, value: string) => {
    const numValue = parseInt(value, 10)
    handleInputChange(field, numValue)
  }

  return (
    <div className="card animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Calcule su subsidio ACA</h2>
        <p className="text-gray-600 mt-1">Ingrese sus datos para ver cuánto puede ahorrar mensualmente</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Age Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Edad: <span className="font-bold text-primary-700">{form.age}</span>
            </label>
            <span className="text-sm text-gray-500">18 - 100</span>
          </div>
          <input
            type="range"
            min="18"
            max="100"
            value={form.age}
            onChange={(e) => handleSliderChange('age', e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
        </div>

        {/* Household Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tamaño del hogar
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => handleInputChange('householdSize', size)}
                className={`py-3 rounded-lg border transition-all ${
                  form.householdSize === size
                    ? 'bg-primary-100 border-primary-500 text-primary-700 font-semibold'
                    : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          {errors.householdSize && <p className="mt-1 text-sm text-red-600">{errors.householdSize}</p>}
        </div>

        {/* Annual Income */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ingreso anual
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              value={form.income}
              onChange={(e) => handleInputChange('income', parseInt(e.target.value) || 0)}
              className="input-field pl-7"
              placeholder="50,000"
            />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {form.income.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
          </div>
          {errors.income && <p className="mt-1 text-sm text-red-600">{errors.income}</p>}
        </div>

        {/* ZIP Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código postal
          </label>
          <input
            type="text"
            value={form.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="input-field"
            placeholder="33101"
          />
          {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>}
          <p className="mt-1 text-sm text-gray-500">Encontraremos planes disponibles en su área</p>
        </div>

        {/* Tobacco Use Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            ¿Usa productos de tabaco?
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleInputChange('tobaccoUse', false)}
              className={`flex-1 py-3 rounded-xl border transition-all ${
                !form.tobaccoUse
                  ? 'bg-green-100 border-green-500 text-green-700 font-semibold'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('tobaccoUse', true)}
              className={`flex-1 py-3 rounded-xl border transition-all ${
                form.tobaccoUse
                  ? 'bg-red-100 border-red-500 text-red-700 font-semibold'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Sí
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Los usuarios de tabaco pueden pagar hasta 50% más en primas
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Calculando...
            </>
          ) : (
            'Calcular mi ahorro'
          )}
        </button>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Al hacer clic en "Calcular mi ahorro", acepta nuestra{' '}
            <a href="#" className="text-primary-600 hover:underline">Política de Privacidad</a>
            {' '}y{' '}
            <a href="#" className="text-primary-600 hover:underline">Términos de Servicio</a>.
          </p>
        </div>
      </form>
    </div>
  )
}