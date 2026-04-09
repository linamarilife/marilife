import { NextRequest, NextResponse } from 'next/server'
import { calculateSubsidy } from '@/lib/aca'
import { getQuotes, type QuoteRequest } from '@/lib/providers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['age', 'income', 'householdSize', 'zipCode', 'tobaccoUse']
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate data types and ranges
    const age = Number(body.age)
    const income = Number(body.income)
    const householdSize = Number(body.householdSize)
    const zipCode = String(body.zipCode)
    const tobaccoUse = Boolean(body.tobaccoUse)

    if (age < 18 || age > 100) {
      return NextResponse.json(
        { error: 'Age must be between 18 and 100' },
        { status: 400 }
      )
    }

    if (income < 0 || income > 1000000) {
      return NextResponse.json(
        { error: 'Income must be between 0 and 1,000,000' },
        { status: 400 }
      )
    }

    if (householdSize < 1 || householdSize > 10) {
      return NextResponse.json(
        { error: 'Household size must be between 1 and 10' },
        { status: 400 }
      )
    }

    if (!/^\d{5}$/.test(zipCode)) {
      return NextResponse.json(
        { error: 'Invalid ZIP code format' },
        { status: 400 }
      )
    }

    // Calculate subsidy
    const subsidyResult = calculateSubsidy({
      age,
      income,
      householdSize,
      zipCode,
      tobaccoUse,
    })

    // Get quotes from providers
    const quoteRequest: QuoteRequest = {
      age,
      zipCode,
      householdSize,
      income,
      tobaccoUse,
      subsidyResult,
    }

    const quotes = await getQuotes(quoteRequest)

    // Return combined results
    return NextResponse.json({
      success: true,
      subsidy: subsidyResult,
      quotes,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Quote API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// For preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}