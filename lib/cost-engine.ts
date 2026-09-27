// ============================================================
// TripWise AI — Deterministic Cost Estimation Engine
// All prices in INR base, converted via FX at request time
// ============================================================

import type {
  SearchRequest, ExpenseBreakdown, CostRange, Currency,
  TravelStyle, TransportMode, TransportOption,
} from './types';
import { getDestinationById } from './destinations';

// ── Constants ─────────────────────────────────────────────────

const STYLE_FOOD_MULTIPLIERS: Record<TravelStyle, number> = {
  BACKPACKER: 0.6,
  BUDGET: 1.0,
  COMFORT: 1.8,
  LUXURY: 3.5,
};

const STYLE_HOTEL_MULTIPLIERS: Record<TravelStyle, number> = {
  BACKPACKER: 0.5,
  BUDGET: 1.0,
  COMFORT: 1.7,
  LUXURY: 4.0,
};

const OCCUPANCY_PER_ROOM = 2; // default 2 travelers per room
const CONTINGENCY_PERCENT = 0.10;
const INSURANCE_PER_PERSON_INR = 500; // ~₹500/person for international

// ── Road Cost Parameters ──────────────────────────────────────

const FUEL_PRICE_INR_PER_LITER = 105; // petrol, India average
const CAR_FUEL_EFFICIENCY_KM_PER_L = 15;
const BIKE_FUEL_EFFICIENCY_KM_PER_L = 45;
const TOLL_RATE_INR_PER_KM = 2.0; // approximate highway toll average
const ROAD_SPEED_KM_PER_H = 60;
const BIKE_SPEED_KM_PER_H = 50;

// ── Air Travel Modeled Fares (INR per person, one-way, economy) ─

const MODELED_AIR_FARES: Record<string, Record<string, number>> = {
  'IN': {
    'IN': 3500,    // domestic India
    'TH': 8000,   // India → Thailand
    'ID': 9500,   // India → Bali
    'AE': 7000,   // India → Dubai
    'SG': 9000,   // India → Singapore
    'NP': 5000,   // India → Nepal
    'LK': 6000,   // India → Sri Lanka
    'MY': 9000,   // India → Malaysia
    'JP': 18000,  // India → Japan
    'FR': 35000,  // India → France
    'MV': 8000,   // India → Maldives
    DEFAULT: 12000,
  },
};

function getModeledAirFare(fromCountry: string, toCountry: string): number {
  const fares = MODELED_AIR_FARES[fromCountry] ?? MODELED_AIR_FARES['IN'];
  return fares[toCountry] ?? (fares as Record<string, number>).DEFAULT ?? 12000;
}

// ── FX Rates (hardcoded fallback, refreshed via API in production) ─

export const FX_RATES_TO_INR: Record<string, number> = {
  INR: 1,
  USD: 84,
  EUR: 92,
  GBP: 107,
  AED: 22.9,
  SGD: 63,
  THB: 2.4,
  IDR: 0.0053,
  NPR: 0.75,
  LKR: 0.28,
  MYR: 19,
  JPY: 0.56,
};

export function convertToINR(amount: number, currency: string): number {
  const rate = FX_RATES_TO_INR[currency] ?? 1;
  return Math.round(amount * rate);
}

// ── Core Cost Estimation ──────────────────────────────────────

export interface CostEstimationInput {
  destinationId: string;
  travelers: number;
  durationDays: number;
  style: TravelStyle;
  originCountry: string;
  isInternational: boolean;
  transportMode?: TransportMode;
  distanceKm?: number;
  targetMonth?: string;
}

