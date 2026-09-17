import { NextResponse } from 'next/server';
import type { SearchRequest, InterestTag, TravelStyle } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt string is required' }, { status: 400 });
    }

    const text = prompt.toLowerCase();

    // 1. Travelers extraction
    let travelers = 2;
    const travelerMatch = text.match(/(\d+)\s*(people|person|friends|travelers|pax|folks|adults)/i);
    if (travelerMatch) {
      travelers = Math.max(1, parseInt(travelerMatch[1], 10));
    } else if (text.includes('solo')) {
      travelers = 1;
    } else if (text.includes('couple')) {
      travelers = 2;
    } else if (text.includes('family')) {
      travelers = 4;
    }

    // 2. Budget extraction
    let budgetAmount = 30000;
    let budgetScope: 'PER_PERSON' | 'GROUP' = 'PER_PERSON';
    
    // Look for numbers followed by k, lakh, or plain thousands
    const budgetMatch = text.match(/(under|below|within|budget of)?\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(k|thousand|lakh|lac)?\s*(per person|per head|each|total)?/i);
    if (budgetMatch) {
      let num = parseFloat(budgetMatch[2]);
      const unit = budgetMatch[3]?.toLowerCase();
      if (unit === 'k' || unit === 'thousand') {
        num = num * 1000;
      } else if (unit === 'lakh' || unit === 'lac') {
        num = num * 100000;
      } else if (num < 500) {
        num = num * 1000; // e.g. "20k" or "under 20"
      }
      if (num >= 5000) {
        budgetAmount = num;
      }
      if (budgetMatch[4] && (budgetMatch[4].includes('total') || budgetMatch[4].includes('group'))) {
        budgetScope = 'GROUP';
      }
    }

    // 3. Duration days
    let durationDays = 4;
    const durationMatch = text.match(/(\d+)\s*(days?|nights?)/i);
    if (durationMatch) {
      durationDays = Math.max(1, Math.min(30, parseInt(durationMatch[1], 10)));
    } else if (text.includes('weekend')) {
      durationDays = 3;
    } else if (text.includes('week')) {
      durationDays = 7;
    }

    // 4. Origin extraction
    let originPlaceId = 'delhi_in';
    let originLabel = 'New Delhi (DEL)';
    if (text.includes('mumbai') || text.includes('bombay')) {
      originPlaceId = 'mumbai_in';
      originLabel = 'Mumbai (BOM)';
    } else if (text.includes('bangalore') || text.includes('bengaluru')) {
      originPlaceId = 'bengaluru_in';
      originLabel = 'Bengaluru (BLR)';
    } else if (text.includes('hyderabad')) {
      originPlaceId = 'hyderabad_in';
      originLabel = 'Hyderabad (HYD)';
    } else if (text.includes('chennai') || text.includes('madras')) {
      originPlaceId = 'chennai_in';
      originLabel = 'Chennai (MAA)';
    } else if (text.includes('kolkata') || text.includes('calcutta')) {
      originPlaceId = 'kolkata_in';
      originLabel = 'Kolkata (CCU)';
    } else if (text.includes('pune')) {
      originPlaceId = 'pune_in';
      originLabel = 'Pune (PNQ)';
    }

    // 5. Interests
    const interests: InterestTag[] = [];
    if (text.includes('beach') || text.includes('coast') || text.includes('sea')) interests.push('BEACH');
    if (text.includes('mountain') || text.includes('hill') || text.includes('himalaya')) interests.push('MOUNTAINS');
    if (text.includes('party') || text.includes('nightlife') || text.includes('club')) interests.push('NIGHTLIFE');
    if (text.includes('adventure') || text.includes('trek') || text.includes('rafting')) interests.push('ADVENTURE');
    if (text.includes('culture') || text.includes('history') || text.includes('heritage') || text.includes('temple')) interests.push('CULTURE');
    if (text.includes('food') || text.includes('culinary')) interests.push('FOOD');
    if (text.includes('snow') || text.includes('ski')) interests.push('SNOW');
    if (text.includes('relax') || text.includes('peace') || text.includes('spa')) interests.push('RELAXATION');
    if (interests.length === 0) interests.push('BEACH', 'RELAXATION');

    // 6. Style
    let style: TravelStyle = 'COMFORT';
    if (text.includes('backpacker') || text.includes('hostel')) style = 'BACKPACKER';
    else if (text.includes('budget') || text.includes('cheap')) style = 'BUDGET';
    else if (text.includes('luxury') || text.includes('5 star') || text.includes('resort')) style = 'LUXURY';

    // 7. Month
    let month = '10';
    const monthNames: Record<string, string> = {
      january: '01', jan: '01',
      february: '02', feb: '02',
      march: '03', mar: '03',
      april: '04', apr: '04',
      may: '05',
      june: '06', jun: '06',
      july: '07', jul: '07',
      august: '08', aug: '08',
      september: '09', sep: '09',
      october: '10', oct: '10',
      november: '11', nov: '11',
      december: '12', dec: '12',
    };
    for (const [mName, mNum] of Object.entries(monthNames)) {
      if (text.includes(mName)) {
        month = mNum;
        break;
      }
    }

    // 8. Scope
    let tripScope: 'DOMESTIC' | 'INTERNATIONAL' | 'BOTH' = 'BOTH';
    if (text.includes('domestic') || text.includes('india only')) tripScope = 'DOMESTIC';
    else if (text.includes('international') || text.includes('abroad') || text.includes('foreign')) tripScope = 'INTERNATIONAL';

    const parsed: SearchRequest = {
      originPlaceId,
      originLabel,
      travelers,
      budget: {
        amount: budgetAmount,
        currency: 'INR',
        scope: budgetScope,
      },
      durationDays,
      style,
      interests,
      tripScope,
      dates: {
        mode: 'MONTH',
        month,
      },
    };

    return NextResponse.json({
      success: true,
      parsed,
    });
  } catch (err: any) {
    console.error('Parse search error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
