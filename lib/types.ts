// ============================================================
// TripWise AI — Core Domain Types
// ============================================================

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD' | 'THB';
export type TravelStyle = 'BACKPACKER' | 'BUDGET' | 'COMFORT' | 'LUXURY';
export type TripScope = 'DOMESTIC' | 'INTERNATIONAL' | 'BOTH';
export type DateMode = 'EXACT' | 'FLEXIBLE' | 'MONTH' | 'ANYTIME';
export type TransportMode = 'AIR' | 'RAIL' | 'BUS' | 'CAR' | 'BIKE' | 'FERRY';
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type VisaCategory = 'VISA_FREE' | 'EVISA' | 'VISA_ON_ARRIVAL' | 'VISA_REQUIRED' | 'NOT_ADMITTED';
export type ClimateZone = 'TROPICAL' | 'SUBTROPICAL' | 'TEMPERATE' | 'CONTINENTAL' | 'ARID' | 'POLAR' | 'MOUNTAIN';

export type InterestTag =
  | 'BEACH'
  | 'MOUNTAINS'
  | 'ADVENTURE'
  | 'NIGHTLIFE'
  | 'CULTURE'
  | 'FOOD'
  | 'WILDLIFE'
  | 'RELIGIOUS'
  | 'ROMANTIC'
  | 'FAMILY'
  | 'SNOW'
  | 'SHOPPING'
  | 'LUXURY'
  | 'RELAXATION';

// ── Search ────────────────────────────────────────────────────

export interface BudgetInput {
  amount: number;
  currency: Currency;
  scope: 'GROUP' | 'PER_PERSON';
}

export interface DateInput {
  mode: DateMode;
  startDate?: string;    // ISO 8601
  endDate?: string;
  month?: string;        // YYYY-MM
}

export interface SearchRequest {
  searchId?: string;
  originPlaceId: string;
  originLabel: string;
  destinationPlaceId?: string;
  destinationLabel?: string;
  travelers: number;
  budget: BudgetInput;
  dates: DateInput;
  durationDays: number;
  tripScope: TripScope;
  style: TravelStyle;
  interests: InterestTag[];
  passportCountry?: string;
  visaPreference?: 'LOW_FRICTION' | 'ANY';
}

// ── Cost Components ───────────────────────────────────────────

export interface CostRange {
  low: number;
  mid: number;
  high: number;
  currency: Currency;
}

export interface ExpenseBreakdown {
  transport: CostRange;
  accommodation: CostRange;
  food: CostRange;
  localTransport: CostRange;
  activities: CostRange;
  visa?: CostRange;
  insurance?: CostRange;
  contingency: CostRange;
  total: CostRange;
  perPerson: CostRange;
}

// ── Destinations ──────────────────────────────────────────────

export interface Destination {
  id: string;
  slug: string;
  city: string;
  country: string;
  countryCode: string;
  region: string;
  lat: number;
  lng: number;
  airportCodes: string[];
  tags: InterestTag[];
  climateZone: ClimateZone;
  popularityScore: number;
  imageUrl?: string;
  description: string;
  highlights: string[];
  costProfile: DestinationCostProfile;
  seasonProfile: SeasonProfile;
}

export interface DestinationCostProfile {
  style: TravelStyle;
  foodDailyLow: number;
  foodDailyMid: number;
  foodDailyHigh: number;
  localTransitDaily: number;
  activitiesDaily: number;
  hotelNightLow: number;
  hotelNightMid: number;
  hotelNightHigh: number;
  currency: Currency;
  source: string;
  validFrom: string;
}

export interface SeasonProfile {
  [month: string]: {  // "01" - "12"
    weatherScore: number;    // 0-10
    crowdLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK';
    description: string;
  };
}

// ── Recommendations ───────────────────────────────────────────

export interface RecommendationResult {
  destinationId: string;
  destination: Destination;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  estimatedTotal: CostRange;
  perPersonMid: number;
  budgetRemainingMid: number;
  budgetUtilization: number;
  confidence: Confidence;
  bestTransportMode: TransportMode;
  travelTimeHours: number;
  reasons: string[];
  warnings?: string[];
  isOverBudget: boolean;
  overBudgetAmount?: number;
  dataAsOf: string;
  weatherFit: number;
  expenseBreakdown: ExpenseBreakdown;
}

export interface ScoreBreakdown {
  budgetFit: number;
  preferenceMatch: number;
  weatherFit: number;
  travelTimeScore: number;
  visaEase: number;
  dataConfidence: number;
  connectivity: number;
  valueScore: number;
  total: number;
}

export interface SearchResponse {
  searchId: string;
  currency: Currency;
  totalBudget: number;
  perPersonBudget: number;
  results: RecommendationResult[];
  processingMs: number;
  dataAsOf: string;
}