export function estimateExpenseBreakdown(input: CostEstimationInput): ExpenseBreakdown {
  const dest = getDestinationById(input.destinationId);
  if (!dest) throw new Error(`Destination not found: ${input.destinationId}`);

  const { travelers, durationDays, style } = input;
  // A one-day outing has no overnight accommodation cost.
  const nights = Math.max(durationDays - 1, 0);
  const foodMult = STYLE_FOOD_MULTIPLIERS[style];
  const hotelMult = STYLE_HOTEL_MULTIPLIERS[style];
  const cp = dest.costProfile;

  // ── Accommodation ─────────────────────────────────────────
  const rooms = Math.ceil(travelers / OCCUPANCY_PER_ROOM);
  const hotelLow = convertToINR(cp.hotelNightLow * hotelMult, cp.currency) * rooms * nights;
  const hotelMid = convertToINR(cp.hotelNightMid * hotelMult, cp.currency) * rooms * nights;
  const hotelHigh = convertToINR(cp.hotelNightHigh * hotelMult, cp.currency) * rooms * nights;
  const accommodation: CostRange = {
    low: hotelLow,
    mid: hotelMid,
    high: hotelHigh,
    currency: 'INR',
  };

  // ── Food ──────────────────────────────────────────────────
  const foodLowDaily = convertToINR(cp.foodDailyLow * foodMult, cp.currency) * travelers;
  const foodMidDaily = convertToINR(cp.foodDailyMid * foodMult, cp.currency) * travelers;
  const foodHighDaily = convertToINR(cp.foodDailyHigh * foodMult, cp.currency) * travelers;
  const food: CostRange = {
    low: Math.round(foodLowDaily * durationDays * 0.85),
    mid: Math.round(foodMidDaily * durationDays),
    high: Math.round(foodHighDaily * durationDays * 1.2),
    currency: 'INR',
  };

  // ── Local Transport ───────────────────────────────────────
  const localDailyPerPerson = convertToINR(cp.localTransitDaily, cp.currency);
  const localTransport: CostRange = {
    low: Math.round(localDailyPerPerson * travelers * durationDays * 0.7),
    mid: Math.round(localDailyPerPerson * travelers * durationDays),
    high: Math.round(localDailyPerPerson * travelers * durationDays * 1.4),
    currency: 'INR',
  };

  // ── Activities ────────────────────────────────────────────
  const actDailyPerPerson = convertToINR(cp.activitiesDaily, cp.currency);
  const activities: CostRange = {
    low: Math.round(actDailyPerPerson * travelers * durationDays * 0.5),
    mid: Math.round(actDailyPerPerson * travelers * durationDays),
    high: Math.round(actDailyPerPerson * travelers * durationDays * 1.8),
    currency: 'INR',
  };

  // ── Transport (Long-distance) ──────────────────────────────
  const transport = estimateTransportCost(input, travelers);

  // ── Visa / Insurance (international only) ─────────────────
  let visa: CostRange | undefined;
  let insurance: CostRange | undefined;
  if (input.isInternational) {
    const visaFeePerPerson = getModeledVisaFee(dest.countryCode);
    visa = {
      low: visaFeePerPerson * travelers,
      mid: visaFeePerPerson * travelers,
      high: Math.round(visaFeePerPerson * travelers * 1.2),
      currency: 'INR',
    };
    insurance = {
      low: INSURANCE_PER_PERSON_INR * travelers,
      mid: Math.round(INSURANCE_PER_PERSON_INR * 1.5 * travelers),
      high: INSURANCE_PER_PERSON_INR * 2 * travelers,
      currency: 'INR',
    };
  }

  // ── Totals ────────────────────────────────────────────────
  const sumLow = transport.low + accommodation.low + food.low + localTransport.low +
    activities.low + (visa?.low ?? 0) + (insurance?.low ?? 0);
  const sumMid = transport.mid + accommodation.mid + food.mid + localTransport.mid +
    activities.mid + (visa?.mid ?? 0) + (insurance?.mid ?? 0);
  const sumHigh = transport.high + accommodation.high + food.high + localTransport.high +
    activities.high + (visa?.high ?? 0) + (insurance?.high ?? 0);

  const contingency: CostRange = {
    low: Math.round(sumLow * CONTINGENCY_PERCENT),
    mid: Math.round(sumMid * CONTINGENCY_PERCENT),
    high: Math.round(sumHigh * CONTINGENCY_PERCENT),
    currency: 'INR',
  };

  const total: CostRange = {
    low: sumLow + contingency.low,
    mid: sumMid + contingency.mid,
    high: sumHigh + contingency.high,
    currency: 'INR',
  };

  const perPerson: CostRange = {
    low: Math.round(total.low / travelers),
    mid: Math.round(total.mid / travelers),
    high: Math.round(total.high / travelers),
    currency: 'INR',
  };

  return {
    transport,
    accommodation,
    food,
    localTransport,
    activities,
    visa,
    insurance,
    contingency,
    total,
    perPerson,
  };
}

// ── Transport Cost Estimation ─────────────────────────────────

