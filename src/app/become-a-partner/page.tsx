'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { CheckCircle, ArrowLeft, Building2, User, Phone, Mail, MapPin, Hash, FileText, Briefcase } from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const BUSINESS_TYPES = ['DSA', 'Agent', 'Individual', 'Corporate', 'Other'];
const SERVICE_TYPES = ['Consumer Report', 'Commercial Report', 'Both'];

type RegistrationFormData = {
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
  consent: boolean;
};

type FormErrors = Partial<Record<keyof RegistrationFormData, string>>;

const TNC_TEXT = `TERMS AND CONDITIONS FOR PARTNER REGISTRATION

1. ELIGIBILITY
By submitting this application, you confirm that you are a legally authorized DSA, Agent, Business Entity, or Individual eligible to partner with us for financial health analysis services.

2. SERVICES
As a registered partner, you will have access to generate Individual Financial Analysis and/or Business Financial Analysis reports, subject to applicable regulations and your approved service type.

3. DATA PRIVACY & CONFIDENTIALITY
All customer data accessed through our platform is strictly confidential. You agree not to share, misuse, or disclose any customer information to unauthorized parties. All data handling must comply with applicable data protection laws including the Information Technology Act, 2000 and DPDP Act, 2023.

4. COMPLIANCE
You agree to comply with all applicable laws, regulations, and guidelines issued by the Reserve Bank of India (RBI), Credit Information Companies (Regulation) Act, 2005, and any other relevant regulatory authority.

5. AUTHORIZED USE
Financial health reports generated through this platform must only be used for legitimate financial assessment purposes with the explicit consent of the individual or entity whose data is being assessed.

6. FEES & BILLING
Usage of the platform is subject to the commercial terms agreed upon at the time of partner activation. All charges are non-refundable unless otherwise specified.

7. TERMINATION
We reserve the right to suspend or terminate your partner account in case of any violation of these terms, misuse of the platform, or non-compliance with regulatory requirements.

8. LIMITATION OF LIABILITY
We shall not be liable for any indirect, incidental, or consequential damages arising from the use of our platform or services.

9. AMENDMENTS
We reserve the right to update these Terms and Conditions at any time. Continued use of the platform after such changes constitutes your acceptance of the revised terms.

10. GOVERNING LAW
These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in India.

By checking the consent box and submitting this application, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.`;

