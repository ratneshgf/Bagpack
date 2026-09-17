// ============================================================
// TripWise AI — Recommendation Engine
// Deterministic scoring, candidate generation, ranking
// ============================================================

import type {
  SearchRequest, RecommendationResult, ScoreBreakdown,
  Destination, TripScope, InterestTag,
} from './types';
import { DESTINATIONS, getWeatherScore } from './destinations';
import { estimateExpenseBreakdown, normalizeBudget, generateTransportOptions } from './cost-engine';

// ── Score Weights (config-driven) ────────────────────────────

const WEIGHTS = {
  budgetFit: 0.35,
  preferenceMatch: 0.18,
  weatherFit: 0.12,
  travelTimeScore: 0.10,
  visaEase: 0.08,
  dataConfidence: 0.07,
  connectivity: 0.05,
  valueScore: 0.05,
} as const;

// ── Distance Lookup (origin → destination, km, approximate) ──

const DISTANCE_FROM_INDIA_KM: Record<string, number> = {
  goa_in: 1200,
  manali_in: 600,
  jaisalmer_in: 800,
  rishikesh_in: 300,
  varanasi_in: 700,
  darjeeling_in: 1500,
  bangkok_th: 3000,
  bali_id: 4500,
  dubai_ae: 2200,
  singapore_sg: 4200,
  phuket_th: 3200,
  kathmandu_np: 1200,
  colombo_lk: 2800,
  kuala_lumpur_my: 4100,
  tokyo_jp: 5800,
  paris_fr: 7200,
  maldives_mv: 2000,
};

// ── Visa Ease Score ───────────────────────────────────────────

const VISA_EASE_SCORES: Record<string, number> = {
  IN: 10, // domestic
  TH: 9,  // visa-free
  ID: 9,  // visa-free
  AE: 8,  // eVisa/VoA
  NP: 10, // visa-free
  LK: 8,  // eVisa
  MY: 9,  // visa-free
  JP: 9,  // visa-free (post-2024)
  MV: 9,  // visa-free
  SG: 6,  // requires eVisa
  FR: 3,  // Schengen visa
};

function getVisaEaseScore(countryCode: string): number {
  return VISA_EASE_SCORES[countryCode] ?? 5;
}

// ── Candidate Generation ──────────────────────────────────────

function getCandidateDestinations(request: SearchRequest): Destination[] {
  const { tripScope } = request;
  return DESTINATIONS.filter(d => {
    if (tripScope === 'DOMESTIC') return d.countryCode === 'IN';
    if (tripScope === 'INTERNATIONAL') return d.countryCode !== 'IN';
    return true; // BOTH
  });
}

// ── Interest Matching ─────────────────────────────────────────

function scoreInterestMatch(destination: Destination, interests: InterestTag[]): number {
  if (interests.length === 0) return 0.5;
  const matches = interests.filter(tag => destination.tags.includes(tag)).length;
  return Math.min(matches / interests.length, 1);
}

// ── Budget Fit Function ───────────────────────────────────────

function scoreBudgetFit(utilization: number): number {
  if (utilization < 0.70) return 0.6;
  if (utilization < 0.80) return 0.8;
  if (utilization < 0.95) return 1.0;  // sweet spot
  if (utilization < 1.00) return 0.85;
  if (utilization < 1.10) return 0.4;  // stretch
  return 0;                             // over 110% → excluded
}

// ── Travel Time Score ─────────────────────────────────────────

function scoreTravelTime(distanceKm: number, durationDays: number): number {
  const estimatedHours = distanceKm / 800 + 3; // rough air time
  const tripHours = durationDays * 24;
  const travelRatio = (estimatedHours * 2) / tripHours;
  if (travelRatio < 0.1) return 1.0;
  if (travelRatio < 0.25) return 0.8;
  if (travelRatio < 0.4) return 0.6;
  return 0.3;
}

// ── Main Ranking ──────────────────────────────────────────────