function estimateTransportCost(input: CostEstimationInput, travelers: number): CostRange {
  const mode = input.transportMode ?? (input.isInternational ? 'AIR' : 'AIR');
  const dist = input.distanceKm ?? (input.isInternational ? 3000 : 1500);

  if (mode === 'AIR') {
    const farePerPerson = getModeledAirFare(input.originCountry, getDestinationById(input.destinationId)?.countryCode ?? 'IN');
    const total = farePerPerson * travelers * 2; // round trip
    return {
      low: Math.round(total * 0.8),
      mid: total,
      high: Math.round(total * 1.3),
      currency: 'INR',
    };
  }

  if (mode === 'CAR') {
    return calculateRoadCost(dist, travelers, 'CAR');
  }

  if (mode === 'BIKE') {
    return calculateRoadCost(dist, travelers, 'BIKE');
  }

  if (mode === 'RAIL') {
    const farePerPerson = Math.round(dist * 0.8); // ~₹0.8/km sleeper average
    const total = farePerPerson * travelers * 2;
    return {
      low: Math.round(total * 0.9),
      mid: total,
      high: Math.round(total * 1.3),
      currency: 'INR',
    };
  }

  if (mode === 'BUS') {
    const farePerPerson = Math.round(dist * 0.5);
    const total = farePerPerson * travelers * 2;
    return {
      low: Math.round(total * 0.85),
      mid: total,
      high: Math.round(total * 1.2),
      currency: 'INR',
    };
  }

  return { low: 5000, mid: 8000, high: 12000, currency: 'INR' };
}

// ── Road Cost Formula ─────────────────────────────────────────

export function calculateRoadCost(distanceKm: number, travelers: number, mode: 'CAR' | 'BIKE'): CostRange {
  const efficiency = mode === 'CAR' ? CAR_FUEL_EFFICIENCY_KM_PER_L : BIKE_FUEL_EFFICIENCY_KM_PER_L;
  const fuelCost = (distanceKm / efficiency) * FUEL_PRICE_INR_PER_LITER * 2; // round trip
  const tollCost = mode === 'CAR' ? distanceKm * TOLL_RATE_INR_PER_KM * 2 : distanceKm * 0.5 * 2;
  const parkingCost = mode === 'CAR' ? 200 : 50; // per day estimate at destination
  const totalShared = fuelCost + tollCost + parkingCost;
  const costPerPerson = totalShared / travelers;
  return {
    low: Math.round(totalShared * 0.9),
    mid: Math.round(totalShared),
    high: Math.round(totalShared * 1.15),
    currency: 'INR',
  };
}

// ── Transport Options for Route Comparison ────────────────────

