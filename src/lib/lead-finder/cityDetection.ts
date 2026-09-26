export function detectCity(address?: string | null, searchedCity?: string | null) {
  const value = address || '';
  if (!value) return searchedCity || null;
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const searched = (searchedCity || '').toLowerCase();
  const match = parts.find((part) => part.toLowerCase() === searched);
  if (match) return match;
  const mpIndex = parts.findIndex((part) => /madhya pradesh/i.test(part));
  if (mpIndex > 0) return parts[mpIndex - 1]?.replace(/\s+\d{6}\b/, '') || searchedCity || null;
  return searchedCity || null;
}

export function cityMatches(searched?: string | null, detected?: string | null) {
  if (!searched || !detected) return null;
  return searched.trim().toLowerCase() === detected.trim().toLowerCase();
}
