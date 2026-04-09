/**
 * HealthSherpa API Client
 * Documentation: https://developers.healthsherpa.com/
 * 
 * Note: You need partner approval and API credentials from HealthSherpa
 * This is a production-ready integration pattern
 */

const BASE_URL = process.env.HEALTHSHERPA_BASE_URL || 'https://api.healthsherpa.com'
const API_KEY = process.env.HEALTHSHERPA_API_KEY

export interface HealthSherpaUser {
  age: number
  zip: string
  income: number
  householdSize: number
  tobaccoUse?: boolean
  members?: Array<{
    age: number
    tobacco: boolean
  }>
}

export interface HealthSherpaPlan {
  id: string
  carrier_name: string
  plan_name: string
  premium: number
  deductible: number
  metal_level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Catastrophic'
  out_of_pocket_max: number
  plan_type: string
  has_hsa: boolean
  has_copay: boolean
  star_rating?: number
  network_name?: string
}

export interface HealthSherpaResponse {
  plans: HealthSherpaPlan[]
  zip_code: string
  county: string
  state: string
  rating_area: string
}

/**
 * Fetch real quotes from HealthSherpa API
 */
export async function fetchSherpaQuotes(user: HealthSherpaUser): Promise<HealthSherpaPlan[] | null> {
  // If no API key is configured, return null (will use mock data)
  if (!API_KEY || API_KEY === 'your_api_key_here') {
    console.warn('HealthSherpa API key not configured. Using mock data.')
    return null
  }

  try {
    const members = user.members || [
      {
        age: user.age,
        tobacco: user.tobaccoUse || false,
      },
    ]

    const requestBody = {
      zip_code: user.zip,
      household_size: user.householdSize,
      income: Math.round(user.income),
      year: new Date().getFullYear(),
      market: 'individual',
      members,
      // Optional: include subsidy calculation
      include_aptc: true,
      include_csr: true,
    }

    console.log('Calling HealthSherpa API with:', { zip_code: user.zip, household_size: user.householdSize })

    const res = await fetch(`${BASE_URL}/quotes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('HealthSherpa API error:', res.status, errorText)
      
      // Handle specific error cases
      if (res.status === 401) {
        console.error('Invalid HealthSherpa API key. Please check your credentials.')
      } else if (res.status === 403) {
        console.error('API access forbidden. Ensure your account has proper permissions.')
      } else if (res.status === 429) {
        console.error('Rate limit exceeded. Consider implementing retry logic.')
      }
      
      return null
    }

    const data: HealthSherpaResponse = await res.json()
    
    if (!data.plans || !Array.isArray(data.plans)) {
      console.error('Invalid response format from HealthSherpa:', data)
      return null
    }

    console.log(`Received ${data.plans.length} plans from HealthSherpa for zip ${user.zip}`)
    return data.plans

  } catch (err) {
    console.error('HealthSherpa API call failed:', err)
    return null
  }
}

/**
 * Get plan details for a specific plan ID
 */
export async function getPlanDetails(planId: string): Promise<HealthSherpaPlan | null> {
  if (!API_KEY || API_KEY === 'your_api_key_here') {
    return null
  }

  try {
    const res = await fetch(`${BASE_URL}/plans/${planId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      console.error(`Failed to get plan details for ${planId}:`, res.status)
      return null
    }

    return await res.json()
  } catch (err) {
    console.error('Failed to fetch plan details:', err)
    return null
  }
}

/**
 * Check if HealthSherpa API is properly configured
 */
export function isHealthSherpaConfigured(): boolean {
  return !!(API_KEY && API_KEY !== 'your_api_key_here')
}

/**
 * Get API configuration status for debugging
 */
export function getApiStatus() {
  return {
    configured: isHealthSherpaConfigured(),
    hasKey: !!API_KEY,
    keyLength: API_KEY ? API_KEY.length : 0,
    baseUrl: BASE_URL,
  }
}