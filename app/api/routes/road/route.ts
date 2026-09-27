import { NextResponse } from 'next/server';
import { getLiveTransportQuotes } from '@/lib/live-transport';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const origin = typeof body.origin === 'string' ? body.origin.trim() : '';
    const destination = typeof body.destination === 'string' ? body.destination.trim() : '';
    const travelers = Number(body.travelers);
    const departureDate = typeof body.departureDate === 'string' ? body.departureDate : undefined;
    const carMileageKmPerLiter = Number(body.carMileageKmPerLiter);
    const bikeMileageKmPerLiter = Number(body.bikeMileageKmPerLiter);
    const fuelPricePerLiter = Number(body.fuelPricePerLiter);

    if (!origin || !destination || !Number.isInteger(travelers) || travelers < 1 || travelers > 20) {
      return NextResponse.json(
        { error: 'origin, destination, and travelers (1–20) are required.' },
        { status: 400 },
      );
    }

    if (!Number.isFinite(carMileageKmPerLiter) || carMileageKmPerLiter <= 0
      || !Number.isFinite(bikeMileageKmPerLiter) || bikeMileageKmPerLiter <= 0
      || !Number.isFinite(fuelPricePerLiter) || fuelPricePerLiter <= 0) {
      return NextResponse.json({ error: 'Positive mileage and fuel price values are required.' }, { status: 400 });
    }

    const result = await getLiveTransportQuotes({
      origin, destination, travelers, departureDate, carMileageKmPerLiter, bikeMileageKmPerLiter, fuelPricePerLiter,
    });
    return NextResponse.json({ success: true, source: 'LIVE_PROVIDERS', ...result });
  } catch (error) {
    console.error('OpenStreetMap road route error:', error);
    return NextResponse.json(
      { error: 'Live road data could not be loaded.', code: 'ROUTES_LOOKUP_FAILED' },
      { status: 502 },
    );
  }
}
