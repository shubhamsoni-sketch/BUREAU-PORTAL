export default function ApiConsolePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">CreditTrust API</p>
        <h1 className="mt-4 text-3xl font-bold">API access only</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          This host is reserved for secured server-to-server API traffic. Browser console access is not available here.
        </p>
      </div>
    </main>
  );
}
