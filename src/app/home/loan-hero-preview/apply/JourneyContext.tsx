'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export type CustomerProfile = {
  name: string;
  email: string;
  mobile: string;
  gender: string;
  pincode: string;
  pan: string;
  dob: string;
  jobType: string;
  income: string;
  purpose: string;
  amount: number;
};

type JourneyContextValue = {
  customerName: string;
  profile: CustomerProfile | null;
  setProfile: (profile: CustomerProfile) => void;
  clearProfile: () => void;
};
const JourneyContext = createContext<JourneyContextValue | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  return <JourneyContext.Provider value={{ customerName: profile?.name ?? '', profile, setProfile, clearProfile: () => setProfile(null) }}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const context = useContext(JourneyContext);
  if (!context) throw new Error('JourneyProvider is required');
  return context;
}
