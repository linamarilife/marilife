#!/usr/bin/env node

/**
 * Twilio Auto Follow-up Script
 * 
 * This script sends automated follow-up messages to leads
 * Can be run as a cron job (e.g., every hour)
 * 
 * Usage: node scripts/twilio-followup.js
 */

const { PrismaClient } = require('@prisma/client')
const twilio = require('twilio')

const prisma = new PrismaClient()

// Load environment variables
require('dotenv').config({ path: '.env' })

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} = process.env

// Check if Twilio is configured
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.error('Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env')
  process.exit(1)
}

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

/**
 * Send follow-up SMS based on lead age
 */
async function sendFollowUpSMS(lead) {
  const leadAgeHours = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60)
  
  let message = ''
  
  if (leadAgeHours < 24) {
    // 24-hour follow-up
    message = `Hi ${lead.name}, this is Marilife. We noticed you checked your ACA subsidy yesterday. ` +
      `Want to discuss your $${lead.estimatedSubsidy}/month savings? Call us at (561) 298-0493. Reply STOP to opt out.`
  } else if (leadAgeHours < 72) {
    // 3-day follow-up
    message = `Hi ${lead.name}, Marilife here. Open Enrollment ends soon! ` +
      `Don't miss your $${lead.estimatedSubsidy}/month savings. Call (561) 298-0493 to enroll. Reply STOP to opt out.`
  } else if (leadAgeHours < 168) {
    // 7-day follow-up
    message = `Hi ${lead.name}, last chance! ACA Open Enrollment closes soon. ` +
      `Secure your $${lead.estimatedPremium}/month plan. Call (561) 298-0493 now. Reply STOP to opt out.`
  } else {
    // Too old, skip
    return false
  }
  
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: `+1${lead.phone}`,
    })
    
    console.log(`Sent follow-up to ${lead.name} (${lead.phone}): ${result.sid}`)
    
    // Update lead with follow-up sent
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        lastFollowUpSent: new Date(),
        followUpCount: { increment: 1 },
      },
    })
    
    return true
  } catch (error) {
    console.error(`Failed to send SMS to ${lead.phone}:`, error.message)
    return false
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting Twilio auto follow-up script...')
  
  try {
    // Get leads that haven't been contacted in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { lastFollowUpSent: null },
          { lastFollowUpSent: { lt: twentyFourHoursAgo } },
        ],
        // Don't contact leads who opted out
        optOut: false,
        // Only contact leads from the last 30 days
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 per run to avoid rate limits
    })
    
    console.log(`Found ${leads.length} leads to follow up with`)
    
    let sentCount = 0
    let errorCount = 0
    
    // Process leads sequentially to avoid rate limits
    for (const lead of leads) {
      console.log(`Processing lead: ${lead.name} (${lead.email})`)
      
      const success = await sendFollowUpSMS(lead)
      
      if (success) {
        sentCount++
      } else {
        errorCount++
      }
      
      // Small delay between messages to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log(`\nSummary:`)
    console.log(`  Total leads processed: ${leads.length}`)
    console.log(`  Messages sent: ${sentCount}`)
    console.log(`  Errors: ${errorCount}`)
    
  } catch (error) {
    console.error('Script failed:', error)
  } finally {
    await prisma.$disconnect()
  }
  
  console.log('Script completed')
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { sendFollowUpSMS }