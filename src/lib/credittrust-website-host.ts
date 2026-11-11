export function isNewCreditTrustWebsite(hostHeader: string | null) {
  const host = hostHeader?.split(':')[0].toLowerCase();
  return !host || host === 'credittrust.in' || host === 'www.credittrust.in' || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app');
}
