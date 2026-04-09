require('dotenv').config({ path: '.env' });
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !phoneNumber) {
  console.error('Missing Twilio credentials in .env');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

(async () => {
  try {
    // Fetch the phone number details
    const numbers = await client.incomingPhoneNumbers.list({ phoneNumber });
    if (numbers.length === 0) {
      console.log('Phone number not found in your Twilio account:', phoneNumber);
      return;
    }
    const number = numbers[0];
    console.log('Phone Number:', number.phoneNumber);
    console.log('Friendly Name:', number.friendlyName);
    console.log('Voice URL:', number.voiceUrl);
    console.log('Voice Method:', number.voiceMethod);
    console.log('Voice Fallback URL:', number.voiceFallbackUrl);
    console.log('Voice Application SID:', number.voiceApplicationSid);
    console.log('Status:', number.status);
    console.log('Capabilities:', JSON.stringify(number.capabilities, null, 2));
    
    // Check if voice webhook is set
    if (number.voiceUrl) {
      console.log('\n✅ Voice webhook is set to:', number.voiceUrl);
    } else {
      console.log('\n❌ Voice webhook is NOT set. Please configure in Twilio Console.');
    }
  } catch (error) {
    console.error('Error fetching number details:', error.message);
  }
})();