/**
 * Insurance Provider Integration Layer
 * Real API integration with HealthSherpa + fallback to mock data
 */

import { SubsidyResult } from './aca'
import { fetchSherpaQuotes, type HealthSherpaPlan, isHealthSherpaConfigured } from './healthSherpa'
import { buildSherpaRedirect } from './redirect'

export interface InsurancePlan {
  id: string
  provider: string
  planName: string
  premium: number // Monthly premium after subsidy
  deductible: number
  outOfPocketMax: number
  metalTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Catastrophic'
  networkType: 'HMO' | 'PPO' | 'EPO' | 'POS'
  features: string[]
  starRating?: number
  healthSherpaPlanId?: string // For enrollment linking
}

export interface QuoteRequest {
  age: number
  zipCode: string
  householdSize: number
  income: number
  tobaccoUse: boolean
  subsidyResult: SubsidyResult
}

/**
 * Convert HealthSherpa plan to our InsurancePlan format
 */
function convertSherpaPlan(plan: HealthSherpaPlan, subsidyAmount: number): InsurancePlan {
  // Apply subsidy to premium
  const subsidizedPremium = Math.max(plan.premium - subsidyAmount, 0)
  
  // Map network types (simplified)
  let networkType: InsurancePlan['networkType'] = 'HMO'
  if (plan.plan_type?.includes('PPO')) networkType = 'PPO'
  if (plan.plan_type?.includes('EPO')) networkType = 'EPO'
  if (plan.plan_type?.includes('POS')) networkType = 'POS'
  
  // Generate features list
  const features = [
    'ACA Compliant',
    '10 Essential Health Benefits',
  ]
  
  if (plan.has_hsa) features.push('HSA Eligible')
  if (plan.has_copay) features.push('Copay Plans Available')
  if (plan.star_rating && plan.star_rating >= 4) features.push('Highly Rated Plan')
  
  return {
    id: plan.id,
    provider: plan.carrier_name,
    planName: plan.plan_name,
    premium: Math.round(subsidizedPremium),
    deductible: plan.deductible,
    outOfPocketMax: plan.out_of_pocket_max,
    metalTier: plan.metal_level,
    networkType,
    features,
    starRating: plan.star_rating,
    healthSherpaPlanId: plan.id,
  }
}

/**
 * Generate mock quotes (fallback when API is unavailable)
 */
function generateMockQuotes(request: QuoteRequest): InsurancePlan[] {
  const { age, zipCode, subsidyResult } = request
  
  const mockProviders = [
    { name: 'Florida Blue', avgDeductible: 3500, avgOOPMax: 8500 },
    { name: 'Aetna', avgDeductible: 3000, avgOOPMax: 8000 },
    { name: 'Cigna', avgDeductible: 3200, avgOOPMax: 8200 },
    { name: 'Oscar', avgDeductible: 2800, avgOOPMax: 7800 },
    { name: 'Molina', avgDeductible: 2500, avgOOPMax: 7500 },
    { name: 'Ambetter', avgDeductible: 2700, avgOOPMax: 7700 },
  ]
  
  const plans: InsurancePlan[] = []
  const basePremium = subsidyResult.benchmarkPremium
  
  // Generate 4-6 mock plans
  const numPlans = 4 + Math.floor(Math.random() * 2)
  
  for (let i = 0; i < numPlans; i++) {
    const provider = mockProviders[i % mockProviders.length]
    
    // Adjust premium based on metal tier
    let tierMultiplier = 1.0
    switch (subsidyResult.planTier) {
      case 'Bronze': tierMultiplier = 0.85; break
      case 'Silver': tierMultiplier = 1.0; break
      case 'Gold': tierMultiplier = 1.15; break
      case 'Platinum': tierMultiplier = 1.3; break
      case 'Catastrophic': tierMultiplier = 0.6; break
    }
    
    // Add some random variation
    const variation = 0.9 + (Math.random() * 0.2) // 0.9 to 1.1
    const premium = Math.round(basePremium * tierMultiplier * variation)
    const subsidizedPremium = Math.max(premium - subsidyResult.subsidyAmount, 0)
    
    plans.push({
      id: `mock_plan_${i + 1}`,
      provider: provider.name,
      planName: `${provider.name} ${subsidyResult.planTier}`,
      premium: subsidizedPremium,
      deductible: provider.avgDeductible + (Math.random() * 1000 - 500),
      outOfPocketMax: provider.avgOOPMax + (Math.random() * 2000 - 1000),
      metalTier: subsidyResult.planTier,
      networkType: ['HMO', 'PPO', 'EPO'][Math.floor(Math.random() * 3)] as any,
      features: [
        'Primary care visits: $30 copay',
        'Specialist visits: $50 copay',
        'Urgent care: $75 copay',
        'Emergency room: $300 copay',
        'Prescription drugs: Tiered copay',
      ],
      starRating: 3 + Math.floor(Math.random() * 3),
    })
  }
  
  // Sort by premium (lowest first)
  return plans.sort((a, b) => a.premium - b.premium)
}

/**
 * Main function to get quotes - tries HealthSherpa first, falls back to mock
 */
export async function getQuotes(request: QuoteRequest): Promise<InsurancePlan[]> {
  const { age, zipCode, householdSize, income, tobaccoUse, subsidyResult } = request
  
  console.log('Getting quotes for:', { age, zipCode, householdSize, income, tobaccoUse })
  
  // Try HealthSherpa API first if configured
  if (isHealthSherpaConfigured()) {
    console.log('HealthSherpa is configured, attempting API call...')
    
    const sherpaPlans = await fetchSherpaQuotes({
      age,
      zip: zipCode,
      income,
      householdSize,
      tobaccoUse,
    })
    
    if (sherpaPlans && sherpaPlans.length > 0) {
      console.log(`Got ${sherpaPlans.length} real plans from HealthSherpa`)
      
      // Convert and filter plans
      const convertedPlans = sherpaPlans
        .map(plan => convertSherpaPlan(plan, subsidyResult.subsidyAmount))
        .filter(plan => plan.premium > 0) // Filter out zero/negative premium plans
        .sort((a, b) => a.premium - b.premium) // Sort by premium
        .slice(0, 6) // Limit to 6 plans for UX
      
      if (convertedPlans.length > 0) {
        return convertedPlans
      }
    }
    
    console.log('HealthSherpa returned no plans or failed, falling back to mock data')
  } else {
    console.log('HealthSherpa not configured, using mock data')
  }
  
  // Fallback to mock data
  return generateMockQuotes(request)
}

/**
 * Get enrollment URL for a specific plan
 */
export function getEnrollmentUrl(userData: QuoteRequest, planId?: string): string {
  const redirectData = {
    age: userData.age,
    zip: userData.zipCode,
    income: userData.income,
    householdSize: userData.householdSize,
    tobaccoUse: userData.tobaccoUse,
    subsidyAmount: userData.subsidyResult.subsidyAmount,
    estimatedPremium: userData.subsidyResult.estimatedPremium,
  }
  
  return buildSherpaRedirect(redirectData)
}

/**
 * Check if we have real API access
 */
export function hasRealAPIAccess(): boolean {
  return isHealthSherpaConfigured()
}

/**
 * Get API status for debugging
 */
export function getApiStatus() {
  return {
    healthSherpaConfigured: isHealthSherpaConfigured(),
    // Add other API status checks here
  }
}