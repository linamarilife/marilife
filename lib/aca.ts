/**
 * ACA Subsidy Calculator based on 2024-2025 Federal Poverty Levels
 * Implements the ACA subsidy formula for premium tax credits
 */

export interface SubsidyInput {
  age: number
  income: number // Annual income
  householdSize: number
  zipCode: string
  tobaccoUse: boolean
}

export interface SubsidyResult {
  fplPercent: number
  expectedContribution: number // Monthly amount person is expected to pay
  benchmarkPremium: number // Second lowest cost silver plan (SLCSP) estimate
  subsidyAmount: number // Monthly premium tax credit
  estimatedPremium: number // What user would pay after subsidy
  planTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Catastrophic'
  savings: number // Estimated savings vs full price
}

/**
 * Federal Poverty Level guidelines for 2024 (48 contiguous states)
 * Updated annually by HHS
 */
const FPL_BASE = 14580 // For single person
const FPL_PER_PERSON = 5140 // Additional per household member

/**
 * ACA Sliding Scale for Expected Contribution (2024)
 * Percentage of income person is expected to pay for benchmark plan
 */
function getContributionRate(fplPercent: number): number {
  if (fplPercent <= 150) return 0.00  // 0% for ≤150% FPL
  if (fplPercent <= 200) return 0.02  // 2% for 150-200% FPL
  if (fplPercent <= 250) return 0.04  // 4% for 200-250% FPL
  if (fplPercent <= 300) return 0.06  // 6% for 250-300% FPL
  if (fplPercent <= 400) return 0.085 // 8.5% for 300-400% FPL
  return 0.085 // Cap at 8.5% for >400% FPL (no subsidy)
}

/**
 * Estimate benchmark premium based on age and location
 * Simplified model - in production would use actual SLCSP data
 */
function estimateBenchmarkPremium(age: number, zipCode: string, tobaccoUse: boolean): number {
  // Base premium for 21-year-old non-smoker
  let base = 300
  
  // Age rating (ACA allows 3:1 ratio for age)
  const ageFactor = Math.max(1, Math.min(3, age / 21))
  base = base * ageFactor
  
  // Tobacco rating (ACA allows 1.5:1 for tobacco)
  if (tobaccoUse) {
    base = base * 1.5
  }
  
  // Geographic adjustment (rough estimate)
  // In reality, this would come from county-specific data
  const firstDigit = parseInt(zipCode.charAt(0))
  if (firstDigit >= 9) base = base * 1.2 // West Coast
  if (firstDigit <= 3) base = base * 0.9 // Southeast
  
  return Math.round(base)
}

/**
 * Determine plan tier based on FPL percentage
 */
function getPlanTier(fplPercent: number, age: number): SubsidyResult['planTier'] {
  if (age < 30 && fplPercent > 400) return 'Catastrophic'
  if (fplPercent <= 150) return 'Silver' // CSR Silver plans
  if (fplPercent <= 250) return 'Silver'
  if (fplPercent <= 300) return 'Gold'
  return 'Bronze'
}

/**
 * Main subsidy calculation function
 */
export function calculateSubsidy(input: SubsidyInput): SubsidyResult {
  const { age, income, householdSize, zipCode, tobaccoUse } = input
  
  // Calculate Federal Poverty Level percentage
  const fplThreshold = FPL_BASE + (FPL_PER_PERSON * (householdSize - 1))
  const fplPercent = (income / fplThreshold) * 100
  
  // Get expected contribution rate based on FPL
  const contributionRate = getContributionRate(fplPercent)
  const expectedContributionAnnual = income * contributionRate
  const expectedContributionMonthly = expectedContributionAnnual / 12
  
  // Estimate benchmark premium (Second Lowest Cost Silver Plan)
  const benchmarkPremium = estimateBenchmarkPremium(age, zipCode, tobaccoUse)
  
  // Calculate subsidy amount (cannot be negative)
  const subsidyAmount = Math.max(benchmarkPremium - expectedContributionMonthly, 0)
  
  // Calculate final estimated premium
  const estimatedPremium = Math.max(benchmarkPremium - subsidyAmount, 0)
  
  // Determine plan tier
  const planTier = getPlanTier(fplPercent, age)
  
  // Calculate potential savings (vs full benchmark premium)
  const savings = Math.max(benchmarkPremium - estimatedPremium, 0)
  
  return {
    fplPercent: Math.round(fplPercent * 10) / 10,
    expectedContribution: Math.round(expectedContributionMonthly),
    benchmarkPremium: Math.round(benchmarkPremium),
    subsidyAmount: Math.round(subsidyAmount),
    estimatedPremium: Math.round(estimatedPremium),
    planTier,
    savings: Math.round(savings)
  }
}

/**
 * Quick estimate for UI display (simplified)
 */
export function quickEstimate(age: number, income: number, householdSize: number): {
  estimatedPremium: number
  subsidy: number
} {
  const input: SubsidyInput = {
    age,
    income,
    householdSize,
    zipCode: '00000',
    tobaccoUse: false
  }
  
  const result = calculateSubsidy(input)
  return {
    estimatedPremium: result.estimatedPremium,
    subsidy: result.subsidyAmount
  }
}