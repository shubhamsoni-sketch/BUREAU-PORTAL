'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import Modal from '@/components/ui/Modal';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

type PartnerFormData = {
  companyName: string;
  authorisedPersonName: string;
  contactNumber: string;
  email: string;
  address: string;
  state: string;
  pinCode: string;
  gst: string;
  businessType: string;
  serviceType: string;
  partnerCode: string;
  walletCredit: string;
};

export default function AddPartnerButton() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PartnerFormData>();

  const onSubmit = async (data: PartnerFormData) => {
    setIsSubmitting(true);
    // TODO: Connect to Supabase — insert into partners table
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);
    setOpen(false);
    reset();
    toast.success(`Partner "${data.companyName}" added successfully.`);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary"
        aria-label="Add new partner"
      >
        <Icon name="PlusIcon" size={16} />
        Add Partner
      </button>

      <Modal
        open={open}
        onClose={() => { setOpen(false); reset(); }}
        title="Add New Partner"
        description="Register a new partner on the platform."
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Business / Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-foreground mb-1">
                Business / Company Name <span className="text-red-500">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                className="input-base"
                placeholder="ABC Finance Pvt Ltd"
                {...register('companyName', { required: 'Business/Company name is required' })}
              />
              {errors.companyName && (
                <p className="mt-1 text-xs text-red-500">{errors.companyName.message}</p>
              )}
            </div>

            {/* Authorised Person Name */}
            <div>
              <label htmlFor="authorisedPersonName" className="block text-sm font-medium text-foreground mb-1">
                Authorised Person Name <span className="text-red-500">*</span>
              </label>
              <input
                id="authorisedPersonName"
                type="text"
                className="input-base"
                placeholder="Rajesh Kumar"
                {...register('authorisedPersonName', { required: 'Authorised person name is required' })}
              />
              {errors.authorisedPersonName && (
                <p className="mt-1 text-xs text-red-500">{errors.authorisedPersonName.message}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-foreground mb-1">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                id="contactNumber"
                type="tel"
                className="input-base"
                placeholder="9876543210"
                maxLength={10}
                {...register('contactNumber', {
                  required: 'Contact number is required',
                  pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' },
                })}
              />
              {errors.contactNumber && (
                <p className="mt-1 text-xs text-red-500">{errors.contactNumber.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                className="input-base"
                placeholder="partner@company.in"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* State */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-foreground mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                id="state"
                className="input-base"
                {...register('state', { required: 'Please select a state' })}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.state && (
                <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>
              )}
            </div>

            {/* PIN Code */}
            <div>
              <label htmlFor="pinCode" className="block text-sm font-medium text-foreground mb-1">
                PIN Code <span className="text-red-500">*</span>
              </label>
              <input
                id="pinCode"
                type="text"
                className="input-base"
                placeholder="400001"
                maxLength={6}
                {...register('pinCode', {
                  required: 'PIN code is required',
                  pattern: { value: /^\d{6}$/, message: 'Enter a valid 6-digit PIN code' },
                })}
              />
              {errors.pinCode && (
                <p className="mt-1 text-xs text-red-500">{errors.pinCode.message}</p>
              )}
            </div>

            {/* Business Type */}
            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-foreground mb-1">
                Business Type <span className="text-red-500">*</span>
              </label>
              <select
                id="businessType"
                className="input-base"
                {...register('businessType', { required: 'Please select a business type' })}
              >
                <option value="">Select type</option>
                <option value="DSA">DSA</option>
                <option value="Agent">Agent</option>
                <option value="Individual">Individual</option>
                <option value="Corporate">Corporate</option>
                <option value="Other">Other</option>
              </select>
              {errors.businessType && (
                <p className="mt-1 text-xs text-red-500">{errors.businessType.message}</p>
              )}
            </div>

            {/* Service Type */}
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-foreground mb-1">
                Service Type <span className="text-red-500">*</span>
              </label>
              <select
                id="serviceType"
                className="input-base"
                {...register('serviceType', { required: 'Please select a service type' })}
              >
                <option value="">Select service</option>
                <option value="Consumer Report">Consumer Report</option>
                <option value="Commercial Report">Commercial Report</option>
              </select>
              {errors.serviceType && (
                <p className="mt-1 text-xs text-red-500">{errors.serviceType.message}</p>
              )}
            </div>

            {/* GST (Optional) */}
            <div>
              <label htmlFor="gst" className="block text-sm font-medium text-foreground mb-1">
                GST Number <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
              </label>
              <input
                id="gst"
                type="text"
                className="input-base uppercase"
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                {...register('gst', {
                  validate: (v) =>
                    !v || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v.toUpperCase())
                      ? true
                      : 'Enter a valid GST number',
                })}
              />
              {errors.gst && (
                <p className="mt-1 text-xs text-red-500">{errors.gst.message}</p>
              )}
            </div>

            {/* Partner Code */}
            <div>
              <label htmlFor="partnerCode" className="block text-sm font-medium text-foreground mb-1">
                Partner Code (DSA ID)
              </label>
              <input
                id="partnerCode"
                type="text"
                className="input-base font-mono"
                placeholder="DSA-2024-001"
                {...register('partnerCode')}
              />
            </div>
          </div>

          {/* Address - full width */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-foreground mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="address"
              rows={2}
              className="input-base resize-none"
              placeholder="Street, Area, City"
              {...register('address', { required: 'Address is required' })}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>
            )}
          </div>

          {/* Initial Wallet Credit */}
          <div>
            <label htmlFor="walletCredit" className="block text-sm font-medium text-foreground mb-1">
              Initial Wallet Credit (₹)
            </label>
            <input
              id="walletCredit"
              type="number"
              min="0"
              className="input-base font-tabular"
              placeholder="5000"
              {...register('walletCredit')}
            />
            <p className="mt-1 text-xs text-muted-foreground">Amount credited to partner wallet on activation.</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setOpen(false); reset(); }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary min-w-[140px] justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon name="ArrowPathIcon" size={14} className="animate-spin" />
                  Adding Partner...
                </>
              ) : (
                <>
                  <Icon name="CheckIcon" size={14} />
                  Add Partner
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}