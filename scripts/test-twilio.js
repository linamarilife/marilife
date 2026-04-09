#!/usr/bin/env node

/**
 * Test Twilio Configuration
 * 
 * Usage: node scripts/test-twilio.js
 * 
 * This script tests if Twilio is properly configured
 * by attempting to send a test SMS.
 */

require('dotenv').config({ path: '.env' })

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} = process.env

console.log('🔧 Testing Twilio Configuration...')
console.log('=================================')

// Check if variables exist
console.log('\n📋 Environment Variables:')
console.log(`   TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`)
console.log(`   TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`)
console.log(`   TWILIO_PHONE_NUMBER: ${TWILIO_PHONE_NUMBER ? '✅ Set' : '❌ Missing'}`)

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.error('\n❌ Missing Twilio credentials!')
  console.error('   Please update your .env file with:')
  console.error('   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
  console.error('   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
  console.error('   TWILIO_PHONE_NUMBER=+1561XXXYYYY')
  process.exit(1)
}

// Validate Account SID format
if (!TWILIO_ACCOUNT_SID.startsWith('AC')) {
  console.error('\n❌ Invalid Account SID format!')
  console.error('   Account SID must start with "AC"')
  process.exit(1)
}

// Validate phone number format
if (!TWILIO_PHONE_NUMBER.startsWith('+')) {
  console.error('\n❌ Invalid phone number format!')
  console.error('   Phone number must be in E.164 format: +1561XXXYYYY')
  process.exit(1)
}

console.log('\n✅ Environment variables look good!')

// Test Twilio connection
console.log('\n🔌 Testing Twilio connection...')

async function testTwilio() {
  try {
    const twilio = require('twilio')
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    // First, check account balance
    console.log('   Checking account balance...')
    
    // Try to get account info (will fail if credentials are invalid)
    const account = await client.api.accounts(TWILIO_ACCOUNT_SID).fetch()
    console.log(`   ✅ Account verified: ${account.friendlyName || 'Twilio Account'}`)
    
    // Try to send a test SMS if a test number is provided
    const testNumber = process.argv[2]
    if (testNumber) {
      console.log(`\n📱 Sending test SMS to ${testNumber}...`)
      
      const message = await client.messages.create({
        body: '✅ Twilio test from Marilife ACA Funnel! Your SMS automation is working correctly.',
        from: TWILIO_PHONE_NUMBER,
        to: testNumber,
      })
      
      console.log(`   ✅ Test SMS sent! SID: ${message.sid}`)
      console.log(`   💰 Cost: ~$0.0075 (less than 1 cent)`)
    } else {
      console.log('\n📱 To send a test SMS, run:')
      console.log(`   node scripts/test-twilio.js +1561XXXYYYY`)
      console.log('\n   (Replace with your actual phone number)')
    }
    
    console.log('\n🎉 Twilio configuration is working correctly!')
    console.log('\n🚀 Next steps:')
    console.log('   1. Restart your Next.js server: npm run dev')
    console.log('   2. Test the funnel: http://localhost:3000')
    console.log('   3. Fill out the form with your number')
    console.log('   4. You should receive an SMS within 30 seconds')
    
  } catch (error) {
    console.error('\n❌ Twilio test failed:')
    console.error(`   Error: ${error.message}`)
    
    if (error.code === 20003) {
      console.error('\n💡 Solution: Invalid Account SID or Auth Token')
      console.error('   - Verify your Account SID starts with "AC"')
      console.error('   - Verify your Auth Token is correct')
      console.error('   - Check if you regenerated the Auth Token')
    } else if (error.code === 21211) {
      console.error('\n💡 Solution: Invalid phone number')
      console.error('   - Phone number must be in E.164 format: +1561XXXYYYY')
      console.error('   - Make sure the number is purchased/verified in Twilio')
    } else if (error.code === 21608) {
      console.error('\n💡 Solution: Not enough balance')
      console.error('   - Add funds to your Twilio account')
      console.error('   - SMS cost: ~$0.0075 each')
    }
    
    process.exit(1)
  }
}

testTwilio()