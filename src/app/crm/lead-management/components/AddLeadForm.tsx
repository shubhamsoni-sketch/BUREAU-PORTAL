'use client';
import React from 'react';
import { useForm } from 'react-hook-form';

interface AddLeadFormData {
  name: string;
  mobile: string;
  email: string;
  city: string;
  product: string;
  loanAmount: string;
  source: string;
  assignedAgent: string;
  cibil: string;
  employmentType: string;
  monthlyIncome: string;
  nextFollowUp: string;
  notes: string;
}

interface AddLeadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddLeadForm({ onSuccess, onCancel }: AddLeadFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddLeadFormData>();

  const onSubmit = handleSubmit(async () => {
    // BACKEND: POST /api/leads with form data
    await new Promise((r) => setTimeout(r, 800));
    onSuccess();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Personal Info */}
      <div>
        <h3 className="text-xs font-700 uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="al-name" className="block text-sm font-600 text-foreground">
              Full name <span className="text-danger">*</span>
            </label>
            <input
              id="al-name"
              type="text"
              placeholder="Ramesh Gupta"
              className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              {...register('name', { required: 'Full name is required' })}
            />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="al-mobile" className="block text-sm font-600 text-foreground">
              Mobile number <span className="text-danger">*</span>
            </label>
            <input
              id="al-mobile"
              type="tel"
              placeholder="9876543210"
              className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              {...register('mobile', {
                required: 'Mobile is required',
                pattern: { value: /^[6-9]\d{9}$/, message: '10-digit mobile number' },
              })}
            />
            {errors.mobile && <p className="text-xs text-danger">{errors.mobile.message}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="al-email" className="block text-sm font-600 text-foreground">
              Email address
            </label>
            <input
              id="al-email"
              type="email"
              placeholder="ramesh@gmail.com"
              className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              {...register('email', {
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Valid email required' },
              })}
            />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="al-city" className="block text-sm font-600 text-foreground">
              City <span className="text-danger">*</span>
            </label>
            <input
              id="al-city"
              type="text"
              placeholder="Mumbai"
              className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              {...register('city', { required: 'City is required' })}
            />
            {errors.city && <p className="text-xs text-danger">{errors.city.message}</p>}
          </div>
        </div>
      </div>

      {/* Loan Details */}
      <div>
        <h3 className="text-xs font-700 uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
          Loan Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="al-product" className="block text-sm font-600 text-foreground">
              Loan product <span className="text-danger">*</span>
            </label>
            <select
              id="al-product"
              className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              {...register('product', { required: 'Select a product' })}
            >
              <option value="">Select product</option>
              <option value="home_loan">Home Loan</option>
              <option value="personal_loan">Personal Loan</option>
              <option value="business_loan">Business Loan</option>
              <option value="lap">Loan Against Property (LAP)</option>
              <option value="car_loan">Car Loan</option>
              <option value="credit_card">Credit Card</option>
            </select>
            {errors.product && <p className="text-xs text-danger">{errors.product.message}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="al-amount" className="block text-sm font-600 text-foreground">
              Loan amount (₹) <span className="text-danger">*</span>
            </label>
            <p className="text-[11px] text-muted-foreground">Enter amount in rupees</p>
            <input
              id="al-amount"
              type="number"
              placeholder="2500000"
              className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              {...register('loanAmount', {
                required: 'Loan amount is required',
                min: { value: 10000, message: 'Minimum ₹10,000' },
              })}
            />
            {errors.loanAmount && (
              <p className="text-xs text-danger">{errors.loanAmount.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="al-employment" className="block text-sm font-600 text-foreground">
              Employment type <span className="text-danger">*</span>
            </label>
            <select
              id="al-employment"
              className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              {...register('employmentType', { required: 'Select employment type' })}
            >
              <option value="">Select type</option>
              <option value="salaried">Salaried</option>
              <option value="self_employed">Self Employed</option>
              <option value="business">Business Owner</option>
              <option value="professional">Professional (CA/Doctor)</option>
            </select>
            {errors.employmentType && (
              <p className="text-xs text-danger">{errors.employmentType.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="al-income" className="block text-sm font-600 text-foreground">
              Monthly income (₹)
            </label>
            <input
              id="al-income"
              type="number"
              placeholder="75000"
              className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              {...register('monthlyIncome')}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="al-cibil" className="block text-sm font-600 text-foreground">
              CIBIL score
            </label>
            <p className="text-[11px] text-muted-foreground">
              Leave blank if unknown — will be fetched later
            </p>
            <input
              id="al-cibil"
              type="number"
              placeholder="750"
              min="300"
              max="900"
              className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              {...register('cibil', {
                min: { value: 300, message: 'CIBIL score 300–900' },
                max: { value: 900, message: 'CIBIL score 300–900' },
              })}
            />
            {errors.cibil && <p className="text-xs text-danger">{errors.cibil.message}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="al-source" className="block text-sm font-600 text-foreground">
              Lead source <span className="text-danger">*</span>
            </label>
            <select
              id="al-source"
              className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              {...register('source', { required: 'Select lead source' })}
            >
              <option value="">Select source</option>
              <option value="web">Website / Online Form</option>
              <option value="reference">Customer Reference</option>
              <option value="walk_in">Walk-in</option>
              <option value="campaign">Marketing Campaign</option>
              <option value="social">Social Media</option>
            </select>
            {errors.source && <p className="text-xs text-danger">{errors.source.message}</p>}
          </div>
        </div>
      </div>

      {/* Assignment */}
      <div>
        <h3 className="text-xs font-700 uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
          Assignment & Follow-up
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="al-agent" className="block text-sm font-600 text-foreground">
              Assign to agent <span className="text-danger">*</span>
            </label>
            <select
              id="al-agent"
              className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              {...register('assignedAgent', { required: 'Assign to an agent' })}
            >
              <option value="">Select agent</option>
              <option value="Priya Sharma">Priya Sharma — Mumbai Central</option>
              <option value="Anil Mehta">Anil Mehta — Pune West</option>
              <option value="Sunita Rao">Sunita Rao — Bangalore HSR</option>
              <option value="Vikram Joshi">Vikram Joshi — Delhi NCR</option>
              <option value="Kavitha Nair">Kavitha Nair — Chennai Adyar</option>
            </select>
            {errors.assignedAgent && (
              <p className="text-xs text-danger">{errors.assignedAgent.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="al-followup" className="block text-sm font-600 text-foreground">
              Next follow-up date
            </label>
            <input
              id="al-followup"
              type="date"
              className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              {...register('nextFollowUp')}
            />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <label htmlFor="al-notes" className="block text-sm font-600 text-foreground">
              Notes
            </label>
            <textarea
              id="al-notes"
              rows={3}
              placeholder="Any relevant details about the lead — property location, purpose of loan, employer name, etc."
              className="w-full px-3 py-2 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none"
              {...register('notes')}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 rounded-sm border border-border text-sm font-600 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-9 px-5 rounded-sm bg-primary text-primary-foreground text-sm font-700 hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Saving...
            </>
          ) : (
            'Add Lead'
          )}
        </button>
      </div>
    </form>
  );
}