export function generateRecommendations(request: SearchRequest): RecommendationResult[] {
  const candidates = getCandidateDestinations(request);
  const { total: totalBudget, perPerson: perPersonBudget } = normalizeBudget(
    request.budget.amount,
    request.budget.currency,
    request.budget.scope,
    request.travelers,
  );

  // Get current month for weather scoring
  const currentMonth = new Date().toISOString().slice(5, 7);
  const targetMonth = request.dates.month
    ? request.dates.month.slice(5, 7)
    : (request.dates.startDate?.slice(5, 7) ?? currentMonth);

  const results: RecommendationResult[] = [];

  for (const dest of candidates) {
    try {
      const distanceKm = DISTANCE_FROM_INDIA_KM[dest.id] ?? 2000;
      const isInternational = dest.countryCode !== 'IN';
      const bestMode = distanceKm > 500 || isInternational ? 'AIR' : 'AIR';

      const breakdown = estimateExpenseBreakdown({
        destinationId: dest.id,
        travelers: request.travelers,
        durationDays: request.durationDays,
        style: request.style,
        originCountry: 'IN',
        isInternational,
        transportMode: bestMode,
        distanceKm,
      });

      const midTotal = breakdown.total.mid;
      const utilization = midTotal / totalBudget;
      const budgetFitScore = scoreBudgetFit(utilization);

      // Skip if way over budget
      if (utilization > 1.10) continue;

      // Score components
      const weatherScore = getWeatherScore(dest, targetMonth) / 10;
      const interestScore = scoreInterestMatch(dest, request.interests);
      const travelTimeScore = scoreTravelTime(distanceKm, request.durationDays);
      const visaEaseRaw = getVisaEaseScore(dest.countryCode) / 10;
      const visaEaseScore = request.visaPreference === 'LOW_FRICTION' ? visaEaseRaw : visaEaseRaw * 0.7 + 0.3;
      const dataConfidence = 0.7; // modeled data
      const connectivity = Math.min(dest.airportCodes.length / 3, 1);
      const valueScore = Math.min(1 - (midTotal / totalBudget) * 0.5, 1);

      const scoreBreakdown: ScoreBreakdown = {
        budgetFit: budgetFitScore * WEIGHTS.budgetFit,
        preferenceMatch: interestScore * WEIGHTS.preferenceMatch,
        weatherFit: weatherScore * WEIGHTS.weatherFit,
        travelTimeScore: travelTimeScore * WEIGHTS.travelTimeScore,
        visaEase: visaEaseScore * WEIGHTS.visaEase,
        dataConfidence: dataConfidence * WEIGHTS.dataConfidence,
        connectivity: connectivity * WEIGHTS.connectivity,
        valueScore: valueScore * WEIGHTS.valueScore,
        total: 0,
      };
      scoreBreakdown.total =
        scoreBreakdown.budgetFit +
        scoreBreakdown.preferenceMatch +
        scoreBreakdown.weatherFit +
        scoreBreakdown.travelTimeScore +
        scoreBreakdown.visaEase +
        scoreBreakdown.dataConfidence +
        scoreBreakdown.connectivity +
        scoreBreakdown.valueScore;

      const isOverBudget = midTotal > totalBudget;
      const budgetRemainingMid = totalBudget - midTotal;

      // Reasons
      const reasons: string[] = [];
      if (budgetFitScore > 0.8) reasons.push(`Strong budget fit — ₹${Math.abs(budgetRemainingMid).toLocaleString()} ${isOverBudget ? 'over' : 'remaining'}`);
      if (interestScore > 0.6) reasons.push(`Matches your interests: ${request.interests.slice(0, 2).join(', ').toLowerCase()}`);
      if (weatherScore > 0.7) reasons.push(`Great ${targetMonth ? new Date(0, parseInt(targetMonth) - 1).toLocaleString('default', { month: 'long' }) : ''} weather`);
      if (visaEaseScore > 0.7) reasons.push(`Easy entry for Indian passport`);
      if (valueScore > 0.7) reasons.push(`Excellent value for money`);
      if (reasons.length === 0) reasons.push(`Feasible within budget`);

      const warnings: string[] = [];
      if (utilization > 0.95) warnings.push('Tight on budget — minimal contingency buffer');
      if (weatherScore < 0.5) warnings.push('Suboptimal weather for this period');
      if (distanceKm > 4000 && request.durationDays < 5) warnings.push('Long travel time relative to trip duration');

      const travelTimeHours = isInternational ? distanceKm / 800 + 3 : distanceKm / 600 + 1;

      results.push({
        destinationId: dest.id,
        destination: dest,
        score: Math.round(scoreBreakdown.total * 100) / 100,
        scoreBreakdown,
        estimatedTotal: breakdown.total,
        perPersonMid: breakdown.perPerson.mid,
        budgetRemainingMid,
        budgetUtilization: Math.round(utilization * 100),
        confidence: 'MEDIUM',
        bestTransportMode: bestMode,
        travelTimeHours: Math.round(travelTimeHours * 10) / 10,
        reasons: reasons.slice(0, 3),
        warnings: warnings.length > 0 ? warnings : undefined,
        isOverBudget,
        overBudgetAmount: isOverBudget ? Math.abs(budgetRemainingMid) : undefined,
        dataAsOf: new Date().toISOString(),
        weatherFit: Math.round(weatherScore * 10),
        expenseBreakdown: breakdown,
      });
    } catch {
      // Skip destinations that error in estimation
      continue;
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, 12);
}

export const getRecommendations = generateRecommendations;
