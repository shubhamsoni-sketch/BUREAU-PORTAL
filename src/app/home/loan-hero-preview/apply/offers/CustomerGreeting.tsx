'use client';

import { useJourney } from '../JourneyContext';

export default function CustomerGreeting() {
  const { customerName } = useJourney();
  return <h2>Hi, {customerName || 'there'}</h2>;
}

export function CustomerProfileName() {
  const { customerName } = useJourney();
  return <strong>{customerName || 'Guest customer'}</strong>;
}
