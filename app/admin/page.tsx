'use client'

import { useState, useEffect } from 'react'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  age: number
  income: number
  householdSize: number
  zipCode: string
  tobaccoUse: boolean
  estimatedPremium: number
  estimatedSubsidy: number
  planTier: string
  createdAt: string
  enrolled?: boolean
}

export default function AdminPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  // Simple authentication (in production, use proper auth)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'marilife2024') { // Change this in production!
      setAuthenticated(true)
      localStorage.setItem('admin_auth', 'true')
    } else {
      setError('Incorrect password')
    }
  }

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth')
    if (auth === 'true') {
      setAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (!authenticated) return

    const fetchLeads = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/lead')
        
        if (!response.ok) {
          throw new Error('Failed to fetch leads')
        }
        
        const data = await response.json()
        setLeads(data.leads || [])
      } catch (err) {
        setError('Error loading leads')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [authenticated])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Age', 'Income', 'Household Size', 'ZIP', 'Premium', 'Subsidy', 'Plan Tier', 'Date']
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.name}"`,
        lead.email,
        lead.phone,
        lead.age,
        lead.income,
        lead.householdSize,
        lead.zipCode,
        lead.estimatedPremium,
        lead.estimatedSubsidy,
        lead.planTier,
        new Date(lead.createdAt).toISOString(),
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `marilife-leads-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Marilife Admin Access
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter password"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Enter Admin Panel
            </button>
          </form>
          <p className="mt-4 text-xs text-gray-500 text-center">
            Contact system administrator for access
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-primary-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Marilife Leads Dashboard</h1>
                <p className="text-gray-600">
                  {leads.length} lead{leads.length !== 1 ? 's' : ''} captured
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('admin_auth')
                    setAuthenticated(false)
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-primary-700">
                  {formatCurrency(leads.reduce((sum, lead) => sum + lead.estimatedSubsidy, 0) / leads.length || 0)}
                </div>
                <div className="text-sm text-gray-600">Avg. subsidy per lead</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-primary-700">
                  {formatCurrency(leads.reduce((sum, lead) => sum + lead.estimatedPremium, 0) / leads.length || 0)}
                </div>
                <div className="text-sm text-gray-600">Avg. premium per lead</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-primary-700">
                  {Math.round(leads.reduce((sum, lead) => sum + lead.age, 0) / leads.length || 0)}
                </div>
                <div className="text-sm text-gray-600">Avg. age</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-primary-700">
                  {formatCurrency(leads.reduce((sum, lead) => sum + lead.income, 0) / leads.length || 0)}
                </div>
                <div className="text-sm text-gray-600">Avg. income</div>
              </div>
            </div>
          </div>

          {/* Leads Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-600">Loading leads...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-700">{error}</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-600 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-700">No leads yet. Check back later!</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Financials
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                        <div className="text-sm text-gray-500">{lead.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          Age: {lead.age} • Household: {lead.householdSize}
                        </div>
                        <div className="text-sm text-gray-500">
                          ZIP: {lead.zipCode} • {lead.tobaccoUse ? 'Tobacco user' : 'Non-smoker'}
                        </div>
                        <div className="text-xs text-primary-600 font-medium mt-1">
                          {lead.planTier} Plan
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            Premium: {formatCurrency(lead.estimatedPremium)}/mo
                          </div>
                          <div className="text-green-600">
                            Subsidy: {formatCurrency(lead.estimatedSubsidy)}/mo
                          </div>
                          <div className="text-gray-500">
                            Income: {formatCurrency(lead.income)}/yr
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(lead.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {leads.length} lead{leads.length !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-gray-500">
                Updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Admin Instructions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Follow-up Process</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Call within 24 hours of lead capture</li>
                <li>• Discuss subsidy amount and plan options</li>
                <li>• Schedule enrollment appointment</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Enrollment</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Use HealthSherpa link for enrollment</li>
                <li>• Assist with document collection</li>
                <li>• Track enrollment status in CRM</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">Data Management</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Export CSV weekly for backup</li>
                <li>• Update enrollment status when complete</li>
                <li>• Follow TCPA compliance for calls/texts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}