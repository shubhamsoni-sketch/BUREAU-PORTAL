import { JourneyProvider } from './JourneyContext';

export default function ApplyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <JourneyProvider><div style={{ background: '#f8e9b3', color: '#42214f', padding: '7px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>Demo journey only. No real OTP, application submission, or lender offer. Please do not enter real personal details.</div>{children}</JourneyProvider>;
}
