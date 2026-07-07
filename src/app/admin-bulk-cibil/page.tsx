'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { AlertCircle, CheckCircle2, Download, Eye, FileSpreadsheet, Loader2, RefreshCw, UploadCloud, XCircle } from 'lucide-react';

type UploadRow = {
  name: string;
  pan: string;
  dob: string;
  mobile: string;
  address: string;
  state: string;
  pincode: string;
  gender?: string;
};

type SavedRecord = {
  id: string;
  full_name: string | null;
  mobile: string | null;
  pan: string | null;
  dob: string | null;
  address: string | null;
  state: string | null;
  pin_code: string | null;
  status: string;
  api_status: string | null;
  api_error: string | null;
  credit_score: number | null;
  report_id: string | null;
  report_json: any;
  api_request_json: any;
  api_response_json: any;
  created_at: string;
};

const columnAliases: Record<keyof UploadRow, string[]> = {
  name: ['name', 'full name', 'customer name', 'fullname'],
  pan: ['pan', 'pan no', 'pan number', 'pannumber'],
  dob: ['dob', 'date of birth', 'birth date', 'birthdate'],
  mobile: ['mobile', 'mobile no', 'mobile number', 'phone', 'telephone'],
  address: ['address', 'full address', 'detailed address'],
  state: ['state', 'state name'],
  pincode: ['pincode', 'pin code', 'pin', 'zip'],
  gender: ['gender'],
};

function clean(value: unknown) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function normalizeHeader(value: unknown) {
  return clean(value).toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function pick(row: Record<string, unknown>, field: keyof UploadRow) {
  const normalized = new Map(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]));
  for (const alias of columnAliases[field]) {
    const value = normalized.get(alias);
    if (value !== undefined && value !== null && clean(value)) return clean(value);
  }
  return '';
}

function formatDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return clean(value);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(current);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  row.push(current);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function csvRowsToObjects(text: string) {
  const rows = parseCsv(text);
  const headers = rows[0] || [];
  return rows.slice(1).map((cells) => {
    return headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = cells[index] || '';
      return record;
    }, {});
  });
}

