import React, { useState, useEffect } from "react";
import { Gift, User, Calendar, ShoppingBag, Users, Copy } from "lucide-react";
import { get, post } from "../api/BaseService";
import { getCaseInsensitiveProperty } from "../api/productService";
import { showToast } from "../utils/toastService";

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

interface RewardPointsDashboardProps {
  profileData: ProfileData;
}

export function RewardPointsDashboard({ profileData }: RewardPointsDashboardProps) {
  const [isRewardsLoading, setIsRewardsLoading] = useState(true);
  const [rewardSettings, setRewardSettings] = useState<any>(null);
  const [rewardLedger, setRewardLedger] = useState<any[]>([]);
  const [rewardEntryTypeFilter, setRewardEntryTypeFilter] = useState<"CREDIT" | "DEBIT" | "">("");

  const fetchRewardsData = async () => {
    try {
      setIsRewardsLoading(true);
      const customerId = localStorage.getItem("customerId");
      if (!customerId) return;

      // Fetch Settings
      const settingsResult: any = await get("/Reward/GetAll");
      if (settingsResult?.data && settingsResult.data.length > 0) {
        setRewardSettings(settingsResult.data[0]);
      }

      // Fetch Ledger
      const payload = {
        customerId: Number(customerId),
        entryType: rewardEntryTypeFilter,
        start: 0,
        length: 100, // Get top 100
        sortColumnIndex: 0,
        sortDirection: ""
      };
      const ledgerResult: any = await post("/Reward/CustomerGetAll", payload);
      const dataObj = getCaseInsensitiveProperty(ledgerResult, "data") || ledgerResult;

      let table2 = getCaseInsensitiveProperty<any[]>(dataObj, "table2") || [];
      if (!Array.isArray(table2) || table2.length === 0) {
        for (const key of Object.keys(dataObj)) {
          if (Array.isArray(dataObj[key]) && key.toLowerCase().includes("table2")) {
            table2 = dataObj[key];
            break;
          }
        }
      }
      setRewardLedger(table2 || []);
    } catch (err) {
      console.error("Failed to fetch rewards", err);
      showToast("error", "Failed to load rewards data");
    } finally {
      setIsRewardsLoading(false);
    }
  };

  useEffect(() => {
    fetchRewardsData();
  }, [rewardEntryTypeFilter]);

  return (
    <div className="p-4 sm:p-8 lg:p-12 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-3xl font-serif text-neutral-900 tracking-tight">My Rewards</h2>
      </div>

      {isRewardsLoading && !rewardSettings ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-[2rem] p-8 sm:p-10 shadow-2xl shadow-[var(--color-primary)]/20 text-white border border-white/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-[80px] opacity-20 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
              <div>
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <Gift className="w-3.5 h-3.5" /> Total Coin Balance
                </p>
                <div className="flex items-end gap-3">
                  <h2 className="text-5xl sm:text-6xl font-serif text-white tracking-tight flex items-center gap-2">
                    {profileData?.RewardCoins || 0}
                    <span className="text-amber-400">🪙</span>
                  </h2>
                </div>
                {rewardSettings && rewardSettings.CoinToRupeeRate && (
                  <p className="text-white/90 font-medium mt-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full inline-block border border-white/10 text-sm">
                    Equivalent to <strong className="text-amber-300">₹{((profileData?.RewardCoins || 0) / rewardSettings.CoinToRupeeRate).toFixed(2)}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* How It Works */}
          {rewardSettings && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-1">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-xl font-serif text-neutral-900">{rewardSettings.SignupCoins} 🪙</span>
                <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">On Signup</span>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-1">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xl font-serif text-neutral-900">{rewardSettings.LoginCoins} 🪙</span>
                <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Daily Login</span>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-1">
                  <Gift className="w-5 h-5" />
                </div>
                <span className="text-xl font-serif text-neutral-900">{rewardSettings.ReferralCoins} 🪙</span>
                <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Per Referral</span>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full flex items-center justify-center mb-1">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-xl font-serif text-neutral-900">Up to {rewardSettings.MaxCoinUsagePercent}%</span>
                <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Usage per Order</span>
              </div>
            </div>
          )}

          {/* Referral Code Share in Rewards Tab */}
          {profileData?.ReferralCode && (
            <div className="group bg-white rounded-[1.5rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[var(--color-primary)]/20 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:border-[var(--color-primary)]/40 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-accent)] opacity-100"></div>
              <div className="flex items-center gap-3 mb-4 text-[var(--color-primary)]">
                <Users className="w-5 h-5" />
                <span className="font-satoshi text-[11px] uppercase tracking-[0.2em] font-bold">Refer & Earn</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <p className="text-neutral-900 font-serif text-3xl tracking-tight">
                    {profileData.ReferralCode}
                  </p>
                  <p className="text-sm text-neutral-500 mt-2 font-satoshi text-justify">Share this link with your friends to earn <strong className="text-[var(--color-primary)]">{rewardSettings?.ReferralCoins || 0} 🪙</strong> when they sign up!</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin}/?ref=${profileData.ReferralCode}`;
                    navigator.clipboard.writeText(link);
                    showToast("success", "Referral link copied to clipboard!");
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)] shadow-lg shadow-[var(--color-primary)]/20 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer"
                >
                  <Copy className="w-4 h-4" /> Copy Referral Link
                </button>
              </div>
            </div>
          )}

          {/* Ledger History Passbook */}
          <div className="bg-white rounded-[1.5rem] border border-neutral-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/30">
              <h3 className="text-xl font-serif text-neutral-900 tracking-tight">Transaction History</h3>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
                {[
                  { label: 'ALL', value: '' },
                  { label: 'EARNED', value: 'CREDIT' },
                  { label: 'USED', value: 'DEBIT' }
                ].map(tab => (
                  <button
                    type="button"
                    key={tab.label}
                    onClick={() => setRewardEntryTypeFilter(tab.value as any)}
                    className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap cursor-pointer ${rewardEntryTypeFilter === tab.value
                        ? 'bg-neutral-900 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                        : 'bg-white text-neutral-500 border border-neutral-200 hover:text-neutral-900 hover:border-neutral-300 shadow-sm'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {isRewardsLoading ? (
              <div className="p-16 flex justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin"></div>
              </div>
            ) : rewardLedger.length === 0 ? (
              <div className="p-16 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-100/50 shadow-inner">
                  <Gift className="w-10 h-10 text-amber-400" />
                </div>
                <h4 className="text-2xl font-serif text-neutral-900 mb-2">No Transactions Found</h4>
                <p className="text-neutral-500 font-satoshi text-sm max-w-sm">Your reward wallet history will appear here once you start earning or spending coins.</p>
              </div>
            ) : (
              <div className="divide-y-[3px] divide-neutral-900 md:divide-y md:divide-neutral-100/80 bg-neutral-50/20">
                {rewardLedger.map((entry, idx) => {
                  const isCredit = entry.EntryType === 'CREDIT' || entry.Coins > 0;

                  // Format Date
                  const dateObj = new Date(entry.CreatedDate);
                  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
                  const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                  // Badge Style
                  let badgeStyle = "bg-neutral-100 text-neutral-600";
                  const typeStr = (entry.TransactionType || entry.EntryType || '').toUpperCase();
                  if (typeStr.includes('LOGIN')) badgeStyle = "bg-purple-50 text-purple-600 border border-purple-100 shadow-[0_2px_8px_rgba(168,85,247,0.1)]";
                  else if (typeStr.includes('SIGNUP')) badgeStyle = "bg-blue-50 text-blue-600 border border-blue-100 shadow-[0_2px_8px_rgba(59,130,246,0.1)]";
                  else if (typeStr.includes('REFERRAL')) badgeStyle = "bg-orange-50 text-orange-600 border border-orange-100 shadow-[0_2px_8px_rgba(249,115,22,0.1)]";
                  else if (typeStr.includes('RETURN') || typeStr.includes('ADMIN')) badgeStyle = "bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-[0_2px_8px_rgba(16,185,129,0.1)]";
                  else if (typeStr.includes('USED') || typeStr.includes('DEBIT')) badgeStyle = "bg-red-50 text-red-600 border border-red-100 shadow-[0_2px_8px_rgba(239,68,68,0.1)]";
                  else if (typeStr.includes('EARNED') || typeStr.includes('CREDIT')) badgeStyle = "bg-green-50 text-green-600 border border-green-100 shadow-[0_2px_8px_rgba(34,197,94,0.1)]";

                  return (
                    <div key={idx} className="p-5 sm:p-6 bg-white hover:bg-neutral-50/80 hover:shadow-[inset_4px_0_0_var(--color-primary)] transition-all duration-300 group">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6">

                        {/* DATE & TIME */}
                        <div className="w-full md:w-32 flex-shrink-0 flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start text-xs font-bold text-neutral-400 tracking-widest border-b md:border-b-0 border-neutral-100 pb-3 md:pb-0 mb-1 md:mb-0">
                          <span className="text-neutral-600 uppercase">{formattedDate}</span>
                          <span className="mt-1 md:mt-1.5">{formattedTime}</span>
                        </div>

                        {/* CENTER: Badge & Description */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-block px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] rounded-md ${badgeStyle}`}>
                              {typeStr.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <h4 className="text-[15px] sm:text-base font-bold text-neutral-900 tracking-tight leading-snug">
                            {entry.DisplayText}
                          </h4>
                          {entry.OrderNumber && (
                            <p className="text-xs text-neutral-500 mt-1.5 font-satoshi flex items-center gap-1.5 bg-neutral-50 inline-flex px-2 py-1 rounded-md border border-neutral-100">
                              <ShoppingBag className="w-3.5 h-3.5" />
                              Order {entry.OrderNumber}
                            </p>
                          )}
                        </div>

                        {/* Divider for Desktop */}
                        <div className="hidden md:block w-px h-14 bg-gradient-to-b from-transparent via-neutral-200 to-transparent mx-2 opacity-50"></div>

                        {/* Divider for Mobile */}
                        <div className="md:hidden w-full h-px bg-neutral-100 my-2"></div>

                        {/* COINS & BALANCE */}
                        <div className="w-full md:w-48 flex-shrink-0 flex flex-row md:flex-col justify-between md:justify-end items-center md:items-end gap-2">
                          <div className={`text-xl sm:text-3xl font-serif tracking-tight flex items-center gap-2 drop-shadow-sm ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                            {isCredit ? '+' : ''}{entry.Coins} <span className="text-amber-400 text-lg sm:text-2xl filter drop-shadow-sm">🪙</span>
                          </div>
                          <div className="text-xs font-bold text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100 flex items-center gap-1.5 shadow-inner">
                            Balance: <span className="text-neutral-900">{entry.RemainingBalance ?? 0}</span> 🪙
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
