import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DataIntel — Turn Raw Data Into Real Decisions',
  description: 'Self-serve data intelligence platform for fintechs and professionals. Upload, analyze, segment, and act on data — fully offline, instantly.',
};

export default function DataIntelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
