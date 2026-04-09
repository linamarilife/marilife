import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendFollowUpSMS } from '@/lib/sms';

export const dynamic = 'force-dynamic';

// Simple authentication token (in production, use a proper auth method)
const CRON_SECRET = process.env.CRON_SECRET || 'marilife-cron-secret-2026';

export async function GET(request: NextRequest) {
  // Check for secret token
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (token !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Find leads that need follow-up:
    // - Created more than 24 hours ago
    // - Have not had a follow-up sent yet (or last follow-up was > 7 days ago)
    // - Not opted out
    // - Have a phone number
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const leads = await prisma.lead.findMany({
      where: {
        phone: { not: '' },
        optOut: false,
        OR: [
          { lastFollowUpSent: null },
          { lastFollowUpSent: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
        createdAt: { lt: twentyFourHoursAgo },
      },
      take: 50, // Limit to 50 per run to avoid rate limits
    });
    
    console.log(`Found ${leads.length} leads needing follow-up SMS`);
    
    const results = [];
    for (const lead of leads) {
      try {
        const smsSent = await sendFollowUpSMS(lead);
        
        if (smsSent) {
          // Update lead with follow-up timestamp
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              lastFollowUpSent: new Date(),
              followUpCount: (lead.followUpCount || 0) + 1,
            },
          });
          results.push({ id: lead.id, phone: lead.phone, status: 'sent' });
        } else {
          results.push({ id: lead.id, phone: lead.phone, status: 'failed' });
        }
      } catch (error) {
        console.error(`Error sending SMS to lead ${lead.id}:`, error);
        results.push({ id: lead.id, phone: lead.phone, status: 'error' });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} leads`,
      results,
      summary: {
        sent: results.filter(r => r.status === 'sent').length,
        failed: results.filter(r => r.status === 'failed').length,
        error: results.filter(r => r.status === 'error').length,
      },
    });
    
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// Also allow POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}