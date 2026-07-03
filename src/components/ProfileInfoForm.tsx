import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Users, Copy, X, Save, Edit2 } from "lucide-react";
import { post } from "../api/BaseService";
import { showApiResponseToast, showToast } from "../utils/toastService";

interface ProfileData {
  Id: number;
  FirstName: string;
  LastName: string;
  Email: string;
  MobileNo: string;
  Gender: string;
  GenderName: string;
  RewardCoins?: number;
  ReferralCode?: string;
}

interface ProfileInfoFormProps {
  profileData: ProfileData;
  ordersCount: number;
  onSaveSuccess: () => void;
}

export function ProfileInfoForm({ profileData, ordersCount, onSaveSuccess }: ProfileInfoFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNo: ""
  });

  useEffect(() => {
    if (profileData) {
      setForm({
        firstName: profileData.FirstName || "",
        lastName: profileData.LastName || "",
        email: profileData.Email || "",
        mobileNo: profileData.MobileNo || ""
      });
    }
  }, [profileData]);

  const getPrefix = (gender: any) => {
    if (gender === "MALE" || gender === "Male" || gender === 1) return "Mr. ";
    if (gender === "FEMALE" || gender === "Female" || gender === 2) return "Ms. ";
    return "";
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const customerId = localStorage.getItem("customerId");
      if (!customerId) return;

      const payload = {
        id: Number(customerId),
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        mobileNo: form.mobileNo
      };

      const result: any = await post("/Customer/UpdateProfile", payload);
      showApiResponseToast(result);

      if (result.isSuccess || result.statusCode === 1 || result.StatusCode === 1) {
        setIsEditing(false);
        onSaveSuccess();
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-12">
      {/* Premium Welcome Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-[2rem] p-8 sm:p-10 mb-10 shadow-2xl shadow-[var(--color-primary)]/20 text-white border border-white/10">
        {/* Decorative glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-[80px] opacity-20 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-8 sm:items-center">
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-3xl font-serif shadow-inner border border-white/20">
              {profileData.FirstName ? profileData.FirstName[0].toUpperCase() : <User className="w-10 h-10" />}
            </div>
          </div>

          <div className="flex flex-col justify-center min-w-0 w-full">
            <p className="text-white/60 text-sm font-satoshi uppercase tracking-widest font-semibold mb-2">Welcome Back</p>
            
            <h2 className="text-[32px] md:text-[36px] font-serif text-white mb-5 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {getPrefix(profileData.Gender)}{profileData.FirstName} {profileData.LastName}
            </h2>
            
            {/* Quick Stats - Below Name */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Total Orders Badge */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 w-max max-w-full overflow-hidden shadow-sm">
                <span className="text-lg shrink-0">📦</span>
                <span className="text-white/90 text-sm font-medium whitespace-nowrap shrink-0">Total Orders:</span>
                <span className="text-white font-bold text-base truncate ml-1">{ordersCount}</span>
              </div>
              
              {/* Reward Coins Badge */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 relative overflow-hidden w-max max-w-full shadow-sm">
                {/* Subtle Glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-20 h-20 bg-[#FFD54F]/20 blur-xl rounded-full"></div>
                </div>
                <span className="text-lg shrink-0 relative z-10">🪙</span>
                <span className="text-white/90 text-sm font-medium whitespace-nowrap shrink-0 relative z-10">Reward Coins:</span>
                <span className="text-[#FFD54F] font-bold text-base relative z-10 truncate ml-1">{profileData?.RewardCoins || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 px-2">
        <h3 className="text-2xl font-serif text-neutral-900 tracking-tight">Personal Details</h3>
      </div>

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* First Name */}
        <div className="group bg-white rounded-[1.5rem] p-6 shadow-[0_4px_24px_rgb(0,0,0,0.02)] border border-neutral-100/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-neutral-200 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center gap-3 mb-3 text-neutral-400">
            <User className="w-4 h-4 group-hover:text-[var(--color-primary)] transition-colors duration-300" />
            <span className="font-satoshi text-[10px] uppercase tracking-[0.2em] font-bold">First Name</span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/10 text-neutral-900 font-medium transition-all text-sm"
              placeholder="Enter your first name"
            />
          ) : (
            <p className="text-neutral-900 font-serif text-xl tracking-tight">
              {profileData.FirstName || "Not provided"}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div className="group bg-white rounded-[1.5rem] p-6 shadow-[0_4px_24px_rgb(0,0,0,0.02)] border border-neutral-100/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-neutral-200 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center gap-3 mb-3 text-neutral-400">
            <User className="w-4 h-4 group-hover:text-[var(--color-primary)] transition-colors duration-300" />
            <span className="font-satoshi text-[10px] uppercase tracking-[0.2em] font-bold">Last Name</span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/10 text-neutral-900 font-medium transition-all text-sm"
              placeholder="Enter your last name"
            />
          ) : (
            <p className="text-neutral-900 font-serif text-xl tracking-tight">
              {profileData.LastName || "Not provided"}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div className="group bg-white rounded-[1.5rem] p-6 shadow-[0_4px_24px_rgb(0,0,0,0.02)] border border-neutral-100/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-neutral-200 transition-all duration-500 relative overflow-hidden md:col-span-2">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center gap-3 mb-3 text-neutral-400">
            <Mail className="w-4 h-4 group-hover:text-[var(--color-primary)] transition-colors duration-300" />
            <span className="font-satoshi text-[10px] uppercase tracking-[0.2em] font-bold">Email Address</span>
          </div>
          {isEditing ? (
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/10 text-neutral-900 font-medium transition-all text-sm"
              placeholder="Enter your email address"
            />
          ) : (
            <p className="text-neutral-900 font-serif text-xl tracking-tight">
              {profileData.Email || "Not provided"}
            </p>
          )}
        </div>

        {/* Mobile Number */}
        <div className="group bg-white rounded-[1.5rem] p-6 shadow-[0_4px_24px_rgb(0,0,0,0.02)] border border-neutral-100/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-neutral-200 transition-all duration-500 relative overflow-hidden md:col-span-2">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center gap-3 mb-3 text-neutral-400">
            <Phone className="w-4 h-4 group-hover:text-[var(--color-primary)] transition-colors duration-300" />
            <span className="font-satoshi text-[10px] uppercase tracking-[0.2em] font-bold">Mobile Number</span>
          </div>
          {isEditing ? (
            <input
              type="tel"
              value={form.mobileNo}
              onChange={(e) => setForm({ ...form, mobileNo: e.target.value })}
              className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/10 text-neutral-900 font-medium transition-all text-sm"
              placeholder="Enter your mobile number"
            />
          ) : (
            <p className="text-neutral-900 font-serif text-xl tracking-tight">
              {profileData.MobileNo || "Not provided"}
            </p>
          )}
        </div>

        {/* Referral Code */}
        {profileData.ReferralCode && (
          <div className="group bg-white rounded-[1.5rem] p-6 shadow-[0_4px_24px_rgb(0,0,0,0.02)] border border-[var(--color-primary)]/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[var(--color-primary)]/40 transition-all duration-500 relative overflow-hidden md:col-span-2">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-accent)] opacity-100"></div>
            <div className="flex items-center gap-3 mb-3 text-[var(--color-primary)]">
              <Users className="w-4 h-4" />
              <span className="font-satoshi text-[10px] uppercase tracking-[0.2em] font-bold">Your Referral Code</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-neutral-900 font-serif text-2xl tracking-tight">
                  {profileData.ReferralCode}
                </p>
                <p className="text-xs text-neutral-500 mt-1 font-satoshi text-justify">Share this link with your friends to earn rewards when they sign up!</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const link = `${window.location.origin}/?ref=${profileData.ReferralCode}`;
                  navigator.clipboard.writeText(link);
                  showToast("success", "Referral link copied to clipboard!");
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white rounded-xl text-sm font-bold transition-all whitespace-nowrap"
              >
                <Copy className="w-4 h-4" /> Copy Referral Link
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        {isEditing ? (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl hover:bg-neutral-100 text-neutral-600 transition-colors font-medium text-[15px] flex items-center justify-center gap-2 border border-transparent hover:border-neutral-200"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)] transition-all shadow-lg shadow-[var(--color-primary)]/25 font-medium text-[15px] flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl border border-neutral-200/80 bg-white text-neutral-700 hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all font-medium text-[15px] shadow-sm group"
          >
            <Edit2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}