export function generateTransportOptions(
  distanceKm: number,
  travelers: number,
  isInternational: boolean,
  originCountry: string,
  destCountry: string,
): TransportOption[] {
  const options: TransportOption[] = [];

  // Air
  if (isInternational || distanceKm > 500) {
    const farePerPerson = getModeledAirFare(originCountry, destCountry);
    const airTotal = farePerPerson * travelers * 2;
    const airDuration = Math.round((distanceKm / 800) * 60 + 180); // flight + 3hr airport
    options.push({
      id: 'opt-air',
      title: isInternational ? 'Commercial Direct Flight' : 'Scheduled Domestic Flight',
      operator: isInternational ? 'Indigo / Air India / Scoot' : 'Indigo / Air India Express',
      mode: 'AIR',
      totalCost: airTotal,
      costPerPerson: Math.round(airTotal / travelers),
      durationMinutes: airDuration,
      stops: distanceKm > 3000 ? 1 : 0,
      details: `Modeled economy fare × ${travelers} pax (return)`,
      dataQuality: 'MODELED',
      currency: 'INR',
      pricingBasis: 'PER_PERSON',
    });
  }

  // Rail (domestic only)
  if (!isInternational) {
    const railFare = Math.round(distanceKm * 0.8);
    const railTotal = railFare * travelers * 2;
    const railDuration = Math.round((distanceKm / 80) * 60);
    options.push({
      id: 'opt-rail',
      title: 'Indian Railways Express (3AC / Sleeper)',
      operator: 'IRCTC Superfast / Vande Bharat',
      mode: 'RAIL',
      totalCost: railTotal,
      costPerPerson: Math.round(railTotal / travelers),
      durationMinutes: railDuration,
      details: `Sleeper / 3AC class, avg ₹${railFare}/person one-way`,
      dataQuality: 'MODELED',
      currency: 'INR',
      pricingBasis: 'PER_PERSON',
    });
  }

  // Bus (domestic only, shorter routes)
  if (!isInternational && distanceKm < 600) {
    const busFare = Math.round(distanceKm * 0.5);
    const busTotal = busFare * travelers * 2;
    const busDuration = Math.round((distanceKm / 55) * 60);
    options.push({
      id: 'opt-bus',
      title: 'Intercity AC Volvo Sleeper',
      operator: 'IntrCity SmartBus / Zingbus / KSRTC',
      mode: 'BUS',
      totalCost: busTotal,
      costPerPerson: Math.round(busTotal / travelers),
      durationMinutes: busDuration,
      details: `State bus / coach, avg ₹${busFare}/person one-way`,
      dataQuality: 'MODELED',
      currency: 'INR',
      pricingBasis: 'PER_PERSON',
    });
  }

  // Car
  if (!isInternational) {
    const carCost = calculateRoadCost(distanceKm, travelers, 'CAR');
    const carDuration = Math.round((distanceKm / ROAD_SPEED_KM_PER_H) * 60);
    const roundtripDist = distanceKm * 2;
    const fuelCost = Math.round((roundtripDist / CAR_FUEL_EFFICIENCY_KM_PER_L) * FUEL_PRICE_INR_PER_LITER);
    const tollEstimate = Math.round(roundtripDist * TOLL_RATE_INR_PER_KM);

    options.push({
      id: 'opt-car',
      title: 'Road Trip (Self-Drive / Group SUV)',
      operator: 'Personal Car / Zoomcar SUV',
      mode: 'CAR',
      totalCost: carCost.mid,
      costPerPerson: Math.round(carCost.mid / travelers),
      durationMinutes: carDuration,
      details: `Shared car — fuel + tolls (${distanceKm} km × 2 ways, split ${travelers} ways)`,
      dataQuality: 'MODELED',
      currency: 'INR',
      pricingBasis: 'GROUP',
      roadBreakdown: {
        distanceKm,
        fuelCost,
        tollEstimate,
        vehicleType: travelers > 4 ? '7_SEATER_SUV' : 'SEDAN_HATCHBACK',
      },
    });
  }

  // Bike
  if (!isInternational && distanceKm < 800) {
    const bikeCost = calculateRoadCost(distanceKm, travelers, 'BIKE');
    const bikeDuration = Math.round((distanceKm / BIKE_SPEED_KM_PER_H) * 60);
    options.push({
      id: 'opt-bike',
      title: 'Motorcycle Road Expedition',
      operator: 'Self-Ride / Royal Enfield Rental',
      mode: 'BIKE',
      totalCost: bikeCost.mid,
      costPerPerson: Math.round(bikeCost.mid / travelers),
      durationMinutes: bikeDuration,
      details: `Motorcycle — fuel only, no toll (${distanceKm} km × 2 ways)`,
      dataQuality: 'MODELED',
      currency: 'INR',
      pricingBasis: 'GROUP',
    });
  }

  // Sort by cost and label
  options.sort((a, b) => a.totalCost - b.totalCost);
  if (options.length > 0) {
    options[0].isCheapest = true;
    options[0].badge = 'CHEAPEST';
  }
  const fastest = [...options].sort((a, b) => a.durationMinutes - b.durationMinutes)[0];
  if (fastest) {
    fastest.isFastest = true;
    if (!fastest.badge) fastest.badge = 'FASTEST';
  }
  // Best value: cheapest per minute of saving
  const bestVal = options.find((o) => o.mode === 'CAR') ?? options[0];
  if (bestVal && !bestVal.badge) {
    bestVal.isBestValue = true;
    bestVal.badge = 'BEST_VALUE';
  }

  return options;
}

// ── Modeled Visa Fees (INR equivalent, Indian passport) ───────

function getModeledVisaFee(countryCode: string): number {
  const VISA_FEES: Record<string, number> = {
    TH: 0,    // visa-free for Indians
    ID: 0,    // visa-free 30 days (2024)
    AE: 0,    // visa on arrival / eVisa ≈ ₹0 landing fee
    SG: 2000, // eVisa required ≈ SGD 30
    NP: 0,    // visa-free
    LK: 1200, // eVisa ≈ USD 15
    MY: 0,    // visa-free
    JP: 0,    // visa-free from 2024
    FR: 7000, // Schengen visa ≈ EUR 80
    MV: 0,    // visa-free
    IN: 0,    // domestic
  };
  return VISA_FEES[countryCode] ?? 3000;
}

// ── Budget Normalization ──────────────────────────────────────

export function normalizeBudget(amount: number, currency: Currency, scope: 'GROUP' | 'PER_PERSON', travelers: number) {
  const inINR = convertToINR(amount, currency);
  const total = scope === 'PER_PERSON' ? inINR * travelers : inINR;
  const perPerson = scope === 'PER_PERSON' ? inINR : Math.round(inINR / travelers);
  return { total, perPerson };
}

// ── Confidence Scoring ────────────────────────────────────────

export function calculateConfidence(
  hasLiveTransport: boolean,
  hasLiveAccom: boolean,
  dataAgeDays: number,
): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (hasLiveTransport && hasLiveAccom && dataAgeDays < 1) return 'HIGH';
  if (dataAgeDays < 7) return 'MEDIUM';
  return 'LOW';
}

// ── Format helpers ────────────────────────────────────────────

export function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}