export interface LivePlaceResearch {
  id: string;
  name: string;
  address: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  mapUri: string;
  latitude?: number;
  longitude?: number;
  reviewHighlights: Array<{
    text: string;
    rating?: number;
    published?: string;
    sourceUri?: string;
    author?: string;
    authorUri?: string;
  }>;
}

export interface RedditTravelSignal {
  title: string;
  score: number;
  commentCount: number;
  url: string;
  subreddit: string;
}

export interface IndiaResearchResponse {
  query: string;
  generatedAt: string;
  places: LivePlaceResearch[];
  redditSignals: RedditTravelSignal[];
  sources: {
    openStreetMap: 'LIVE' | 'UNAVAILABLE';
    reddit: 'LIVE' | 'UNAVAILABLE' | 'NOT_CONFIGURED';
  };
  warnings: string[];
}

// ── Transport ─────────────────────────────────────────────────

export interface TransportOption {
  id?: string;
  title?: string;
  mode: TransportMode;
  totalCost: number;
  costPerPerson: number;
  durationMinutes: number;
  stops?: number;
  details: string;
  dataQuality: 'LIVE' | 'CACHED' | 'MODELED' | 'UNAVAILABLE';
  currency: Currency;
  isCheapest?: boolean;
  isFastest?: boolean;
  isBestValue?: boolean;
  badge?: 'FASTEST' | 'CHEAPEST' | 'BEST_VALUE';
  pricingBasis?: 'GROUP' | 'PER_PERSON';
  operator?: string;
  roadBreakdown?: {
    distanceKm: number;
    roundTripDistanceKm?: number;
    fuelCost: number;
    tollEstimate: number;
    vehicleType: string;
    fuelPricePerLiter?: number;
    mileageKmPerLiter?: number;
    tollSource?: 'UNAVAILABLE' | 'MODELED' | 'GOOGLE_ROUTES';
    dataSource?: 'OPENSTREETMAP' | 'MODELED' | 'GOOGLE_ROUTES';
    routeCoordinates?: Array<[number, number]>;
  };
}

export interface RouteComparisonRequest {
  originPlaceId: string;
  originLabel: string;
  destinationPlaceId: string;
  destinationLabel: string;
  travelers: number;
  budget?: BudgetInput;
  dates?: DateInput;
  travelStyle?: TravelStyle;
}

export interface RouteComparisonResponse {
  origin: string;
  destination: string;
  travelers: number;
  options: TransportOption[];
  distanceKm: number;
  currency: Currency;
  dataAsOf: string;
}

// ── Itinerary ─────────────────────────────────────────────────

export interface ItineraryDay {
  day: number;
  date?: string;
  title: string;
  activities: ItineraryActivity[];
  estimatedDayCost: number;
  localTransportCost: number;
  notes?: string;
}

export interface ItineraryActivity {
  id: string;
  time?: string;
  title: string;
  description: string;
  category: 'SIGHTSEEING' | 'FOOD' | 'TRANSPORT' | 'ACCOMMODATION' | 'ACTIVITY' | 'FREE_TIME';
  estimatedCost: number;
  durationMinutes: number;
  placeId?: string;
  locked?: boolean;
}

export interface Itinerary {
  tripId?: string;
  destination: string;
  days: ItineraryDay[];
  totalEstimatedCost: number;
  currency: Currency;
  generatedAt: string;
  version: number;
}

// ── Visa ─────────────────────────────────────────────────────

export interface VisaInfo {
  passportCountry: string;
  destinationCountry: string;
  category: VisaCategory;
  fee?: number;
  feeCurrency?: Currency;
  processingNote?: string;
  sourceUrl?: string;
  verifiedAt?: string;
}

// ── Saved Trip ────────────────────────────────────────────────

export interface SavedTrip {
  id: string;
  ownerId: string;
  origin: string;
  destination: string;
  destinationSlug: string;
  travelers: number;
  budget: BudgetInput;
  durationDays: number;
  style: TravelStyle;
  estimatedTotal: CostRange;
  confidence: Confidence;
  itinerary?: Itinerary;
  createdAt: string;
  updatedAt: string;
  dataTimestamp: string;
}

// ── Location Autocomplete ─────────────────────────────────────

export interface LocationSuggestion {
  placeId: string;
  label: string;
  city: string;
  country: string;
  countryCode: string;
  lat?: number;
  lng?: number;
  type: 'CITY' | 'AIRPORT' | 'REGION';
}

// ── FX ───────────────────────────────────────────────────────

export interface FXRate {
  base: Currency;
  quote: Currency;
  rate: number;
  capturedAt: string;
}
