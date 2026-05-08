'use client';

import React from 'react';
import { UserPlus, Download, Upload } from 'lucide-react';

export default function PartnersHeader() {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Partner Management</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage DSA agents, view wallet balances, and control platform access.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-150 active:scale-95">
          <Upload size={14} />
          Import
        </button>
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-150 active:scale-95">
          <Download size={14} />
          Export
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-150 active:scale-95 shadow-sm shadow-blue-200">
          <UserPlus size={14} />
          Add Partner
        </button>
      </div>
    </div>
  );
}