function downloadTemplate() {
  const csv = 'name,pan,dob,mobile,address,state,pincode,gender\\nHARSHAL PAWAR,GEAPP1589H,2000-12-13,7067384810,"Full address",MADHYA PRADESH,450221,male\\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bulk-cibil-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminBulkCibilPage() {
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SavedRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ batch_id: string; total: number; success_count: number; failed_count: number } | null>(null);
  const [error, setError] = useState('');

  const invalidRows = useMemo(() => {
    return rows.filter((row) => !row.name || !row.pan || !row.dob || !row.mobile || !row.address || !row.state || !row.pincode).length;
  }, [rows]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-bulk-cibil');
      const json = await res.json();
      setRecords(json.records || []);
    } catch (err) {
      console.error('[bulk-cibil] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const parseFile = async (file: File) => {
    setError('');
    setResult(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload CSV file. Excel me sheet open karke Save As CSV kar do.');
      return;
    }
    const text = await file.text();
    const jsonRows = csvRowsToObjects(text);
    const parsed = jsonRows.map((row) => ({
      name: pick(row, 'name'),
      pan: pick(row, 'pan').toUpperCase(),
      dob: formatDate(pick(row, 'dob')),
      mobile: pick(row, 'mobile').replace(/\\D/g, '').slice(-10),
      address: pick(row, 'address'),
      state: pick(row, 'state').toUpperCase(),
      pincode: pick(row, 'pincode').replace(/\\D/g, '').slice(0, 6),
      gender: pick(row, 'gender').toLowerCase(),
    }));
    setRows(parsed);
  };

  const startPull = async () => {
    if (!rows.length || invalidRows) return;
    setProcessing(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/admin-bulk-cibil', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Bulk pull failed');
      setResult(json);
      setRows([]);
      await fetchRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk pull failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Admin Bureau Utility</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Bulk CIBIL Pull</h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">Upload Excel-compatible CSV, hit Standard Bureau API row-wise, save full raw JSON in Supabase.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadTemplate} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm">
              <Download size={16} />
              Template
            </button>
            <button onClick={fetchRecords} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-black text-slate-950">Upload Sheet</h2>
            </div>
            <div className="space-y-4 p-5">
              <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 text-center transition hover:bg-blue-50">
                <UploadCloud className="text-blue-700" size={32} />
                <span className="mt-3 text-sm font-black text-slate-950">Select CSV file</span>
                <span className="mt-1 text-xs font-semibold text-slate-600">Required columns: name, pan, dob, mobile, address, state, pincode</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) parseFile(file);
                  }}
                />
              </label>

              {rows.length ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase text-slate-500">Rows</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">{rows.length}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-bold uppercase text-emerald-700">Ready</p>
                    <p className="mt-1 text-2xl font-black text-emerald-700">{rows.length - invalidRows}</p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-bold uppercase text-red-700">Invalid</p>
                    <p className="mt-1 text-2xl font-black text-red-700">{invalidRows}</p>
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                  <AlertCircle size={18} />
                  {error}
                </div>
              ) : null}

              {result ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                  Batch {result.batch_id}: {result.success_count} success, {result.failed_count} failed
                </div>
              ) : null}

              <button
                onClick={startPull}
                disabled={!rows.length || Boolean(invalidRows) || processing}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {processing ? <Loader2 className="animate-spin" size={17} /> : <FileSpreadsheet size={17} />}
                {processing ? 'Running CIBIL Pulls...' : 'Start Standard Bureau Pull'}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h2 className="text-lg font-black text-slate-950">Parsed Preview</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{rows.length} rows</span>
            </div>
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full min-w-[900px]">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    {['Name', 'PAN', 'DOB', 'Mobile', 'State', 'PIN', 'Status'].map((head) => (
                      <th key={head} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => {
                    const valid = row.name && row.pan && row.dob && row.mobile && row.address && row.state && row.pincode;
                    return (
                      <tr key={`${row.pan}-${index}`}>
                        <td className="px-4 py-3 text-sm font-bold text-slate-900">{row.name || '-'}</td>
                        <td className="px-4 py-3 text-sm font-mono text-slate-700">{row.pan || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.dob || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.mobile || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.state || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.pincode || '-'}</td>
                        <td className="px-4 py-3">
                          {valid ? <CheckCircle2 className="text-emerald-600" size={18} /> : <XCircle className="text-red-500" size={18} />}
                        </td>
                      </tr>
                    );
                  })}
                  {!rows.length ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">Upload a sheet to preview rows.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <h2 className="text-lg font-black text-slate-950">Saved Raw JSON Records</h2>
            {loading ? <Loader2 className="animate-spin text-blue-700" size={18} /> : null}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-slate-50">
                <tr>
                  {['Name', 'PAN', 'Mobile', 'Score', 'Status', 'Batch', 'Created', 'Raw'].map((head) => (
                    <th key={head} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{record.full_name || '-'}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-700">{record.pan || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{record.mobile || '-'}</td>
                    <td className="px-4 py-3 text-sm font-black text-slate-900">{record.credit_score ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${record.api_status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {record.api_status || record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-600">{record.api_request_json?.batch_id || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDateTime(record.created_at)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedRecord(record)} className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {!records.length ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">No bulk CIBIL records yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {selectedRecord ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
            <div className="max-h-[86vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <div>
                  <h3 className="text-lg font-black text-slate-950">{selectedRecord.full_name || 'Raw JSON'}</h3>
                  <p className="text-xs font-semibold text-slate-500">{selectedRecord.pan || '-'} · {selectedRecord.mobile || '-'}</p>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold">Close</button>
              </div>
              <pre className="max-h-[70vh] overflow-auto bg-slate-950 p-5 text-xs leading-5 text-slate-100">
                {JSON.stringify(selectedRecord.api_response_json || selectedRecord.report_json, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
