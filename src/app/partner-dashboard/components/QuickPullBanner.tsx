'use client';

import React from 'react';
import { FileSearch, ArrowRight, AlertTriangle } from 'lucide-react';

export default function QuickPullBanner() {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white shadow-sm shadow-blue-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <FileSearch size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold">Pull a New Bureau Report</p>
          <p className="text-xs text-blue-100 mt-0.5">Enter customer PAN/Aadhaar, get OTP consent, and generate credit analysis instantly.</p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/30 border border-amber-300/40 rounded-lg">
          <AlertTriangle size={12} className="text-amber-200" />
          <span className="text-xs font-semibold text-amber-100">Low Balance — ₹350</span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors active:scale-95">
          Pull Bureau
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}