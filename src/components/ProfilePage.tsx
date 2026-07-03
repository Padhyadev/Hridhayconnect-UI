import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Shield, ShoppingBag, LogOut, X, MapPin, Gift, Award, Plus, Truck, Calendar, Sparkles, Bell, Check, RefreshCw, Clock, CheckSquare, Trash2, Save } from "lucide-react";
import { get, post } from "../api/BaseService";
import { getCaseInsensitiveProperty } from "../api/productService";
import { showApiResponseToast, showToast } from "../utils/toastService";
import { ProfileInfoForm } from "./ProfileInfoForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { AddressBook } from "./AddressBook";
import { OrderHistoryList } from "./OrderHistoryList";
import { RewardPointsDashboard } from "./RewardPointsDashboard";

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

interface AddressInfo {
  Id: number;
  CustomerId: number;
  AddressLine1: string;
  AddressLine2: string;
  City: string;
  PostalCode: string;
  IsDefault: boolean;
  AddressType: string;
  MobileNo: string;
  AlternativeMobileNo: string;
  CountryId: number;
  StateId: number;
  Country?: string;
  State?: string;
}

interface OrderItem {
  Id: number;
  OrderId: number;
  ProductName: string;
  VariantName: string;
  Quantity: number;
  UnitPrice: number;
  TotalPrice: number;
  ImagePath?: string;
}

interface Order {
  Id: number;
  OrderNumber: string;
  OrderDate: string;
  TotalAmount: number;
  DeliveryFee: number;
  DiscountAmount: number;
  UsedCoins: number;
  CoinDiscountAmount: number;
  FinalAmount: number;
  OrderStatusName: string;
  PaymentStatusName: string;
  PaymentModeName: string;
  MobileNo: string;
  AddressLine1: string;
  City: string;
  PostalCode: string;
  TrackingHistory: string;
}

const safeRender = (val: any) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return '';
  return String(val);
};

