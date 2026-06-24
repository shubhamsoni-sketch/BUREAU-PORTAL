'use client';

import React, { useEffect, useState } from 'react';
import EligibilityReportContent from '../../eligibility-report/components/EligibilityReportContent';

type MainTab = 'queue' | 'reports';
type EligibilityMode = 'mobile_advanced' | 'full_details';
type QueueTab = 'pending' | 'checked';
type LoanType = 'home_loan' | 'personal_loan' | 'business_loan' | 'lap' | 'car_loan';

interface EligibilityForm {
  firstName: string;
  lastName: string;
  mobile: string;
  dob: string;
  pan: string;
  address: string;
  pincode: string;
  state: string;
  gender: string;
  monthlyIncome: string;
  otherIncome: string;
  existingEMI: string;
  loanType: LoanType | '';
  loanAmount: string;
  tenure: string;
}

interface EligibilityResult {
  eligible: boolean;
  score: number;
  scoreGrade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  maxLoanAmount: number;
  recommendedEMI: number;
  foir: number;
  remarks: string[];
  matchedLenders: { name: string; roi: string; maxLoan: string }[];
  rawBureauResponse?: unknown;
}

interface QueueLead {
  id: string;
  name: string;
  mobile: string;
  product: LoanType | 'credit_card' | string;
  loanAmount: number;
  stage: string;
  assignedAgent: string;
  city: string;
  nextFollowUp: string;
  eligibilityReportId?: string;
  selectedLender?: string;
  updatedAt?: string;
}

interface ReportSummary {
  id: string;
  score: number | null;
  eligible: boolean;
  status: string;
  created_at: string;
}

const emptyForm: EligibilityForm = {
  firstName: '',
  lastName: '',
  mobile: '',
  dob: '',
  pan: '',
  address: '',
  pincode: '',
  state: '',
  gender: '',
  monthlyIncome: '',
  otherIncome: '',
  existingEMI: '',
  loanType: '',
  loanAmount: '',
  tenure: '60',
};

const stateOptions = [
  'MADHYA PRADESH',
  'MAHARASHTRA',
  'DELHI',
  'RAJASTHAN',
  'GUJARAT',
  'KARNATAKA',
  'TAMIL NADU',
  'UTTAR PRADESH',
  'HARYANA',
  'PUNJAB',
  'WEST BENGAL',
];

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

