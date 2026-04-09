import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ACA Savings Calculator | Check Your Health Insurance Subsidy',
  description: 'Find out how much you could save on health insurance through ACA subsidies. Check your eligibility in 30 seconds.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-gray-50 to-primary-50`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Logo */}
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-primary-700">Marilife Insurance</h1>
                  <p className="text-xs text-gray-600">Medicare & ACA Specialists</p>
                </div>
              </div>
              
              <div className="text-center sm:text-right">
                <p className="text-sm font-medium text-gray-900">Licensed Insurance Agents</p>
                <p className="text-xs text-gray-600">Florida License #: PENDING</p>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        
        {/* Footer with contact info and disclaimer */}
        <footer className="bg-gray-50 border-t border-gray-200 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Marilife Insurance</h3>
                <p className="text-sm text-gray-600">
                  Expert Medicare & ACA insurance services for the Hispanic community in Florida.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Contact Us</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    (561) 298-0493
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.94 6.412A2 2 0 002 8.108V16a2 2 0 002 2h12a2 2 0 002-2V8.108a2 2 0 00-.94-1.696l-6-3.75a2 2 0 00-2.12 0l-6 3.75zm2.615 2.423a1 1 0 10-1.11 1.664l5 3.333a1 1 0 001.11 0l5-3.333a1 1 0 00-1.11-1.664L10 11.798 5.555 8.835z" clipRule="evenodd" />
                    </svg>
                    info@marilife.com
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    West Palm Beach, FL
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Important Information</h3>
                <div className="text-xs text-gray-600 space-y-2">
                  <p>
                    <strong>Not affiliated with the government:</strong> This is not HealthCare.gov. 
                    We are a licensed insurance agency providing assistance with ACA marketplace plans.
                  </p>
                  <p>
                    <strong>Estimates may vary:</strong> Actual premiums depend on plan selection, 
                    insurer, and final eligibility determination.
                  </p>
                  <p className="pt-2 border-t border-gray-200">
                    © {new Date().getFullYear()} Marilife Insurance. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200 text-center">
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Licensed & Certified
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Bilingual Agents (English/Spanish)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  No Cost for Our Services
                </span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}