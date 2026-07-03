import { ChevronDown, ShoppingBag, User, LogOut, MapPin, Gift, Bell, X, Check, Heart, Shield } from "lucide-react";
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { StarButton } from "./ui/StarButton";
import { useSignUp } from "../context/SignUpContext";
import { get, post } from "../api/BaseService";
import { showToast } from "../utils/toastService";

interface NavigationProps {
  currentPage?: 'home' | 'about' | 'soap' | 'hair-oil' | 'mukhwas' | 'tea-masala' | 'hridhay-special' | 'product' | 'cart' | 'checkout' | 'profile' | 'wishlist' | 'contact';
}

export function Navigation({ currentPage = 'home' }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { cartCount, setIsCartOpen, clearCart } = useCart();
  const { wishlistItems } = useWishlist();
  const { openSignUp } = useSignUp();

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return typeof window !== 'undefined' && !!localStorage.getItem("authToken");
  });

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(!!localStorage.getItem("authToken"));
    };
    window.addEventListener("auth-change", checkAuth);
    window.addEventListener("storage", checkAuth);
    checkAuth();
    return () => {
      window.removeEventListener("auth-change", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await post('/Notification/GetAll', {
        search: "",
        start: 0,
        length: 20,
        sortColumnIndex: 0,
        sortDirection: ""
      });
      if (res && res.data && res.data.table2) {
        setNotifications(res.data.table2);
        setUnreadCount(res.data.table2.filter((n: any) => !n.IsRead).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
    }
    const handleUpdate = () => {
      if (isLoggedIn) fetchNotifications();
    };
    window.addEventListener('notificationsUpdated', handleUpdate);
    return () => window.removeEventListener('notificationsUpdated', handleUpdate);
  }, [isLoggedIn]);

  const handleReadNotification = async (id: number) => {
    try {
      await post(`/Notification/Read?id=${id}`, {});
      fetchNotifications();
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (err) { console.error(err); }
  };

  const handleReadAll = async () => {
    try {
      await post('/Notification/ReadAll', {});
      fetchNotifications();
      window.dispatchEvent(new Event('notificationsUpdated'));
      showToast('success', 'All notifications marked as read');
    } catch (err) { console.error(err); }
  };

  const handleDeleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await post(`/Notification/Delete?id=${id}`, {});
      fetchNotifications();
      window.dispatchEvent(new Event('notificationsUpdated'));
      showToast('success', 'Notification deleted');
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("customerId");
    localStorage.removeItem("customerProfile");
    localStorage.removeItem("hridhay_checkout");
    localStorage.removeItem("hridhay_cart");
    clearCart();
    window.dispatchEvent(new Event("auth-change"));
    window.location.reload();
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const categories = [
    {
      title: "Botanical Care",
      items: [
        { name: "Home Made Soap", desc: "Cold-pressed organic oils for gentle hydration", path: "#soap", icon: "✨" },
        { name: "Home Made Hair Oil", desc: "Nourishing herbal infusion for root-to-tip vitality", path: "#hair-oil", icon: "🌿" },
        // { name: "Hridhay Special", desc: "Premium handcrafted skincare & healing elixirs", path: "#hridhay-special", icon: "💎" },
      ]
    },
    {
      title: "Wellness Kitchen",
      items: [
        { name: "Mukhwas", desc: "Traditional digestive mouth freshener with organic seeds", path: "#mukhwas", icon: "🌱" },
        { name: "Tea Masala", desc: "Aromatic heritage spice blend with cardamom & ginger", path: "#tea-masala", icon: "☕" },
      ]
    }
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? 'bg-white/75 backdrop-blur-2xl border-b border-[#5B2A86]/8 shadow-[0_4px_24px_rgba(91,42,134,0.07)]'
          : 'bg-transparent'
          }`}
      >
        {/* Subtle gradient glow at top */}
        {!scrolled && (
          <div
            className="absolute inset-x-0 top-0 h-24 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(91,42,134,0.04) 0%, transparent 100%)'
            }}
          />
        )}

        <nav className="relative flex items-center justify-between px-5 md:px-8 max-w-7xl mx-auto w-full h-[64px] md:h-[72px]">

          {/* ── LEFT: Logo ── */}
          <a
            href="#"
            onClick={() => setIsOpen(false)}
            className="flex-shrink-0 cursor-pointer select-none z-10 group"
            aria-label="Hridhay Connect Home"
          >
            <motion.img
              src="/logo.webp"
              alt="Hridhay Connect"
              className="h-[34px] sm:h-10 md:h-12 w-auto object-contain"
              initial={false}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </a>

          {/* ── CENTER: Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <a
              href="#"
              onClick={() => setIsOpen(false)}
              className={`text-xs font-semibold uppercase tracking-wider transition-colors ${currentPage === 'home' ? 'text-[#5B2A86] font-bold' : 'text-[#1B1720] hover:text-[#7A49A5]'}`}
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setIsOpen(false)}
              className={`text-xs font-semibold uppercase tracking-wider transition-colors ${currentPage === 'about' ? 'text-[#5B2A86] font-bold' : 'text-[#1B1720] hover:text-[#7A49A5]'}`}
            >
              About
            </a>

            {/* Shop By Category Trigger & Mega Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <button
                className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${isOpen || ['soap', 'hair-oil', 'mukhwas', 'tea-masala'].includes(currentPage)
                  ? 'text-[#5B2A86] font-bold'
                  : 'text-[#1B1720] hover:text-[#7A49A5]'
                  }`}
              >
                <span>Shop By Category</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#5B2A86]' : 'rotate-0'}`} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-4 w-[540px] bg-white/90 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-[0_20px_50px_rgba(91,42,134,0.08)] overflow-hidden z-50 p-8 grid grid-cols-12 gap-8 text-left"
                  >
                    {categories.map((category, index) => (
                      <div key={index} className="col-span-6 flex flex-col">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5B2A86]/80 mb-6 border-b border-[#5B2A86]/5 pb-2">
                          {category.title}
                        </span>
                        <div className="flex flex-col gap-3">
                          {category.items.map((item, itemIdx) => (
                            <a
                              key={itemIdx}
                              href={item.path}
                              onClick={() => setIsOpen(false)}
                              className="group relative flex flex-col p-3 rounded-2xl transition-all duration-300 hover:bg-[#5B2A86]/5 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-0 before:bg-[#5B2A86] before:rounded-full hover:before:h-1/2 before:transition-all before:duration-300"
                            >
                              <div className="flex items-center gap-2 group-hover:translate-x-1.5 transition-transform duration-300">
                                <span className="text-sm">{item.icon}</span>
                                <span className="text-xs font-semibold text-[#1B1720] group-hover:text-[#5B2A86] transition-colors">
                                  {item.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-[#1B1720]/50 mt-1 pl-7 font-light font-satoshi group-hover:translate-x-1.5 transition-transform duration-300">
                                {item.desc}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a
              href="#hridhay-special"
              className={`text-xs font-semibold uppercase tracking-wider transition-colors ${currentPage === 'hridhay-special' ? 'text-[#5B2A86] font-bold' : 'text-[#1B1720] hover:text-[#7A49A5]'}`}
            >
              Hridhay Special
            </a>
            <a
              href="#contact"
              className={`text-xs font-semibold uppercase tracking-wider transition-colors ${currentPage === 'contact' ? 'text-[#5B2A86] font-bold' : 'text-[#1B1720] hover:text-[#7A49A5]'}`}
            >
              Contact
            </a>
          </div>

          {/* ── RIGHT: Actions ── */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">

            {/* Wishlist Button */}
            <motion.a
              href="#wishlist"
              onClick={(e) => {
                if (!isLoggedIn) {
                  e.preventDefault();
                  openSignUp('signin');
                } else {
                  setIsOpen(false);
                }
              }}
              className="relative flex items-center justify-center w-10 h-10 rounded-full text-[#1B1720] cursor-pointer z-10 transition-colors hover:bg-[#5B2A86]/6"
              aria-label="Wishlist"
              whileTap={{ scale: 0.92 }}
              transition={{ duration: 0.15 }}
            >
              <Heart className="w-[19px] h-[19px] stroke-[1.6]" />
              <AnimatePresence>
                {wishlistItems.length > 0 && (
                  <motion.span
                    key={wishlistItems.length}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="absolute top-[7px] right-[7px] min-w-[15px] h-[15px] bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-[3px] leading-none shadow-[0_2px_8px_rgba(239,68,68,0.45)]"
                  >
                    {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.a>

            {/* Cart Button */}
            <motion.button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center w-10 h-10 rounded-full text-[#1B1720] cursor-pointer z-10 transition-colors hover:bg-[#5B2A86]/6"
              aria-label="Shopping Cart"
              whileTap={{ scale: 0.92 }}
              transition={{ duration: 0.15 }}
            >
              <ShoppingBag className="w-[19px] h-[19px] stroke-[1.6]" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="absolute top-[7px] right-[7px] min-w-[15px] h-[15px] bg-[#5B2A86] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-[3px] leading-none shadow-[0_2px_8px_rgba(91,42,134,0.45)]"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Desktop Sign Up CTA or Profile Dropdown */}
            {isLoggedIn ? (
              <div className="flex items-center gap-1 md:gap-3">
                {/* Mobile Profile Icon */}
                <motion.a
                  href="#profile"
                  onClick={() => {
                    setIsOpen(false);
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                  }}
                  className="md:hidden relative flex items-center justify-center w-10 h-10 rounded-full text-[#1B1720] cursor-pointer z-10 transition-colors hover:bg-[#5B2A86]/6"
                  aria-label="User Profile"
                  whileTap={{ scale: 0.92 }}
                  transition={{ duration: 0.15 }}
                >
                  <User className="w-[19px] h-[19px] stroke-[1.6]" />
                </motion.a>

                {/* Notification Bell */}
                <div
                  className="relative hidden md:block"
                  onMouseEnter={() => { setIsNotificationOpen(true); setIsProfileOpen(false); }}
                  onMouseLeave={() => setIsNotificationOpen(false)}
                >
                  <motion.button
                    className="relative flex items-center justify-center w-10 h-10 rounded-full text-[#1B1720] cursor-pointer z-10 transition-colors hover:bg-[#5B2A86]/6"
                    aria-label="Notifications"
                    whileTap={{ scale: 0.92 }}
                  >
                    <Bell className="w-[19px] h-[19px] stroke-[1.6]" />
                    <AnimatePresence>
                      {unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-[7px] right-[7px] min-w-[15px] h-[15px] bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-[3px] leading-none shadow-[0_2px_8px_rgba(239,68,68,0.45)]"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <AnimatePresence>
                    {isNotificationOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-full mt-2 w-[380px] bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_20px_50px_rgba(91,42,134,0.12)] overflow-hidden z-50 flex flex-col max-h-[450px]"
                      >
                        <div className="px-5 py-4 border-b border-[#5B2A86]/10 flex items-center justify-between bg-neutral-50/50">
                          <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#5B2A86]">Notifications</p>
                          {unreadCount > 0 && (
                            <button onClick={handleReadAll} className="flex items-center gap-1.5 text-[10px] text-[#5B2A86] font-semibold hover:text-[#7A49A5] transition-colors bg-[#5B2A86]/5 hover:bg-[#5B2A86]/10 px-2 py-1 rounded-lg">
                              <Check className="w-3 h-3" /> Mark all read
                            </button>
                          )}
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                          {notifications.length === 0 ? (
                            <div className="px-6 py-10 flex flex-col items-center justify-center text-center">
                              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                                <Bell className="w-5 h-5 text-neutral-400" />
                              </div>
                              <p className="text-sm font-semibold text-neutral-700">All caught up!</p>
                              <p className="text-xs text-neutral-400 mt-1 font-satoshi">You have no new notifications.</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {notifications.map((notif: any) => (
                                <div
                                  key={notif.Id}
                                  className={`relative p-4 rounded-xl transition-all duration-200 cursor-pointer border border-transparent ${notif.IsRead ? 'hover:bg-neutral-50' : 'bg-[#5B2A86]/[0.03] hover:bg-[#5B2A86]/[0.06] border-[#5B2A86]/10'} flex flex-col gap-2 group`}
                                  onClick={() => !notif.IsRead && handleReadNotification(notif.Id)}
                                >
                                  <div className="flex items-start gap-3">
                                    {!notif.IsRead && <div className="w-2 h-2 rounded-full bg-[#5B2A86] mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(91,42,134,0.4)]"></div>}
                                    <div className="flex-1 min-w-0 pr-6">
                                      <p className={`text-sm leading-snug ${notif.IsRead ? 'text-neutral-600 font-medium' : 'text-neutral-900 font-semibold'} font-satoshi`}>{notif.Message}</p>
                                      <p className="text-[10px] text-neutral-400 mt-1.5 uppercase tracking-wider font-semibold">
                                        {new Date(notif.CreatedDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => handleDeleteNotification(notif.Id, e)}
                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 bg-white shadow-sm border border-neutral-100 text-neutral-400 hover:text-red-500 hover:border-red-100 rounded-lg transition-all z-10"
                                    title="Delete notification"
                                    aria-label="Delete notification"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="p-2 border-t border-[#5B2A86]/10 bg-neutral-50/50">
                          <button
                            onClick={() => { setIsNotificationOpen(false); window.location.hash = 'notifications'; window.dispatchEvent(new HashChangeEvent('hashchange')); }}
                            className="w-full py-2.5 text-xs text-center text-[#5B2A86] font-bold uppercase tracking-wider hover:bg-[#5B2A86]/5 rounded-xl transition-colors"
                          >
                            View all notifications
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div
                  className="relative hidden md:block"
                  onMouseEnter={() => { setIsProfileOpen(true); setIsNotificationOpen(false); }}
                  onMouseLeave={() => setIsProfileOpen(false)}
                >
                  <motion.button
                    className="relative flex items-center justify-center w-10 h-10 rounded-full text-[#1B1720] cursor-pointer z-10 transition-colors hover:bg-[#5B2A86]/6"
                    aria-label="User Profile"
                    whileTap={{ scale: 0.92 }}
                  >
                    <User className="w-[19px] h-[19px] stroke-[1.6]" />
                  </motion.button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_20px_50px_rgba(91,42,134,0.12)] overflow-hidden z-50 py-2"
                      >
                        <div className="px-4 py-3 border-b border-[#5B2A86]/10 mb-2">
                          <p className="text-[10px] uppercase tracking-widest font-semibold text-[#5B2A86]">My Account</p>
                        </div>

                        {/* Placeholders for future pages */}
                        <button onClick={() => { setIsProfileOpen(false); window.location.hash = 'profile'; window.dispatchEvent(new HashChangeEvent('hashchange')); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[#1B1720]/80 hover:bg-[#5B2A86]/5 hover:text-[#5B2A86] transition-colors font-medium">
                          <User className="w-3.5 h-3.5" />
                          <span>Profile Details</span>
                        </button>
                        <button onClick={() => { setIsProfileOpen(false); window.location.hash = 'orders'; window.dispatchEvent(new HashChangeEvent('hashchange')); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[#1B1720]/80 hover:bg-[#5B2A86]/5 hover:text-[#5B2A86] transition-colors font-medium">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Order History</span>
                        </button>
                        <button onClick={() => { setIsProfileOpen(false); window.location.hash = 'addresses'; window.dispatchEvent(new HashChangeEvent('hashchange')); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[#1B1720]/80 hover:bg-[#5B2A86]/5 hover:text-[#5B2A86] transition-colors font-medium">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Addresses</span>
                        </button>
                        <button onClick={() => { setIsProfileOpen(false); window.location.hash = 'rewards'; window.dispatchEvent(new HashChangeEvent('hashchange')); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[#1B1720]/80 hover:bg-[#5B2A86]/5 hover:text-[#5B2A86] transition-colors font-medium">
                          <Gift className="w-3.5 h-3.5" />
                          <span>Rewards</span>
                        </button>
                        <button onClick={() => { setIsProfileOpen(false); window.location.hash = 'password'; window.dispatchEvent(new HashChangeEvent('hashchange')); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[#1B1720]/80 hover:bg-[#5B2A86]/5 hover:text-[#5B2A86] transition-colors font-medium">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Change Password</span>
                        </button>

                        <div className="h-[1px] w-full bg-[#5B2A86]/10 my-2"></div>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <StarButton
                onClick={() => openSignUp('signin')}
                style={{
                  paddingLeft: "1.375rem",
                  paddingRight: "1.375rem",
                  paddingTop: "0.55rem",
                  paddingBottom: "0.55rem",
                  fontSize: "0.625rem",
                  letterSpacing: "0.18em",
                  display: typeof window !== 'undefined' && window.innerWidth < 768 ? 'none' : undefined,
                }}
                className="!hidden md:!inline-flex"
              >
                Login
              </StarButton>
            )}

            {/* Mobile Hamburger */}
            <motion.button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden relative flex flex-col items-center justify-center w-10 h-10 rounded-full cursor-pointer z-10 transition-colors hover:bg-[#5B2A86]/6 flex-shrink-0"
              aria-label="Open Menu"
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.15 }}
            >
              <span className="flex flex-col gap-[5px] w-[18px]">
                <span className="block h-[1.5px] w-full bg-[#1B1720] rounded-full transition-all duration-300" />
                <span className="block h-[1.5px] w-[13px] self-end bg-[#1B1720] rounded-full transition-all duration-300" />
              </span>
            </motion.button>

          </div>
        </nav>
      </header>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[60] md:hidden"
              style={{ background: 'rgba(27,23,32,0.52)', backdropFilter: 'blur(6px)' }}
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 240, mass: 0.8 }}
              className="fixed top-0 right-0 bottom-0 z-[70] md:hidden flex flex-col overflow-hidden"
              style={{
                width: "min(340px, 88vw)",
                background: "linear-gradient(160deg, rgba(247,243,250,0.97) 0%, rgba(232,220,245,0.95) 100%)",
                backdropFilter: "blur(28px) saturate(1.6)",
                borderLeft: "1px solid rgba(166,120,214,0.18)",
                boxShadow: "-12px 0 48px rgba(91,42,134,0.12)",
              }}
            >
              {/* Decorative ambient glow */}
              <div
                className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(166,120,214,0.2) 0%, transparent 70%)",
                  transform: "translate(30%, -30%)",
                }}
              />
              <div
                className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(91,42,134,0.08) 0%, transparent 70%)",
                  transform: "translate(-30%, 30%)",
                }}
              />

              {/* Drawer Header */}
              <div className="relative flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#5B2A86]/8">
                <a href="#" onClick={() => setMobileMenuOpen(false)} className="cursor-pointer">
                  <img
                    src="/logo.webp"
                    alt="Hridhay Connect"
                    className="h-9 w-auto object-contain"
                  />
                </a>

                {/* Close Button */}
                <motion.button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center w-9 h-9 rounded-full cursor-pointer transition-colors"
                  style={{
                    background: "rgba(91,42,134,0.07)",
                    border: "1px solid rgba(91,42,134,0.12)",
                  }}
                  aria-label="Close Menu"
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ background: "rgba(91,42,134,0.12)" }}
                >
                  {/* Custom X icon — two thin lines */}
                  <span className="relative w-[14px] h-[14px] flex items-center justify-center">
                    <span
                      className="absolute w-full h-[1.5px] rounded-full bg-[#5B2A86]"
                      style={{ transform: "rotate(45deg)" }}
                    />
                    <span
                      className="absolute w-full h-[1.5px] rounded-full bg-[#5B2A86]"
                      style={{ transform: "rotate(-45deg)" }}
                    />
                  </span>
                </motion.button>
              </div>

              {/* Drawer Nav Items */}
              <div className="relative flex-1 overflow-y-auto px-6 py-6 space-y-1">

                {/* Nav Links */}
                {/* Nav Links Part 1: Home & About */}
                {[
                  { label: "Home", href: "#", page: "home" },
                  { label: "About", href: "#about", page: "about" },
                ].map((link, i) => (
                  <motion.a
                    key={link.page}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between w-full py-3.5 px-1 border-b border-[#5B2A86]/6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{ textDecoration: "none" }}
                    whileTap={{ x: 4 }}
                  >
                    <span
                      className={`font-serif text-base tracking-wide ${currentPage === link.page
                        ? "text-[#5B2A86] font-semibold"
                        : "text-[#1B1720] font-medium"
                        }`}
                    >
                      {link.label}
                    </span>
                    {currentPage === link.page && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5B2A86] flex-shrink-0" />
                    )}
                  </motion.a>
                ))}

                {/* Shop By Category Accordion */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.14, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="border-b border-[#5B2A86]/6"
                >
                  <button
                    onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
                    className="flex items-center justify-between w-full py-3.5 px-1 cursor-pointer"
                  >
                    <span className="font-serif text-base tracking-wide text-[#1B1720] font-medium">
                      Shop By Category
                    </span>
                    <motion.span
                      animate={{ rotate: mobileCategoryOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <ChevronDown className="w-4 h-4 text-[#5B2A86]" />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {mobileCategoryOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pb-4 space-y-4 pl-2">
                          {categories.map((category, index) => (
                            <div key={index} className="space-y-1.5">
                              <span className="block text-[10px] uppercase tracking-[0.18em] text-[#7A49A5] font-semibold pt-2">
                                {category.title}
                              </span>
                              {category.items.map((item, itemIdx) => (
                                <a
                                  key={itemIdx}
                                  href={item.path}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="flex items-center gap-2.5 py-2 px-2.5 rounded-xl transition-all duration-200 hover:bg-[#5B2A86]/6 group"
                                  style={{ textDecoration: "none" }}
                                >
                                  <span className="text-sm leading-none">{item.icon}</span>
                                  <span className="text-sm text-[#1B1720]/80 font-satoshi font-light group-hover:text-[#5B2A86] transition-colors">
                                    {item.name}
                                  </span>
                                </a>
                              ))}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Nav Links Part 2: Hridhay Special & Contact */}
                {[
                  { label: "Hridhay Special", href: "#hridhay-special", page: "hridhay-special" },
                  { label: "Contact", href: "#contact", page: "contact" },
                ].map((link, i) => (
                  <motion.a
                    key={link.page}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between w-full py-3.5 px-1 border-b border-[#5B2A86]/6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{ textDecoration: "none" }}
                    whileTap={{ x: 4 }}
                  >
                    <span
                      className={`font-serif text-base tracking-wide ${currentPage === link.page
                        ? "text-[#5B2A86] font-semibold"
                        : "text-[#1B1720] font-medium"
                        }`}
                    >
                      {link.label}
                    </span>
                    {currentPage === link.page && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5B2A86] flex-shrink-0" />
                    )}
                  </motion.a>
                ))}

                {/* My Profile Accordion (Mobile) */}
                {isLoggedIn && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.28, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-[#5B2A86]/6"
                  >
                    <button
                      onClick={() => setMobileProfileOpen(!mobileProfileOpen)}
                      className="flex items-center justify-between w-full py-3.5 px-1 cursor-pointer text-left"
                    >
                      <span className="font-serif text-base tracking-wide text-[#1B1720] font-medium flex items-center gap-2">
                        <User className="w-[18px] h-[18px] text-[#5B2A86]" />
                        My Profile
                      </span>
                      <motion.span
                        animate={{ rotate: mobileProfileOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <ChevronDown className="w-4 h-4 text-[#5B2A86]" />
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {mobileProfileOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pb-4 space-y-1 pl-4 pt-1">
                            {[
                              { label: "Profile Details", hash: "profile", icon: User },
                              { label: "Order History", hash: "orders", icon: ShoppingBag },
                              { label: "Addresses", hash: "addresses", icon: MapPin },
                              { label: "Rewards", hash: "rewards", icon: Gift },
                              { label: "Notifications", hash: "notifications", icon: Bell },
                              { label: "Change Password", hash: "password", icon: Shield },
                            ].map((subItem, subIdx) => {
                              const SubIcon = subItem.icon;
                              return (
                                <button
                                  key={subIdx}
                                  onClick={() => {
                                    setMobileMenuOpen(false);
                                    window.location.hash = subItem.hash;
                                    window.dispatchEvent(new HashChangeEvent("hashchange"));
                                  }}
                                  className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl transition-all duration-200 hover:bg-[#5B2A86]/6 text-[#1B1720]/80 hover:text-[#5B2A86] text-xs font-semibold text-left"
                                >
                                  <SubIcon className="w-4 h-4 opacity-70" />
                                  <span>{subItem.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Sign Up / Login or Logout */}
                {isLoggedIn ? (
                  <motion.button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center justify-between w-full py-3.5 px-1 cursor-pointer border-b border-[#5B2A86]/6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.30, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    whileTap={{ x: 4 }}
                  >
                    <span className="font-serif text-base tracking-wide text-red-600 font-semibold">
                      Logout
                    </span>
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 bg-red-100 text-red-600 shadow"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </span>
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openSignUp('signin');
                    }}
                    className="flex items-center justify-between w-full py-3.5 px-1 cursor-pointer border-b border-[#5B2A86]/6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.30, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    whileTap={{ x: 4 }}
                  >
                    <span className="font-serif text-base tracking-wide text-[#5B2A86] font-semibold">
                      Login
                    </span>
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #5B2A86, #A678D6)",
                        boxShadow: "0 2px 10px rgba(91,42,134,0.3)",
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                  </motion.button>
                )}
              </div>

              {/* Drawer CTA Footer */}
              {!isLoggedIn && (
                <motion.div
                  className="relative px-6 py-5 border-t border-[#5B2A86]/8"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openSignUp('signin');
                    }}
                    className="relative w-full flex items-center justify-center overflow-hidden rounded-2xl cursor-pointer"
                    style={{
                      height: "52px",
                      background: "linear-gradient(135deg, #5B2A86 0%, #7A49A5 55%, #A678D6 100%)",
                      border: "1px solid rgba(166,120,214,0.3)",
                      boxShadow: "0 8px 28px rgba(91,42,134,0.32), inset 0 1px 0 rgba(255,255,255,0.12)",
                      color: "#fff",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {/* Shimmer sweep */}
                    <span
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.1) 50%, transparent 65%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmerPill 3.5s ease-in-out infinite",
                      }}
                    />
                    <span className="relative z-10">Create Account — It's Free</span>
                  </button>

                  <p className="text-center text-[10px] text-[#1B1720]/35 mt-3 font-satoshi font-light tracking-wide">
                    Join 2,400+ wellness seekers
                  </p>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global shimmer keyframe */}
      <style>{`
        @keyframes shimmerPill {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </>
  );
}