export const ProfilePage = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("customerId");
    localStorage.removeItem("customerProfile");
    window.location.hash = "#home";
    window.location.reload();
  };

  const [activeTab, setActiveTab] = useState(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    return ['profile', 'orders', 'addresses', 'rewards', 'notifications', 'password'].includes(hash) ? hash : 'profile';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['profile', 'orders', 'addresses', 'rewards', 'notifications', 'password'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Address states
  const [homeAddress, setHomeAddress] = useState<AddressInfo | null>(null);
  const [shippingAddresses, setShippingAddresses] = useState<AddressInfo[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressFormMode, setAddressFormMode] = useState<'HOME' | 'SHIPPING'>('SHIPPING');
  const [addressForm, setAddressForm] = useState<Partial<AddressInfo>>({});
  const [countries, setCountries] = useState<{ id: number, name: string }[]>([]);
  const [states, setStates] = useState<{ id: number, name: string }[]>([]);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Order states
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Cancel Order states
  const [cancelingOrder, setCancelingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("I have changed my mind");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Notifications states
  const [notificationsPageData, setNotificationsPageData] = useState<any[]>([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [isLoadingMoreNotifications, setIsLoadingMoreNotifications] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);

  const fetchNotificationsPage = async (isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMoreNotifications(true);
    } else {
      setIsNotificationsLoading(true);
    }
    try {
      const start = isLoadMore ? notificationsPageData.length : 0;
      const res: any = await post('/Notification/GetAll', {
        search: "",
        start: start,
        length: 10,
        sortColumnIndex: 0,
        sortDirection: ""
      });
      if (res && res.data) {
        const newNotifs = res.data.table2 || [];
        const total = res.data.table1?.[0]?.TotalRecords || 0;

        if (isLoadMore) {
          setNotificationsPageData(prev => [...prev, ...newNotifs]);
        } else {
          setNotificationsPageData(newNotifs);
        }
        setTotalNotifications(total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsNotificationsLoading(false);
      setIsLoadingMoreNotifications(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotificationsPage();
    }
    const handleUpdate = () => {
      if (activeTab === 'notifications') fetchNotificationsPage();
    };
    window.addEventListener('notificationsUpdated', handleUpdate);
    return () => window.removeEventListener('notificationsUpdated', handleUpdate);
  }, [activeTab]);

  const handleReadNotificationPage = async (id: number) => {
    try {
      await post(`/Notification/Read?id=${id}`, {});
      setNotificationsPageData(prev => prev.map(n => n.Id === id ? { ...n, IsRead: true } : n));
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (err) { }
  };

  const handleReadAllPage = async () => {
    try {
      await post('/Notification/ReadAll', {});
      setNotificationsPageData(prev => prev.map(n => ({ ...n, IsRead: true })));
      window.dispatchEvent(new Event('notificationsUpdated'));
      showToast('success', 'All notifications marked as read');
    } catch (err) { }
  };

  const handleDeleteNotificationPage = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await post(`/Notification/Delete?id=${id}`, {});
      setNotificationsPageData(prev => prev.filter(n => n.Id !== id));
      setTotalNotifications(prev => Math.max(0, prev - 1));
      window.dispatchEvent(new Event('notificationsUpdated'));
      showToast('success', 'Notification deleted');
    } catch (err) { }
  };

  const toggleNotificationSelection = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNotifications(prev =>
      prev.includes(id) ? prev.filter(nId => nId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return;
    try {
      await post('/Notification/BulkDelete', { ids: selectedNotifications.join(',') });
      setNotificationsPageData(prev => prev.filter(n => !selectedNotifications.includes(n.Id)));
      setTotalNotifications(prev => Math.max(0, prev - selectedNotifications.length));
      setSelectedNotifications([]);
      window.dispatchEvent(new Event('notificationsUpdated'));
      showToast('success', `${selectedNotifications.length} notifications deleted`);
    } catch (err) {
      console.error(err);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just Now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 172800) return 'Yesterday';

    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationGroup = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateToCompare = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (dateToCompare.getTime() === today.getTime()) return 'TODAY';
    if (dateToCompare.getTime() === yesterday.getTime()) return 'YESTERDAY';

    const diffTime = Math.abs(today.getTime() - dateToCompare.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) return 'THIS WEEK';
    return 'OLDER';
  };

  const getNotificationStyle = (message: string) => {
    const msg = message.toLowerCase();
    if (msg.includes('order') && msg.includes('placed')) return { icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' };
    if (msg.includes('order') && msg.includes('shipped')) return { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' };
    if (msg.includes('order') || msg.includes('status')) return { icon: ShoppingBag, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' };
    if (msg.includes('reward') && msg.includes('refund')) return { icon: RefreshCw, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' };
    if (msg.includes('reward') || msg.includes('coin')) return { icon: Gift, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100' };
    if (msg.includes('referral')) return { icon: User, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' };
    if (msg.includes('login')) return { icon: User, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-100' };
    return { icon: Bell, color: 'text-neutral-500', bg: 'bg-neutral-50', border: 'border-neutral-100' };
  };

  const groupedNotifications = notificationsPageData.reduce((groups: any, notif: any) => {
    const group = getNotificationGroup(notif.CreatedDate);
    if (!groups[group]) groups[group] = [];
    groups[group].push(notif);
    return groups;
  }, {});

  const groupOrder = ['TODAY', 'YESTERDAY', 'THIS WEEK', 'OLDER'];

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const customerId = localStorage.getItem("customerId");

      if (!customerId) {
        setError("User not authenticated.");
        setIsLoading(false);
        return;
      }

      const bodyObj = {
        Id: Number(customerId),
        Search: ""
      };

      const result: any = await post("/Customer/GetAll", bodyObj);
      const dataObj = getCaseInsensitiveProperty(result, "data") || result;

      // Look for table1 (Profile Details)
      let table1 = getCaseInsensitiveProperty<any[]>(dataObj, "table1") || [];
      if (!Array.isArray(table1) || table1.length === 0) {
        for (const key of Object.keys(dataObj)) {
          if (Array.isArray(dataObj[key]) && key.toLowerCase().includes("table1")) {
            table1 = dataObj[key];
            break;
          }
        }
      }

      if (table1 && table1.length > 0) {
        setProfileData(table1[0]);
      } else {
        setError("Profile details not found.");
      }

      // Look for table2 (Addresses)
      let table2 = getCaseInsensitiveProperty<any[]>(dataObj, "table2") || [];
      if (!Array.isArray(table2) || table2.length === 0) {
        for (const key of Object.keys(dataObj)) {
          if (Array.isArray(dataObj[key]) && key.toLowerCase().includes("table2")) {
            table2 = dataObj[key];
            break;
          }
        }
      }

      if (table2 && table2.length > 0) {
        const home = table2.find(a => a.AddressType === "HOME");
        const shipping = table2.filter(a => a.AddressType === "SHIPPING");
        setHomeAddress(home || null);
        setShippingAddresses(shipping);
      } else {
        setHomeAddress(null);
        setShippingAddresses([]);
      }

      // Look for table4 (Orders)
      let table4 = getCaseInsensitiveProperty<any[]>(dataObj, "table4") || [];
      if (!Array.isArray(table4) || table4.length === 0) {
        for (const key of Object.keys(dataObj)) {
          if (Array.isArray(dataObj[key]) && key.toLowerCase().includes("table4")) {
            table4 = dataObj[key];
            break;
          }
        }
      }
      setOrders(table4 || []);

      // Look for table5 (Order Items)
      let table5 = getCaseInsensitiveProperty<any[]>(dataObj, "table5") || [];
      if (!Array.isArray(table5) || table5.length === 0) {
        for (const key of Object.keys(dataObj)) {
          if (Array.isArray(dataObj[key]) && key.toLowerCase().includes("table5")) {
            table5 = dataObj[key];
            break;
          }
        }
      }
      setOrderItems(table5 || []);

    } catch (err) {
      console.error("Failed to fetch profile", err);
      setError("Failed to load profile details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelingOrder) return;
    try {
      setIsSubmittingCancel(true);
      const payload = {
        id: cancelingOrder.Id,
        status: "12",
        reason: cancelReason
      };

      const queryParams = new URLSearchParams({
        id: cancelingOrder.Id.toString(),
        status: "12",
        reason: cancelReason
      }).toString();

      const response: any = await post(`/Orders/UpdateChnageStatus?${queryParams}`, payload);

      if (response && response.statusCode === 200) {
        showToast("success", "Order cancelled successfully!");
        setCancelingOrder(null);
        fetchProfile();
      } else {
        showToast("error", response?.message || "Failed to cancel order.");
      }
    } catch (err) {
      console.error("Cancel order error:", err);
      showToast("error", "An error occurred while canceling the order.");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Fetch Countries
  useEffect(() => {
    if (isAddressModalOpen && countries.length === 0) {
      get("/Dropdown/CountryList").then((res: any) => {
        if (res && res.data) setCountries(res.data);
      }).catch(console.error);
    }
  }, [isAddressModalOpen]);

  // Fetch States based on Country
  useEffect(() => {
    if (addressForm.CountryId && addressForm.CountryId > 0) {
      get(`/Dropdown/StateList?CountryId=${addressForm.CountryId}`).then((res: any) => {
        if (res && res.data) setStates(res.data);
      }).catch(console.error);
    } else {
      setStates([]);
    }
  }, [addressForm.CountryId]);

  const openAddressModal = (mode: 'HOME' | 'SHIPPING', existingAddr?: AddressInfo) => {
    setAddressFormMode(mode);
    if (existingAddr) {
      setAddressForm({ ...existingAddr });
    } else {
      setAddressForm({ CountryId: 0, StateId: 0 });
    }
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingAddress(true);
      const customerId = localStorage.getItem("customerId");
      if (!customerId) return;

      const payload = {
        id: addressForm.Id || 0,
        customerId: Number(customerId),
        countryId: Number(addressForm.CountryId),
        stateId: Number(addressForm.StateId),
        addressLine1: addressForm.AddressLine1 || "",
        addressLine2: typeof addressForm.AddressLine2 === 'string' && addressForm.AddressLine2.trim() !== "" ? addressForm.AddressLine2 : null,
        city: addressForm.City || "",
        postalCode: addressForm.PostalCode || "",
        mobileNo: addressForm.MobileNo || "",
        alternativeMobileNo: typeof addressForm.AlternativeMobileNo === 'string' && addressForm.AlternativeMobileNo.trim() !== "" ? addressForm.AlternativeMobileNo : null,
        addressType: addressFormMode
      };

      const res: any = await post("/Customer/UpdateAdress", payload);
      showApiResponseToast(res);

      if (res.isSuccess || res.statusCode === 1 || res.StatusCode === 1) {
        setIsAddressModalOpen(false);
        fetchProfile();
      }
    } catch (err: any) {
      showToast("error", "Failed to save address");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSetDefaultShipping = async (addressId: number) => {
    try {
      const res: any = await post(`/Customer/ChangeDefaultAddress?CustomerAddressId=${addressId}`, {});
      showApiResponseToast(res);
      fetchProfile();
    } catch (err: any) {
      showToast("error", "Failed to set default address");
    }
  };

  // Navigation Menu Items
  const navItems = [
    { id: 'profile', label: 'Profile Details', icon: User },
    { id: 'orders', label: 'Order History', icon: ShoppingBag },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'password', label: 'Change Password', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-cream)] pt-32 pb-24 relative overflow-hidden">
      {/* Left Drawer (Mobile-only) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-[999] lg:hidden"
            />

            {/* Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-2xl z-[1000] lg:hidden flex flex-col p-6"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-5 mb-6">
                <span className="font-serif text-2xl text-neutral-900 tracking-tight">Menu Navigation</span>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              {/* Navigation Menu */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        window.location.hash = item.id;
                        setActiveTab(item.id);
                        setIsDrawerOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold tracking-wide transition-all ${
                        isActive
                          ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20"
                          : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Logout Button inside drawer */}
              <div className="border-t border-neutral-100 pt-6 mt-6">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-5 py-4 text-red-500 hover:bg-red-50 rounded-2xl text-sm font-bold tracking-wide transition-colors"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar Menu - Desktop */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full lg:w-80 shrink-0 hidden lg:block"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 space-y-2 sticky top-36">
              {/* Premium User Card Header */}
              {profileData && (
                <div className="p-4 border-b border-neutral-100/80 pb-5 mb-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold text-lg font-serif">
                    {profileData.FirstName ? profileData.FirstName[0].toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-lg text-neutral-900 truncate leading-snug">{profileData.FirstName} {profileData.LastName}</h3>
                    <p className="text-xs text-neutral-400 truncate mt-0.5 font-satoshi font-medium">{profileData.Email}</p>
                  </div>
                </div>
              )}

              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      window.location.hash = item.id;
                      setActiveTab(item.id);
                    }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold tracking-wide transition-all ${
                      isActive
                        ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20"
                        : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </button>
                );
              })}

              <div className="border-t border-neutral-100/80 pt-4 mt-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-5 py-4 text-red-500 hover:bg-red-50 rounded-2xl text-sm font-bold tracking-wide transition-colors"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>

          {/* Tab Content Panels */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 w-full"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden min-h-[600px]">

              {/* Profile Details Tab */}
              {activeTab === 'profile' && (
                <>
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
                      <div className="w-10 h-10 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin"></div>
                      <p className="text-sm text-neutral-500 font-satoshi animate-pulse">Loading your profile...</p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center gap-4 px-6">
                      <Shield className="w-16 h-16 text-red-300 opacity-50 mb-2" />
                      <p className="text-red-500 font-satoshi">{error}</p>
                      <button
                        onClick={fetchProfile}
                        className="mt-4 px-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-sm font-medium transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : profileData ? (
                    <ProfileInfoForm
                      profileData={profileData}
                      ordersCount={orders.length}
                      onSaveSuccess={fetchProfile}
                    />
                  ) : null}
                </>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <ChangePasswordForm />
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <AddressBook
                  isLoading={isLoading}
                  profileData={profileData}
                  homeAddress={homeAddress}
                  shippingAddresses={shippingAddresses}
                  openAddressModal={openAddressModal}
                  handleSetDefaultShipping={handleSetDefaultShipping}
                />
              )}

              {/* Order History Tab */}
              {activeTab === 'orders' && (
                <OrderHistoryList
                  isLoading={isLoading}
                  orders={orders}
                  orderItems={orderItems}
                  onCancelOrder={(order) => setCancelingOrder(order)}
                />
              )}

              {/* Rewards Tab */}
              {activeTab === 'rewards' && profileData && (
                <RewardPointsDashboard
                  profileData={profileData}
                />
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-4 sm:p-8 lg:p-12 space-y-8 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                    <div>
                      <h2 className="text-3xl font-serif text-neutral-900 tracking-tight">Notifications</h2>
                      <p className="text-sm font-medium text-neutral-500 mt-1 flex items-center gap-2">
                        {totalNotifications} total notifications
                        {notificationsPageData.some((n: any) => !n.IsRead) && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            Unread Messages
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Action Toolbar */}
                    {notificationsPageData.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedNotifications.length > 0 ? (
                          <>
                            <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 transition-colors rounded-xl text-sm font-bold shadow-sm">
                              <Trash2 className="w-4 h-4" /> Delete ({selectedNotifications.length})
                            </button>
                            <button onClick={() => setSelectedNotifications([])} className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors rounded-xl text-sm font-bold shadow-sm">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => fetchNotificationsPage(false)} className="p-2 text-neutral-400 hover:text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-xl transition-all shadow-sm">
                              <RefreshCw className={`w-4 h-4 ${isNotificationsLoading ? 'animate-spin text-[var(--color-primary)]' : ''}`} />
                            </button>
                            {notificationsPageData.some((n: any) => !n.IsRead) && (
                              <button onClick={handleReadAllPage} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors rounded-xl text-sm font-bold shadow-sm">
                                <Plus className="w-4 h-4" /> Mark all read
                              </button>
                            )}
                            <button onClick={() => {
                              if (selectedNotifications.length === notificationsPageData.length) setSelectedNotifications([]);
                              else setSelectedNotifications(notificationsPageData.map(n => n.Id));
                            }} className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors rounded-xl text-sm font-bold shadow-sm">
                              <CheckSquare className="w-4 h-4" /> Select All
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {isNotificationsLoading && notificationsPageData.length === 0 ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white rounded-[1.5rem] border border-neutral-100/60 p-6 flex gap-4 animate-pulse">
                          <div className="w-12 h-12 rounded-full bg-neutral-100 flex-shrink-0"></div>
                          <div className="flex-1 space-y-3 py-1">
                            <div className="h-4 bg-neutral-100 rounded w-3/4"></div>
                            <div className="h-3 bg-neutral-100 rounded w-1/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notificationsPageData.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-12 sm:p-20 flex flex-col items-center justify-center text-center">
                      <div className="relative mb-8">
                        <div className="w-32 h-32 bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 rounded-full flex items-center justify-center">
                          <Bell className="w-16 h-16 text-[var(--color-primary)]/20" />
                        </div>
                        <div className="absolute top-0 right-0 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center animate-bounce">
                          <Sparkles className="w-5 h-5 text-amber-400" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-serif text-neutral-900 mb-3 tracking-tight">No Notifications Yet</h3>
                      <p className="text-neutral-500 font-medium max-w-md mx-auto">
                        When you get orders, rewards, or special offers, they'll show up here. You're all caught up for now!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-fade-in">
                      {groupOrder.map(group => {
                        const notifsInGroup = groupedNotifications[group];
                        if (!notifsInGroup || notifsInGroup.length === 0) return null;

                        return (
                          <div key={group} className="space-y-4">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-2">
                              {group}
                            </h3>
                            <div className="space-y-3">
                              {notifsInGroup.map((notif: any) => {
                                const isSelected = selectedNotifications.includes(notif.Id);
                                const style = getNotificationStyle(notif.Message);
                                const Icon = style.icon;

                                return (
                                  <div
                                    key={notif.Id}
                                    onClick={() => !notif.IsRead && handleReadNotificationPage(notif.Id)}
                                    className={`relative p-5 sm:p-6 rounded-[1.5rem] transition-all duration-300 border flex gap-4 group cursor-pointer
                                      ${isSelected ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/30 ring-1 ring-[var(--color-primary)]/30' :
                                        notif.IsRead ? 'bg-neutral-50/50 border-neutral-100/60 hover:bg-white hover:border-neutral-200 hover:shadow-md' :
                                          'bg-white border-transparent shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)]'
                                      }
                                    `}
                                  >
                                    {/* Unread Left Border Indicator */}
                                    {!notif.IsRead && (
                                      <div className="absolute left-0 top-6 bottom-6 w-1.5 rounded-r-full bg-[var(--color-primary)] shadow-[0_0_12px_var(--color-primary)]"></div>
                                    )}

                                    {/* Multi-Select Checkbox */}
                                    <div className="pt-1.5 flex-shrink-0" onClick={(e) => toggleNotificationSelection(notif.Id, e)}>
                                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${isSelected ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-neutral-300 bg-white group-hover:border-[var(--color-primary)]/50'}`}>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                      </div>
                                    </div>

                                    {/* Icon */}
                                    <div className="pt-0.5 flex-shrink-0">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-105 duration-300 ${notif.IsRead ? 'bg-white border-neutral-200 text-neutral-400' : `${style.bg} ${style.border} ${style.color} shadow-inner`}`}>
                                        <Icon className="w-6 h-6" />
                                      </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                      <div className="flex-1">
                                        <p className={`text-[15px] leading-relaxed mb-2 ${notif.IsRead ? 'text-neutral-600 font-medium' : 'text-neutral-900 font-bold tracking-tight'}`}>
                                          {notif.Message}
                                        </p>
                                        <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider">
                                          <span className="flex items-center gap-1.5 text-neutral-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            {getRelativeTime(notif.CreatedDate)}
                                          </span>
                                          {notif.IsRead && (
                                            <span className="text-neutral-300 flex items-center gap-1">
                                              <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                                              Read
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Quick Actions (Hover) */}
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 flex-shrink-0">
                                        <button
                                          onClick={(e) => handleDeleteNotificationPage(notif.Id, e)}
                                          className="p-2.5 bg-white border border-neutral-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl transition-all shadow-sm"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Progressive Loading / View More */}
                      {notificationsPageData.length < totalNotifications && (
                        <div className="pt-6 pb-4 flex flex-col items-center justify-center border-t border-neutral-100">
                          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
                            Showing {notificationsPageData.length} of {totalNotifications} Notifications
                          </p>
                          <button
                            onClick={() => fetchNotificationsPage(true)}
                            disabled={isLoadingMoreNotifications}
                            className="px-8 py-3 bg-white border-2 border-neutral-200 text-neutral-700 font-bold rounded-xl hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isLoadingMoreNotifications ? (
                              <>
                                <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                                Loading...
                              </>
                            ) : (
                              'View More'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Placeholder Content for other tabs */}
              {activeTab !== 'profile' && activeTab !== 'addresses' && activeTab !== 'orders' && activeTab !== 'rewards' && activeTab !== 'notifications' && (
                <div className="flex flex-col items-center justify-center h-full min-h-[500px] p-12 text-center">
                  <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mb-6 text-neutral-300">
                    {(() => {
                      const Icon = navItems.find(item => item.id === activeTab)?.icon;
                      return Icon ? <Icon className="w-10 h-10" /> : null;
                    })()}
                  </div>
                  <h3 className="text-2xl font-serif text-neutral-900 mb-3 tracking-tight">
                    {navItems.find(item => item.id === activeTab)?.label}
                  </h3>
                  <p className="text-neutral-500 font-satoshi max-w-sm">
                    This section is currently under development. Check back later for updates!
                  </p>
                  <button onClick={() => setActiveTab('profile')} className="mt-8 px-6 py-2.5 bg-white border border-neutral-200 rounded-full text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
                    Back to Profile
                  </button>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>

      {/* Address Form Modal */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative"
            >
              <div className="flex justify-between items-center p-6 sm:p-8 border-b border-neutral-100 bg-neutral-50/50">
                <h3 className="font-serif text-2xl text-neutral-900 tracking-tight">
                  {addressForm.Id ? 'Edit' : 'Add'} {addressFormMode === 'HOME' ? 'Home' : 'Shipping'} Address
                </h3>
                <button onClick={() => setIsAddressModalOpen(false)} className="p-2 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-full transition-colors shadow-sm">
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>
              <div className="p-6 sm:p-8 overflow-y-auto">
                <form onSubmit={handleSaveAddress} className="space-y-5">
                  {/* Address Line 1 */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">Address Line 1*</label>
                    <input required type="text" placeholder="Street address, house number" value={safeRender(addressForm.AddressLine1)} onChange={(e) => setAddressForm({ ...addressForm, AddressLine1: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors text-neutral-900 font-medium" />
                  </div>
                  {/* Address Line 2 */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">Address Line 2</label>
                    <input type="text" placeholder="Apartment, suite, unit, etc. (optional)" value={safeRender(addressForm.AddressLine2)} onChange={(e) => setAddressForm({ ...addressForm, AddressLine2: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors text-neutral-900 font-medium" />
                  </div>
                  {/* Grid for City & Postal Code */}
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">City*</label>
                      <input required type="text" value={safeRender(addressForm.City)} onChange={(e) => setAddressForm({ ...addressForm, City: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors text-neutral-900 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">Postal Code*</label>
                      <input required type="text" value={safeRender(addressForm.PostalCode)} onChange={(e) => setAddressForm({ ...addressForm, PostalCode: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors text-neutral-900 font-medium" />
                    </div>
                  </div>
                  {/* Grid for Country & State */}
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">Country*</label>
                      <select required value={addressForm.CountryId || 0} onChange={(e) => setAddressForm({ ...addressForm, CountryId: Number(e.target.value) })} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors text-neutral-900 font-medium">
                        <option value={0} disabled>Select Country</option>
                        {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">State*</label>
                      <select required value={addressForm.StateId || 0} onChange={(e) => setAddressForm({ ...addressForm, StateId: Number(e.target.value) })} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors text-neutral-900 font-medium disabled:opacity-50" disabled={!addressForm.CountryId}>
                        <option value={0} disabled>Select State</option>
                        {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Grid for Mobile & Alt Mobile */}
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">Mobile No*</label>
                      <input required type="text" value={safeRender(addressForm.MobileNo)} onChange={(e) => setAddressForm({ ...addressForm, MobileNo: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors text-neutral-900 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">Alt Mobile No</label>
                      <input type="text" value={safeRender(addressForm.AlternativeMobileNo)} onChange={(e) => setAddressForm({ ...addressForm, AlternativeMobileNo: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors text-neutral-900 font-medium" />
                    </div>
                  </div>
                  <div className="pt-6 border-t border-neutral-100 mt-8">
                    <button disabled={isSavingAddress} type="submit" className="w-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)] transition-all py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-[var(--color-primary)]/20 disabled:opacity-70">
                      {isSavingAddress ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                      {isSavingAddress ? 'Saving Address...' : 'Save Address'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Cancel Order Modal */}
      <AnimatePresence>
        {cancelingOrder && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative"
            >
              <div className="flex justify-between items-center p-6 sm:p-8 border-b border-neutral-100 bg-neutral-50/50">
                <h3 className="font-serif text-2xl text-neutral-900 tracking-tight text-red-600">
                  Cancel Order
                </h3>
                <button onClick={() => setCancelingOrder(null)} className="p-2 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-full transition-colors shadow-sm">
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-neutral-50/30">
                <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 mb-6">
                  <h4 className="font-bold text-neutral-900 mb-4">Order Items</h4>
                  <div className="space-y-4">
                    {orderItems.filter(i => i.OrderId === cancelingOrder.Id).map(item => (
                      <div key={item.Id} className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {item.ImagePath && typeof item.ImagePath === 'string' && item.ImagePath.trim() !== '' ? (
                            <img src={`https://hridhayconnectreact.bsite.net${item.ImagePath}`} alt={safeRender(item.ProductName)} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.classList.remove('hidden'); }} />
                          ) : null}
                          <ShoppingBag className={`w-6 h-6 text-neutral-300 ${item.ImagePath && typeof item.ImagePath === 'string' && item.ImagePath.trim() !== '' ? 'hidden' : ''}`} />
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 text-sm">{safeRender(item.ProductName)}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">Qty: {safeRender(item.Quantity)} • ₹{safeRender(item.TotalPrice)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 sm:p-6">
                  <h4 className="font-bold text-neutral-900 mb-4">Why are you canceling this order?</h4>
                  <div className="space-y-3">
                    {[
                      "I have changed my mind",
                      "Expected delivery time is very long",
                      "I want to change address for the order",
                      "I want to convert my order to Prepaid",
                      "Price for the product has decreased",
                      "I have purchased the product elsewhere"
                    ].map(reason => (
                      <label key={reason} onClick={() => setCancelReason(reason)} className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl border border-neutral-100 hover:border-[var(--color-primary)]/30 hover:bg-neutral-50 transition-colors">
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${cancelReason === reason ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-neutral-300'}`}>
                          {cancelReason === reason && <div className="w-2 h-2 rounded-full bg-white"></div>}
                        </div>
                        <span className={`text-sm font-medium ${cancelReason === reason ? 'text-neutral-900' : 'text-neutral-600'}`}>{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 border-t border-neutral-100 bg-white flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setCancelingOrder(null)}
                  className="px-6 py-2.5 bg-white border border-neutral-200 text-neutral-700 font-bold rounded-xl hover:bg-neutral-50 transition-all text-sm"
                  disabled={isSubmittingCancel}
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  className="px-8 py-2.5 bg-red-600 text-white font-bold rounded-xl shadow-md shadow-red-600/20 hover:bg-red-700 transition-all text-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={isSubmittingCancel}
                >
                  {isSubmittingCancel ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Canceling...</>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
