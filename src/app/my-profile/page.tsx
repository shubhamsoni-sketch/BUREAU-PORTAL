'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Building2, User, Phone, FileText, MapPin, Mail, Hash, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

interface PartnerProfile {
  companyName: string;
  authorizedPerson: string;
  mobile: string;
  gstNumber: string;
  address: string;
  email: string;
  partnerCode: string;
}

export default function MyProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PartnerProfile>({
    companyName: '',
    authorizedPerson: '',
    mobile: '',
    gstNumber: '',
    address: '',
    email: '',
    partnerCode: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('partners')
        .select('company_name, authorized_person, mobile, gst_number, address, email, partner_code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          companyName: data.company_name ?? '',
          authorizedPerson: data.authorized_person ?? '',
          mobile: data.mobile ?? '',
          gstNumber: data.gst_number ?? '',
          address: data.address ?? '',
          email: data.email ?? user.email ?? '',
          partnerCode: data.partner_code ?? user.partnerCode ?? '',
        });
      } else {
        setProfile(prev => ({
          ...prev,
          email: user.email ?? '',
          partnerCode: user.partnerCode ?? '',
        }));
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);
    try {
      // Read token directly from localStorage to avoid lock conflicts with AuthContext
      // (AuthContext explicitly warns against calling getSession() separately)
      let accessToken = '';
      try {
        const raw = localStorage.getItem('sb-cibilysis-auth-token');
        if (raw) {
          const parsed = JSON.parse(raw);
          accessToken = parsed?.access_token ?? '';
        }
      } catch {
        // fallback: try getSession as last resort
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token ?? '';
      }

      const res = await fetch('/api/update-partner-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          companyName: profile.companyName,
          authorizedPerson: profile.authorizedPerson,
          mobile: profile.mobile,
          gstNumber: profile.gstNumber,
          address: profile.address,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
      } else {
        setProfileMsg({ type: 'error', text: data.error ?? 'Failed to update profile.' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPassword.length < 8) {
      setPwdMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setPwdSaving(true);
    try {
      const res = await fetch('/api/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPwdMsg({ type: 'success', text: 'Password changed successfully.' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMsg({ type: 'error', text: data.error ?? 'Failed to change password.' });
      }
    } catch {
      setPwdMsg({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setPwdSaving(false);
    }
  };

  const initials = profile.companyName
    ? profile.companyName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : (user?.name ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'P');

  return (
    <AppLayout role="partner">
      <Topbar title="My Profile" role="partner" />
      <div className="p-6 max-w-3xl mx-auto space-y-6">

        {/* Avatar Header */}
        <div className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800">{profile.companyName || 'Your Company'}</p>
            <p className="text-sm text-slate-500">{profile.email}</p>
            {profile.partnerCode && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
                <Hash size={10} /> {profile.partnerCode}
              </span>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Business Information</h2>
            <p className="text-xs text-slate-500 mt-0.5">Update your company and contact details</p>
          </div>
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleProfileSave} className="p-5 space-y-4">
              {/* Read-only fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    <Mail size={12} className="inline mr-1" />Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    <Hash size={12} className="inline mr-1" />Partner Code
                  </label>
                  <input
                    type="text"
                    value={profile.partnerCode}
                    readOnly
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Editable fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    <Building2 size={12} className="inline mr-1" />Company / Business Name
                  </label>
                  <input
                    type="text"
                    value={profile.companyName}
                    onChange={e => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Enter company name"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    <User size={12} className="inline mr-1" />Authorized Person
                  </label>
                  <input
                    type="text"
                    value={profile.authorizedPerson}
                    onChange={e => setProfile(prev => ({ ...prev, authorizedPerson: e.target.value }))}
                    placeholder="Enter authorized person name"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    <Phone size={12} className="inline mr-1" />Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.mobile}
                    onChange={e => setProfile(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    <FileText size={12} className="inline mr-1" />GST Number
                  </label>
                  <input
                    type="text"
                    value={profile.gstNumber}
                    onChange={e => setProfile(prev => ({ ...prev, gstNumber: e.target.value }))}
                    placeholder="Enter GST number"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  <MapPin size={12} className="inline mr-1" />Address
                </label>
                <textarea
                  value={profile.address}
                  onChange={e => setProfile(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter full address"
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {profileMsg && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {profileMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {profileMsg.text}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Change Password</h2>
            <p className="text-xs text-slate-500 mt-0.5">Update your account password</p>
          </div>
          <form onSubmit={handlePasswordChange} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  <Lock size={12} className="inline mr-1" />New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-2 pr-9 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  <Lock size={12} className="inline mr-1" />Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 pr-9 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {pwdMsg && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${pwdMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {pwdMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {pwdMsg.text}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={pwdSaving}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {pwdSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </AppLayout>
  );
}