export default function BecomeAPartnerPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [showTnC, setShowTnC] = useState(false);
  const [formData, setFormData] = useState<RegistrationFormData>({
    companyName: '',
    authorisedPersonName: '',
    contactNumber: '',
    email: '',
    address: '',
    state: '',
    pinCode: '',
    gst: '',
    businessType: '',
    serviceType: '',
    consent: false,
  });

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.companyName.trim()) newErrors.companyName = 'Business/Company name is required';
    if (!formData.authorisedPersonName.trim()) newErrors.authorisedPersonName = 'Authorised person name is required';
    if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
    else if (!/^[6-9]\d{9}$/.test(formData.contactNumber.replace(/\s/g, ''))) newErrors.contactNumber = 'Enter a valid 10-digit mobile number';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email address';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.state) newErrors.state = 'Please select a state';
    if (!formData.pinCode.trim()) newErrors.pinCode = 'PIN code is required';
    else if (!/^\d{6}$/.test(formData.pinCode.trim())) newErrors.pinCode = 'Enter a valid 6-digit PIN code';
    if (formData.gst.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gst.trim().toUpperCase())) {
      newErrors.gst = 'Enter a valid GST number';
    }
    if (!formData.businessType) newErrors.businessType = 'Please select a business type';
    if (!formData.serviceType) newErrors.serviceType = 'Please select a service type';
    if (!formData.consent) newErrors.consent = 'You must agree to the Terms & Conditions';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof RegistrationFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsSubmitting(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('/api/partner-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.companyName.trim(),
          name: formData.authorisedPersonName.trim(),
          mobile: formData.contactNumber.trim(),
          email: formData.email.trim().toLowerCase(),
          address: formData.address.trim(),
          state: formData.state,
          pin_code: formData.pinCode.trim(),
          gst: formData.gst.trim().toUpperCase() || null,
          business_type: formData.businessType,
          service_type: formData.serviceType,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        setServerError(data.error || 'Failed to submit application. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        setServerError('Request timed out. Please check your connection and try again.');
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all";
  const selectClass = "w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all appearance-none bg-white";
  const errorClass = "mt-1 text-xs text-red-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-300 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Login
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-7 text-center">
            <div className="flex justify-center mb-3">
              <AppLogo size={50} width={170} height={58} imageClassName="rounded-lg" />
            </div>
            <h1 className="text-xl font-bold text-white">Become a Partner</h1>
            <p className="text-blue-200 text-sm mt-1">Register your business and start generating financial health reports</p>
          </div>

          <div className="px-8 py-8">
            {submitted ? (
              /* Success State */
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-3">Application Submitted!</h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-sm mx-auto">
                  Thank you for submitting your details. We will reach out to you soon.
                </p>
                <div className="mt-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Go to Login
                  </Link>
                </div>
              </div>
            ) : (
              /* Form */
              <>
                <h2 className="text-base font-semibold text-slate-800 mb-1">Partner Registration</h2>
                <p className="text-sm text-slate-500 mb-6">Fill in your business details to apply as a partner.</p>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {/* Row 1: Business/Company Name + Authorised Person Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1">
                        Business / Company Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="companyName"
                          type="text"
                          placeholder="ABC Finance Pvt Ltd"
                          value={formData.companyName}
                          onChange={handleChange('companyName')}
                          className={inputClass}
                        />
                      </div>
                      {errors.companyName && <p className={errorClass}>{errors.companyName}</p>}
                    </div>

                    <div>
                      <label htmlFor="authorisedPersonName" className="block text-sm font-medium text-slate-700 mb-1">
                        Authorised Person Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="authorisedPersonName"
                          type="text"
                          placeholder="Rajesh Kumar"
                          value={formData.authorisedPersonName}
                          onChange={handleChange('authorisedPersonName')}
                          className={inputClass}
                        />
                      </div>
                      {errors.authorisedPersonName && <p className={errorClass}>{errors.authorisedPersonName}</p>}
                    </div>
                  </div>

                  {/* Row 2: Contact Number + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contactNumber" className="block text-sm font-medium text-slate-700 mb-1">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="contactNumber"
                          type="tel"
                          placeholder="9876543210"
                          value={formData.contactNumber}
                          onChange={handleChange('contactNumber')}
                          maxLength={10}
                          className={inputClass}
                        />
                      </div>
                      {errors.contactNumber && <p className={errorClass}>{errors.contactNumber}</p>}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="email"
                          type="email"
                          placeholder="you@company.in"
                          value={formData.email}
                          onChange={handleChange('email')}
                          className={inputClass}
                        />
                      </div>
                      {errors.email && <p className={errorClass}>{errors.email}</p>}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-3.5 text-slate-400" />
                      <textarea
                        id="address"
                        rows={2}
                        placeholder="Street, Area, City"
                        value={formData.address}
                        onChange={handleChange('address')}
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none"
                      />
                    </div>
                    {errors.address && <p className={errorClass}>{errors.address}</p>}
                  </div>

                  {/* Row 3: State + PIN Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                        <select
                          id="state"
                          value={formData.state}
                          onChange={handleChange('state')}
                          className={selectClass}
                        >
                          <option value="">Select state</option>
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      {errors.state && <p className={errorClass}>{errors.state}</p>}
                    </div>

                    <div>
                      <label htmlFor="pinCode" className="block text-sm font-medium text-slate-700 mb-1">
                        PIN Code <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="pinCode"
                          type="text"
                          placeholder="400001"
                          value={formData.pinCode}
                          onChange={handleChange('pinCode')}
                          maxLength={6}
                          className={inputClass}
                        />
                      </div>
                      {errors.pinCode && <p className={errorClass}>{errors.pinCode}</p>}
                    </div>
                  </div>

                  {/* Row 4: GST + Business Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="gst" className="block text-sm font-medium text-slate-700 mb-1">
                        GST Number <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="gst"
                          type="text"
                          placeholder="22AAAAA0000A1Z5"
                          value={formData.gst}
                          onChange={handleChange('gst')}
                          maxLength={15}
                          className={`${inputClass} uppercase`}
                        />
                      </div>
                      {errors.gst && <p className={errorClass}>{errors.gst}</p>}
                    </div>

                    <div>
                      <label htmlFor="businessType" className="block text-sm font-medium text-slate-700 mb-1">
                        Business Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                        <select
                          id="businessType"
                          value={formData.businessType}
                          onChange={handleChange('businessType')}
                          className={selectClass}
                        >
                          <option value="">Select type</option>
                          {BUSINESS_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      {errors.businessType && <p className={errorClass}>{errors.businessType}</p>}
                    </div>
                  </div>

                  {/* Service Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Service Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {SERVICE_TYPES.map((type) => (
                        <label
                          key={type}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all text-sm font-medium ${
                            formData.serviceType === type
                              ? 'border-blue-500 bg-blue-50 text-blue-700' :'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="serviceType"
                            value={type}
                            checked={formData.serviceType === type}
                            onChange={handleChange('serviceType')}
                            className="sr-only"
                          />
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            formData.serviceType === type ? 'border-blue-500' : 'border-slate-300'
                          }`}>
                            {formData.serviceType === type && (
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                          </span>
                          {type}
                        </label>
                      ))}
                    </div>
                    {errors.serviceType && <p className={errorClass}>{errors.serviceType}</p>}
                  </div>

                  {/* Consent Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.consent}
                        onChange={handleChange('consent')}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                      />
                      <span className="text-sm text-slate-600 leading-relaxed">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowTnC(true)}
                          className="text-blue-600 hover:text-blue-700 underline font-medium"
                        >
                          Terms &amp; Conditions
                        </button>
                        {' '}and confirm that all information provided is accurate.
                      </span>
                    </label>
                    {errors.consent && <p className="mt-1 text-xs text-red-500 ml-7">{errors.consent}</p>}
                  </div>

                  {serverError && (
                    <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{serverError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors mt-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* T&C Modal */}
      {showTnC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Terms &amp; Conditions</h3>
              <button
                onClick={() => setShowTnC(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors text-lg font-bold"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 flex-1">
              <pre className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-sans">{TNC_TEXT}</pre>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setFormData((prev) => ({ ...prev, consent: true }));
                  setErrors((prev) => ({ ...prev, consent: undefined }));
                  setShowTnC(false);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
