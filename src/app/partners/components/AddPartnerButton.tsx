'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import Modal from '@/components/ui/Modal';

type PartnerFormData = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  partnerCode: string;
  panNumber: string;
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
    toast.success(`Partner "${data.fullName}" added successfully.`);
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
        description="Register a new DSA agent on the CIBILysis platform."
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                className="input-base"
                placeholder="Rajesh Kumar"
                {...register('fullName', { required: 'Full name is required' })}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            {/* Partner Code */}
            <div>
              <label htmlFor="partnerCode" className="block text-sm font-medium text-foreground mb-1">
                Partner Code (DSA ID) <span className="text-red-500">*</span>
              </label>
              <input
                id="partnerCode"
                type="text"
                className="input-base font-mono"
                placeholder="DSA-2024-001"
                {...register('partnerCode', { required: 'Partner code is required' })}
              />
              {errors.partnerCode && (
                <p className="mt-1 text-xs text-red-500">{errors.partnerCode.message}</p>
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
                placeholder="partner@dsa.in"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                className="input-base"
                placeholder="+91 98765 43210"
                {...register('phone', { required: 'Phone number is required' })}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-foreground mb-1">
                City
              </label>
              <input
                id="city"
                type="text"
                className="input-base"
                placeholder="Mumbai"
                {...register('city')}
              />
            </div>

            {/* State */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-foreground mb-1">
                State
              </label>
              <select
                id="state"
                className="input-base"
                {...register('state')}
              >
                <option value="">Select state</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Telangana">Telangana</option>
                <option value="Punjab">Punjab</option>
              </select>
            </div>

            {/* PAN */}
            <div>
              <label htmlFor="panNumber" className="block text-sm font-medium text-foreground mb-1">
                PAN Number
              </label>
              <input
                id="panNumber"
                type="text"
                className="input-base font-mono uppercase"
                placeholder="ABCDE1234F"
                maxLength={10}
                {...register('panNumber')}
              />
              <p className="mt-1 text-xs text-muted-foreground">Required for agreement and billing purposes.</p>
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