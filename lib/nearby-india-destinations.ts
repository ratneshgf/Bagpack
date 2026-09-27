import type { Destination, SeasonProfile } from './types';

function yearRound(score = 7): SeasonProfile {
  return Object.fromEntries(Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, '0');
    return [month, { weatherScore: score, crowdLevel: 'MEDIUM' as const, description: 'Check local weather before departure' }];
  }));
}

const budgetProfile = {
  style: 'BUDGET' as const,
  foodDailyLow: 150, foodDailyMid: 350, foodDailyHigh: 700,
  localTransitDaily: 120, activitiesDaily: 250,
  hotelNightLow: 500, hotelNightMid: 1200, hotelNightHigh: 3000,
  currency: 'INR' as const, source: 'INTERNAL_MODEL', validFrom: '2026-01-01',
};

export const NEARBY_INDIA_DESTINATIONS: Destination[] = [
  { id: 'agra_in', slug: 'agra-india', city: 'Agra', country: 'India', countryCode: 'IN', region: 'North India', lat: 27.1767, lng: 78.0081, airportCodes: ['AGR'], tags: ['CULTURE', 'FOOD', 'FAMILY'], climateZone: 'SUBTROPICAL', popularityScore: 8.4, description: 'Historic day-trip city for the Taj Mahal, Agra Fort, and Mughlai food.', highlights: ['Taj Mahal', 'Agra Fort', 'Mehtab Bagh'], costProfile: budgetProfile, seasonProfile: yearRound(7) },
  { id: 'jaipur_in', slug: 'jaipur-india', city: 'Jaipur', country: 'India', countryCode: 'IN', region: 'North India', lat: 26.9124, lng: 75.7873, airportCodes: ['JAI'], tags: ['DESERT', 'CULTURE', 'FOOD', 'SHOPPING'], climateZone: 'ARID', popularityScore: 8.8, description: 'Pink City break with forts, bazaars, and Rajasthan culture.', highlights: ['Amber Fort', 'Hawa Mahal', 'City Palace'], costProfile: budgetProfile, seasonProfile: yearRound(7) },
  { id: 'nainital_in', slug: 'nainital-india', city: 'Nainital', country: 'India', countryCode: 'IN', region: 'North India', lat: 29.3803, lng: 79.4636, airportCodes: ['PGH'], tags: ['MOUNTAINS', 'RELAXATION', 'ADVENTURE', 'FAMILY'], climateZone: 'MOUNTAIN', popularityScore: 8.3, description: 'Lake-side Himalayan getaway with short hikes and boating.', highlights: ['Naini Lake', 'Snow View Point', 'Mall Road'], costProfile: budgetProfile, seasonProfile: yearRound(7) },
  { id: 'mussoorie_in', slug: 'mussoorie-india', city: 'Mussoorie', country: 'India', countryCode: 'IN', region: 'North India', lat: 30.4598, lng: 78.0644, airportCodes: ['DED'], tags: ['MOUNTAINS', 'RELAXATION', 'ADVENTURE'], climateZone: 'MOUNTAIN', popularityScore: 8.2, description: 'Hill-station escape known for viewpoints, walks, and waterfalls.', highlights: ['Kempty Falls', 'Mall Road', 'Lal Tibba'], costProfile: budgetProfile, seasonProfile: yearRound(7) },
  { id: 'alibaug_in', slug: 'alibaug-india', city: 'Alibaug', country: 'India', countryCode: 'IN', region: 'West India', lat: 18.6414, lng: 72.8722, airportCodes: ['BOM'], tags: ['BEACH', 'RELAXATION', 'FAMILY', 'FOOD'], climateZone: 'TROPICAL', popularityScore: 7.9, description: 'Easy coastal break near Mumbai with beaches and sea forts.', highlights: ['Alibaug Beach', 'Kolaba Fort', 'Kihim Beach'], costProfile: budgetProfile, seasonProfile: yearRound(7) },
  { id: 'pondicherry_in', slug: 'pondicherry-india', city: 'Pondicherry', country: 'India', countryCode: 'IN', region: 'South India', lat: 11.9416, lng: 79.8083, airportCodes: ['MAA'], tags: ['BEACH', 'CULTURE', 'FOOD', 'RELAXATION'], climateZone: 'TROPICAL', popularityScore: 8.0, description: 'French-quarter streets, coastal cafés, and calm beach time.', highlights: ['Promenade Beach', 'White Town', 'Auroville'], costProfile: budgetProfile, seasonProfile: yearRound(7) },
  { id: 'gokarna_in', slug: 'gokarna-india', city: 'Gokarna', country: 'India', countryCode: 'IN', region: 'South India', lat: 14.5479, lng: 74.3188, airportCodes: ['GOI'], tags: ['BEACH', 'ADVENTURE', 'RELAXATION'], climateZone: 'TROPICAL', popularityScore: 8.1, description: 'Low-key Karnataka beach town with coastal treks and temples.', highlights: ['Om Beach', 'Kudle Beach', 'Coastal Trek'], costProfile: budgetProfile, seasonProfile: yearRound(7) },
];