export default function EligibilityCheckContent() {
  const [mainTab, setMainTab] = useState<MainTab>('queue');
  const [mode, setMode] = useState<EligibilityMode>('mobile_advanced');
  const [form, setForm] = useState<EligibilityForm>(emptyForm);
  const [leads, setLeads] = useState<QueueLead[]>([]);
  const [reports, setReports] = useState<Record<string, ReportSummary>>({});
  const [queueTab, setQueueTab] = useState<QueueTab>('pending');
  const [queueSearch, setQueueSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<QueueLead | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkingLeadId, setCheckingLeadId] = useState('');
  const [submittingLender, setSubmittingLender] = useState('');
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const loadEligibilityData = async () => {
    try {
      const [leadsResponse, storeResponse] = await Promise.all([
        fetch('/api/crm/leads', { cache: 'no-store' }),
        fetch('/api/crm/eligibility-check', { cache: 'no-store' }),
      ]);
      const leadsJson = await leadsResponse.json();
      const storeJson = await storeResponse.json();
      if (leadsJson.success && Array.isArray(leadsJson.data)) setLeads(leadsJson.data);
      const nextReports: Record<string, ReportSummary> = {};
      const storeReports = storeJson?.data?.reports;
      if (Array.isArray(storeReports)) {
        storeReports.forEach((report: ReportSummary) => {
          if (report?.id) nextReports[report.id] = report;
        });
      }
      setReports(nextReports);
    } catch {
      setLeads([]);
      setReports({});
    }
  };

  useEffect(() => {
    loadEligibilityData();
  }, []);

  const pendingLeads = leads.filter((lead) =>
    ['new', 'contacted', 'eligibility_pending'].includes(lead.stage)
  );
  const checkedLeads = leads.filter((lead) =>
    ['eligibility_done', 'submitted_to_lender', 'sanctioned', 'rejected', 'disbursed'].includes(
      lead.stage
    )
  );
  const visibleQueue = (queueTab === 'pending' ? pendingLeads : checkedLeads).filter((lead) => {
    const query = queueSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      lead.name.toLowerCase().includes(query) ||
      lead.mobile.includes(query) ||
      String(lead.product).toLowerCase().includes(query) ||
      lead.city.toLowerCase().includes(query)
    );
  });

  const setField = (key: keyof EligibilityForm, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const selectMode = (nextMode: EligibilityMode) => {
    setMode(nextMode);
    setSelectedLead(null);
    setErrors({});
    setServerError('');
    setResult(null);
  };

  const selectLead = (lead: QueueLead) => {
    setSelectedLead(lead);
    setMode('mobile_advanced');
    setForm((previous) => ({
      ...previous,
      mobile: lead.mobile,
      loanType: lead.product === 'credit_card' ? 'personal_loan' : (lead.product as LoanType),
      loanAmount: String(lead.loanAmount || ''),
    }));
    setErrors({});
    setServerError('');
    setResult(null);
  };

  const leadForm = (lead: QueueLead): EligibilityForm => ({
    ...emptyForm,
    mobile: lead.mobile,
    loanType: lead.product === 'credit_card' ? 'personal_loan' : (lead.product as LoanType),
    loanAmount: String(lead.loanAmount || ''),
  });

  const validateForm = (values: EligibilityForm, selectedMode: EligibilityMode) => {
    const nextErrors: Record<string, string> = {};
    if (!/^[6-9]\d{9}$/.test(values.mobile)) {
      nextErrors.mobile = '10-digit mobile required';
    }

    if (selectedMode === 'full_details') {
      if (!values.firstName.trim()) nextErrors.firstName = 'First name is required';
      if (!values.lastName.trim()) nextErrors.lastName = 'Last name is required';
      if (!values.dob) nextErrors.dob = 'Date of birth is required';
      if (!values.gender) nextErrors.gender = 'Gender is required';
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(values.pan.toUpperCase())) {
        nextErrors.pan = 'Valid PAN required';
      }
      if (!values.address.trim()) nextErrors.address = 'Address is required';
      if (!/^\d{6}$/.test(values.pincode)) nextErrors.pincode = '6-digit pincode required';
      if (!values.state) nextErrors.state = 'State is required';
      if (!values.monthlyIncome || isNaN(Number(values.monthlyIncome))) {
        nextErrors.monthlyIncome = 'Monthly income required';
      }
      if (!values.loanType) nextErrors.loanType = 'Select loan type';
      if (!values.loanAmount || isNaN(Number(values.loanAmount))) {
        nextErrors.loanAmount = 'Loan amount required';
      }
      if (!values.tenure || isNaN(Number(values.tenure))) nextErrors.tenure = 'Tenure required';
    }

    return nextErrors;
  };

  const runEligibility = async (
    payload: EligibilityForm,
    runMode: EligibilityMode,
    lead?: QueueLead | null
  ) => {
    const previousForm = form;
    const previousMode = mode;
    setForm(payload);
    setMode(runMode);
    const validationErrors = validateForm(payload, runMode);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setChecking(true);
    setCheckingLeadId(lead?.id || '');
    setSelectedLead(lead || null);
    setResult(null);
    setServerError('');
    try {
      const response = await fetch('/api/crm/eligibility-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload, mode: runMode, consent: true, leadId: lead?.id }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Eligibility check failed');
      setResult(json.data as EligibilityResult);
      if (lead) {
        setQueueTab('checked');
        await loadEligibilityData();
      }
    } catch (error) {
      setForm(previousForm);
      setMode(previousMode);
      setServerError(error instanceof Error ? error.message : 'Eligibility check failed');
    } finally {
      setChecking(false);
      setCheckingLeadId('');
    }
  };

  const handleCheck = async () => {
    await runEligibility(form, mode, selectedLead);
  };

  const runLeadEligibility = async (lead: QueueLead) => {
    await runEligibility(leadForm(lead), 'mobile_advanced', lead);
  };

  const submitToLenderQueue = async (lenderName: string) => {
    if (!selectedLead) return;
    setSubmittingLender(lenderName);
    setServerError('');
    try {
      const response = await fetch('/api/crm/eligibility-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_to_lender',
          leadId: selectedLead.id,
          lenderName,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Unable to submit lead');
      await loadEligibilityData();
      setSelectedLead(null);
      setResult(null);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unable to submit lead');
    } finally {
      setSubmittingLender('');
    }
  };

  const scoreColor = result
    ? result.score >= 750
      ? 'text-success'
      : result.score >= 680
        ? 'text-warning'
        : 'text-danger'
    : '';
  const scoreBarColor = result
    ? result.score >= 750
      ? 'bg-success'
      : result.score >= 680
        ? 'bg-warning'
        : 'bg-danger'
    : '';

  return (
    <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-700 text-foreground">Eligibility Checker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Check customer eligibility and view lender recommendations from one screen
          </p>
        </div>
        <div className="flex items-center rounded-sm border border-border bg-muted p-0.5">
          {[
            ['queue', 'Lead Queue'],
            ['reports', 'Eligibility Reports'],
          ].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab as MainTab)}
              className={[
                'h-8 px-3 rounded-sm text-xs font-700 transition-colors',
                mainTab === tab
                  ? 'bg-card text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mainTab === 'reports' ? (
        <EligibilityReportContent embedded />
      ) : (
        <div className="space-y-5">
          <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 border-b border-border">
              <div>
                <h2 className="text-sm font-700 text-foreground">Lead Eligibility Queue</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Run checks from pending leads and review completed results in one place
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center rounded-sm border border-border bg-muted p-0.5">
                  {[
                    ['pending', 'Pending Leads', pendingLeads.length],
                    ['checked', 'Eligibility Checked Leads', checkedLeads.length],
                  ].map(([tab, label, count]) => (
                    <button
                      key={String(tab)}
                      onClick={() => setQueueTab(tab as QueueTab)}
                      className={[
                        'h-7 px-3 rounded-sm text-xs font-700 transition-colors',
                        queueTab === tab
                          ? 'bg-card text-foreground shadow-card'
                          : 'text-muted-foreground hover:text-foreground',
                      ].join(' ')}
                    >
                      {label}
                      <span className="ml-1 tabular-nums">{count}</span>
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-64">
                  <svg
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    value={queueSearch}
                    onChange={(event) => setQueueSearch(event.target.value)}
                    placeholder="Search lead..."
                    className="w-full h-8 pl-8 pr-3 rounded-sm border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur border-b border-border">
                    <tr>
                      {[
                        'Lead',
                        'Mobile',
                        'Product',
                        'Amount',
                        'Agent',
                        queueTab === 'pending' ? 'Follow-up' : 'Result',
                        '',
                      ].map((column) => (
                        <th
                          key={column}
                          className="px-4 py-3 text-left text-[11px] font-700 uppercase tracking-wide text-muted-foreground whitespace-nowrap"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibleQueue.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center text-sm text-muted-foreground"
                        >
                          {queueTab === 'pending'
                            ? 'No pending leads found'
                            : 'No checked leads found'}
                        </td>
                      </tr>
                    ) : (
                      visibleQueue.map((lead) => {
                        const report = lead.eligibilityReportId
                          ? reports[lead.eligibilityReportId]
                          : undefined;
                        return (
                          <tr
                            key={lead.id}
                            className={[
                              'hover:bg-muted/30 transition-colors',
                              selectedLead?.id === lead.id ? 'bg-primary/5' : '',
                            ].join(' ')}
                          >
                            <td className="px-4 py-3">
                              <p className="text-xs font-700 text-foreground">{lead.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {lead.city || 'City pending'}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                              {lead.mobile}
                            </td>
                            <td className="px-4 py-3 text-xs text-foreground capitalize">
                              {String(lead.product).replace(/_/g, ' ')}
                            </td>
                            <td className="px-4 py-3 text-xs font-700 text-foreground">
                              {formatINR(lead.loanAmount)}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {lead.assignedAgent}
                            </td>
                            <td className="px-4 py-3">
                              {queueTab === 'pending' ? (
                                <span className="text-xs text-muted-foreground">
                                  {lead.nextFollowUp || '-'}
                                </span>
                              ) : (
                                <div>
                                  <p
                                    className={[
                                      'text-xs font-700',
                                      report?.eligible ? 'text-success' : 'text-warning',
                                    ].join(' ')}
                                  >
                                    {report
                                      ? `${report.eligible ? 'Eligible' : 'Review'} · ${report.score || '-'}`
                                      : 'Report saved'}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {lead.selectedLender || lead.stage.replace(/_/g, ' ')}
                                  </p>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {queueTab === 'pending' ? (
                                <button
                                  onClick={() => runLeadEligibility(lead)}
                                  disabled={checking}
                                  className="h-8 px-3 rounded-sm bg-primary text-primary-foreground text-xs font-700 hover:bg-primary/90 disabled:opacity-60"
                                >
                                  {checkingLeadId === lead.id ? 'Running...' : 'Run Eligibility'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => setMainTab('reports')}
                                  className="inline-flex items-center justify-center h-8 px-3 rounded-sm border border-border bg-background text-xs font-700 text-foreground hover:bg-muted"
                                >
                                  View Report
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                id: 'mobile_advanced' as const,
                title: 'Check Eligibility by Mobile',
                desc: 'Enter mobile number and run a quick consent-based eligibility check.',
              },
              {
                id: 'full_details' as const,
                title: 'Check Eligibility with Full Details',
                desc: 'Enter customer, income, and loan details for lender matching.',
              },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => selectMode(item.id)}
                className={[
                  'text-left rounded-lg border p-4 transition-all shadow-card bg-card',
                  mode === item.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-muted/30',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-700 text-foreground">{item.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <span
                    className={[
                      'w-4 h-4 rounded-full border shrink-0 mt-0.5',
                      mode === item.id ? 'border-primary bg-primary' : 'border-border',
                    ].join(' ')}
                  />
                </div>
              </button>
            ))}
          </div>

          <div className="bg-card rounded-lg border border-border shadow-card p-5 space-y-5">
            {mode === 'mobile_advanced' ? (
              <div>
                <h3 className="text-xs font-700 uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
                  Quick Eligibility Check
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-600 text-foreground">
                      Mobile Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.mobile}
                      onChange={(event) => setField('mobile', event.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                    {errors.mobile && <p className="text-xs text-danger">{errors.mobile}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-xs font-700 uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
                    Customer Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextInput
                      label="First Name"
                      required
                      value={form.firstName}
                      error={errors.firstName}
                      onChange={(value) => setField('firstName', value)}
                      placeholder="Harshal"
                    />
                    <TextInput
                      label="Last Name"
                      required
                      value={form.lastName}
                      error={errors.lastName}
                      onChange={(value) => setField('lastName', value)}
                      placeholder="Pawar"
                    />
                    <TextInput
                      label="Mobile Number"
                      required
                      value={form.mobile}
                      error={errors.mobile}
                      onChange={(value) => setField('mobile', value)}
                      placeholder="9876543210"
                      maxLength={10}
                    />
                    <TextInput
                      label="PAN Number"
                      required
                      value={form.pan}
                      error={errors.pan}
                      onChange={(value) => setField('pan', value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      className="uppercase"
                    />
                    <TextInput
                      label="Date of Birth"
                      required
                      type="date"
                      value={form.dob}
                      error={errors.dob}
                      onChange={(value) => setField('dob', value)}
                    />
                    <SelectInput
                      label="Gender"
                      required
                      value={form.gender}
                      error={errors.gender}
                      onChange={(value) => setField('gender', value)}
                      options={[
                        ['male', 'Male'],
                        ['female', 'Female'],
                        ['transgender', 'Transgender'],
                      ]}
                    />
                    <div className="sm:col-span-2">
                      <TextInput
                        label="Address"
                        required
                        value={form.address}
                        error={errors.address}
                        onChange={(value) => setField('address', value)}
                        placeholder="House no, street, locality"
                      />
                    </div>
                    <TextInput
                      label="Pincode"
                      required
                      value={form.pincode}
                      error={errors.pincode}
                      onChange={(value) => setField('pincode', value)}
                      placeholder="450221"
                      maxLength={6}
                    />
                    <SelectInput
                      label="State"
                      required
                      value={form.state}
                      error={errors.state}
                      onChange={(value) => setField('state', value)}
                      options={stateOptions.map((state) => [state, state])}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-700 uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
                    Loan And Income Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextInput
                      label="Monthly Income"
                      required
                      type="number"
                      value={form.monthlyIncome}
                      error={errors.monthlyIncome}
                      onChange={(value) => setField('monthlyIncome', value)}
                      placeholder="75000"
                    />
                    <TextInput
                      label="Other Monthly Income"
                      type="number"
                      value={form.otherIncome}
                      onChange={(value) => setField('otherIncome', value)}
                      placeholder="0"
                    />
                    <TextInput
                      label="Existing EMI"
                      type="number"
                      value={form.existingEMI}
                      onChange={(value) => setField('existingEMI', value)}
                      placeholder="0"
                    />
                    <SelectInput
                      label="Loan Type"
                      required
                      value={form.loanType}
                      error={errors.loanType}
                      onChange={(value) => setField('loanType', value)}
                      options={[
                        ['home_loan', 'Home Loan'],
                        ['personal_loan', 'Personal Loan'],
                        ['business_loan', 'Business Loan'],
                        ['lap', 'Loan Against Property'],
                        ['car_loan', 'Car Loan'],
                      ]}
                    />
                    <TextInput
                      label="Required Loan Amount"
                      required
                      type="number"
                      value={form.loanAmount}
                      error={errors.loanAmount}
                      onChange={(value) => setField('loanAmount', value)}
                      placeholder="2500000"
                    />
                    <TextInput
                      label="Tenure (months)"
                      required
                      type="number"
                      value={form.tenure}
                      error={errors.tenure}
                      onChange={(value) => setField('tenure', value)}
                      placeholder="60"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="pt-2 border-t border-border">
              {selectedLead && (
                <div className="bg-primary/5 border border-primary/20 rounded-sm p-3 mb-4 text-xs text-primary font-600">
                  Selected lead: {selectedLead.name} · {selectedLead.mobile}
                </div>
              )}
              {serverError && (
                <div className="bg-danger/5 border border-danger/20 rounded-sm p-3 mb-4 text-xs font-600 text-danger">
                  {serverError}
                </div>
              )}
              <button
                onClick={handleCheck}
                disabled={checking}
                className="w-full h-10 rounded-sm bg-primary text-primary-foreground text-sm font-700 hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {checking ? (
                  <>
                    <svg
                      className="animate-spin"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Checking...
                  </>
                ) : mode === 'mobile_advanced' ? (
                  'Check by Mobile'
                ) : (
                  'Check with Full Details'
                )}
              </button>
            </div>
          </div>
          {result && (
            <ResultPanel
              result={result}
              mode={mode}
              scoreColor={scoreColor}
              scoreBarColor={scoreBarColor}
              selectedLead={selectedLead}
              submittingLender={submittingLender}
              onSubmitLender={submitToLenderQueue}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  error,
  required,
  type = 'text',
  placeholder,
  maxLength,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-600 text-foreground">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 ${className}`}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-600 text-foreground">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
      >
        <option value="">Select</option>
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function ResultPanel({
  result,
  mode,
  scoreColor,
  scoreBarColor,
  selectedLead,
  submittingLender,
  onSubmitLender,
}: {
  result: EligibilityResult | null;
  mode: EligibilityMode;
  scoreColor: string;
  scoreBarColor: string;
  selectedLead: QueueLead | null;
  submittingLender: string;
  onSubmitLender: (lenderName: string) => void;
}) {
  if (!result) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div
        className={`rounded-lg border p-5 ${
          result.eligible ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              result.eligible ? 'bg-success/10' : 'bg-danger/10'
            }`}
          >
            {result.eligible ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--success)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--danger)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </div>
          <div>
            <p className={`text-base font-700 ${result.eligible ? 'text-success' : 'text-danger'}`}>
              {result.eligible ? 'Eligible' : 'Needs Review'}
            </p>
            <p className="text-xs text-muted-foreground">
              {mode === 'mobile_advanced' ? 'Quick eligibility result' : 'Lender assessment'}
            </p>
          </div>
        </div>
        {mode === 'full_details' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-background/60 rounded-sm p-2">
              <p className="text-[10px] text-muted-foreground">Max Eligible Loan</p>
              <p className="text-sm font-700 text-foreground">{formatINR(result.maxLoanAmount)}</p>
            </div>
            <div className="bg-background/60 rounded-sm p-2">
              <p className="text-[10px] text-muted-foreground">Est. Monthly EMI</p>
              <p className="text-sm font-700 text-foreground">{formatINR(result.recommendedEMI)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-700 text-foreground">Credit Score</p>
          <span
            className={`text-xs font-700 px-2 py-0.5 rounded-full ${
              result.score >= 750
                ? 'bg-success/10 text-success'
                : result.score >= 680
                  ? 'bg-warning/10 text-warning'
                  : 'bg-danger/10 text-danger'
            }`}
          >
            {result.scoreGrade}
          </span>
        </div>
        <div className="flex items-end gap-3 mb-2">
          <span className={`text-4xl font-700 tabular-nums ${scoreColor}`}>{result.score}</span>
          <span className="text-xs text-muted-foreground mb-1">/ 900</span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${scoreBarColor}`}
            style={{ width: `${Math.max(0, Math.min(100, ((result.score - 300) / 600) * 100))}%` }}
          />
        </div>
      </div>

      {mode === 'full_details' && (
        <div className="bg-card rounded-lg border border-border shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-700 text-foreground">Affordability Ratio</p>
            <span
              className={`text-sm font-700 tabular-nums ${
                result.foir <= 40
                  ? 'text-success'
                  : result.foir <= 55
                    ? 'text-warning'
                    : 'text-danger'
              }`}
            >
              {result.foir}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className={`h-full rounded-full ${
                result.foir <= 40 ? 'bg-success' : result.foir <= 55 ? 'bg-warning' : 'bg-danger'
              }`}
              style={{ width: `${Math.min(100, result.foir)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Ideal: {'<='} 40% | Acceptable: {'<='} 55%
          </p>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border shadow-card p-4">
        <p className="text-sm font-700 text-foreground mb-3">Assessment Remarks</p>
        <ul className="space-y-2">
          {result.remarks.map((remark) => (
            <li key={remark} className="flex items-start gap-2 text-xs text-muted-foreground">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 mt-0.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {remark}
            </li>
          ))}
        </ul>
      </div>

      {result.matchedLenders.length > 0 && (
        <div className="bg-card rounded-lg border border-border shadow-card p-4">
          <p className="text-sm font-700 text-foreground mb-3">Matched Lenders</p>
          <div className="space-y-2">
            {result.matchedLenders.map((lender) => (
              <div
                key={lender.name}
                className="flex items-center justify-between gap-3 p-2.5 rounded-sm bg-muted/40 border border-border"
              >
                <p className="text-xs font-700 text-foreground">{lender.name}</p>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">ROI: {lender.roi}</p>
                    <p className="text-[10px] font-600 text-foreground">Up to {lender.maxLoan}</p>
                  </div>
                  {selectedLead && (
                    <button
                      onClick={() => onSubmitLender(lender.name)}
                      disabled={Boolean(submittingLender)}
                      className="h-7 px-2 rounded-sm bg-primary text-primary-foreground text-[10px] font-700 hover:bg-primary/90 disabled:opacity-60"
                    >
                      {submittingLender === lender.name ? 'Sending...' : 'Send'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
