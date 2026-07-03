import React, { useState } from "react";
import { Shield, Eye, EyeOff, Save } from "lucide-react";
import { post } from "../api/BaseService";
import { showApiResponseToast, showToast } from "../utils/toastService";

export function ChangePasswordForm() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showToast("error", "All fields are required.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("error", "New password and confirm password do not match.");
      return;
    }

    try {
      setIsChangingPassword(true);
      const payload = {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      };
      
      const result: any = await post("/CustomerAuth/ChangePassword", payload);
      showApiResponseToast(result);
      if (result.isSuccess || result.statusCode === 1 || result.StatusCode === 1) {
        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || err.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="p-6 sm:p-12 space-y-12">
      <div className="flex items-center justify-between border-b border-neutral-100/80 pb-6">
        <h2 className="text-3xl font-serif text-neutral-900 tracking-tight">Change Password</h2>
      </div>

      <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 shadow-[0_4px_24px_rgb(0,0,0,0.02)] border border-neutral-100/60 max-w-2xl">
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Old Password */}
          <div>
            <div className="flex items-center gap-3 mb-3 text-neutral-400">
              <Shield className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="font-satoshi text-[10px] uppercase tracking-[0.2em] font-bold">Old Password</span>
            </div>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/10 text-neutral-900 font-medium transition-all text-sm pr-12"
                placeholder="Enter old password"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[var(--color-primary)] transition-colors"
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* New Password */}
          <div>
            <div className="flex items-center gap-3 mb-3 text-neutral-400">
              <Shield className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="font-satoshi text-[10px] uppercase tracking-[0.2em] font-bold">New Password</span>
            </div>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/10 text-neutral-900 font-medium transition-all text-sm pr-12"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[var(--color-primary)] transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* Confirm Password */}
          <div>
            <div className="flex items-center gap-3 mb-3 text-neutral-400">
              <Shield className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="font-satoshi text-[10px] uppercase tracking-[0.2em] font-bold">Confirm Password</span>
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/10 text-neutral-900 font-medium transition-all text-sm pr-12"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[var(--color-primary)] transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end border-t border-neutral-100/80 pt-6">
          <button 
            type="button"
            onClick={handleChangePassword} 
            disabled={isChangingPassword} 
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)] transition-all font-medium text-[15px] flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
          >
            {isChangingPassword ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
