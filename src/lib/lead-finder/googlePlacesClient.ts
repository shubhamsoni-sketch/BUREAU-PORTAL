import type { ProspectInput } from './types';

const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const DETAILS_URL = 'https://places.googleapis.com/v1/places';

function apiKey() {
  const key =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('Data provider key is missing on the server');
  return key;
}

export async function searchPlaceIds(query: string, maxResultCount = 20) {
  const response = await fetch(TEXT_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': 'places.id,nextPageToken',
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: Math.max(1, Math.min(20, maxResultCount)),
    }),
  });
  if (!response.ok) throw new Error(`Data search failed: ${response.status}`);
  const json = await response.json();
  return (json.places || []).map((place: { id?: string }) => place.id).filter(Boolean) as string[];
}

export async function fetchPlaceDetails(
  placeId: string,
  searchedCity: string,
  searchedState: string,
  matchedKeywords: string[]
): Promise<ProspectInput> {
  const fieldMask = [
    'id',
    'displayName',
    'nationalPhoneNumber',
    'internationalPhoneNumber',
    'websiteUri',
    'googleMapsUri',
    'formattedAddress',
    'addressComponents',
    'location',
    'rating',
    'userRatingCount',
    'types',
    'businessStatus',
  ].join(',');
  const response = await fetch(`${DETAILS_URL}/${encodeURIComponent(placeId)}`, {
    headers: {
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': fieldMask,
    },
  });
  if (!response.ok) throw new Error(`Data detail fetch failed: ${response.status}`);
  const place = await response.json();
  return {
    place_id: place.id || placeId,
    business_name: place.displayName?.text || null,
    raw_phone: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
    website: place.websiteUri || null,
    google_maps_url: place.googleMapsUri || null,
    formatted_address: place.formattedAddress || null,
    searched_city: searchedCity,
    searched_state: searchedState,
    rating: typeof place.rating === 'number' ? place.rating : null,
    review_count: typeof place.userRatingCount === 'number' ? place.userRatingCount : null,
    google_types: Array.isArray(place.types) ? place.types : [],
    matched_keywords: matchedKeywords,
    latitude: typeof place.location?.latitude === 'number' ? place.location.latitude : null,
    longitude: typeof place.location?.longitude === 'number' ? place.location.longitude : null,
  };
}
