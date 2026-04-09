/**
 * HealthSherpa Redirect Helper
 * Builds URLs for redirecting users to HealthSherpa for enrollment
 */

export interface RedirectUserData {
  age: number
  zip: string
  income: number
  householdSize: number
  tobaccoUse?: boolean
  name?: string
  email?: string
  phone?: string
  subsidyAmount?: number
  estimatedPremium?: number
}

/**
 * Build a HealthSherpa redirect URL with prefilled data
 * This redirects users to HealthSherpa's enrollment flow
 */
export function buildSherpaRedirect(user: RedirectUserData): string {
  const params = new URLSearchParams()
  
  // Required parameters
  params.append('zip_code', user.zip)
  params.append('income', Math.round(user.income).toString())
  params.append('household_size', user.householdSize.toString())
  
  // Member information
  params.append('member_count', '1')
  params.append('member_0_age', user.age.toString())
  params.append('member_0_tobacco', user.tobaccoUse ? 'true' : 'false')
  
  // Optional contact info (can prefill for better UX)
  if (user.name) {
    params.append('first_name', user.name.split(' ')[0])
    if (user.name.split(' ').length > 1) {
      params.append('last_name', user.name.split(' ').slice(1).join(' '))
    }
  }
  
  if (user.email) {
    params.append('email', user.email)
  }
  
  if (user.phone) {
    params.append('phone', user.phone.replace(/\D/g, ''))
  }
  
  // Add UTM parameters for tracking
  params.append('utm_source', 'marilife')
  params.append('utm_medium', 'aca_funnel')
  params.append('utm_campaign', 'enrollment')
  
  // Add timestamp for analytics
  params.append('ref', `marilife_${Date.now()}`)
  
  return `https://www.healthsherpa.com/?${params.toString()}`
}

/**
 * Build an embedded HealthSherpa iframe URL
 * For Enhanced Direct Enrollment (EDE) partners only
 */
export function buildSherpaEmbedUrl(user: RedirectUserData): string {
  const params = new URLSearchParams()
  
  // Embedded view parameters
  params.append('embed', 'true')
  params.append('zip_code', user.zip)
  params.append('income', Math.round(user.income).toString())
  params.append('household_size', user.householdSize.toString())
  params.append('member_0_age', user.age.toString())
  params.append('member_0_tobacco', user.tobaccoUse ? 'true' : 'false')
  
  // Hide HealthSherpa header/footer for seamless embed
  params.append('hide_header', 'true')
  params.append('hide_footer', 'true')
  
  return `https://www.healthsherpa.com/?${params.toString()}`
}

/**
 * Check if we should use redirect or embedded flow
 * Based on partnership level and user preferences
 */
export function getEnrollmentMethod(): 'redirect' | 'embed' | 'api' {
  // In production, this would check:
  // 1. If we have EDE (Enhanced Direct Enrollment) access
  // 2. User preference for staying on site vs redirect
  // 3. Compliance requirements
  
  // For now, default to redirect (works for everyone)
  return 'redirect'
}

/**
 * Generate a tracking ID for this enrollment session
 */
export function generateTrackingId(userId?: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  const userPart = userId ? userId.substring(0, 4) : 'anon'
  
  return `enroll_${userPart}_${timestamp}_${random}`
}

/**
 * Log enrollment attempt for analytics
 */
export function logEnrollmentAttempt(user: RedirectUserData, method: string) {
  const trackingData = {
    timestamp: new Date().toISOString(),
    method,
    userData: {
      age: user.age,
      zip: user.zip,
      householdSize: user.householdSize,
      incomeRange: getIncomeRange(user.income),
    },
    trackingId: generateTrackingId(user.email),
  }
  
  console.log('Enrollment attempt:', trackingData)
  
  // In production, send to analytics service
  // Example: sendToAnalytics('enrollment_attempt', trackingData)
}

/**
 * Helper to categorize income for analytics
 */
function getIncomeRange(income: number): string {
  if (income < 20000) return '<20k'
  if (income < 40000) return '20k-40k'
  if (income < 60000) return '40k-60k'
  if (income < 80000) return '60k-80k'
  if (income < 100000) return '80k-100k'
  return '100k+'
}