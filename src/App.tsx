import { useState, useEffect, lazy, Suspense } from "react";
import { Navigation } from "./components/Navigation";
import { HeroSection } from "./components/HeroSection";
import { Marquee } from "./components/Marquee";
import { MiniCartDrawer } from "./components/MiniCartDrawer";
import { LoadingScreen } from "./components/LoadingScreen";
import { SignUpModal } from "./components/SignUpModal";

// Lazy Loaded Components
const CategoryCarousel = lazy(() => import("./components/CategoryCarousel").then(m => ({ default: m.CategoryCarousel })));
const TopCategories = lazy(() => import("./components/DynamicHomeSections").then(m => ({ default: m.TopCategories })));
const TrendingProducts = lazy(() => import("./components/DynamicHomeSections").then(m => ({ default: m.TrendingProducts })));
const NewArrivals = lazy(() => import("./components/DynamicHomeSections").then(m => ({ default: m.NewArrivals })));
const FeaturedProducts = lazy(() => import("./components/DynamicHomeSections").then(m => ({ default: m.FeaturedProducts })));
const BestSellers = lazy(() => import("./components/DynamicHomeSections").then(m => ({ default: m.BestSellers })));
const OnSaleProducts = lazy(() => import("./components/DynamicHomeSections").then(m => ({ default: m.OnSaleProducts })));
const BrandStory = lazy(() => import("./components/BrandStory").then(m => ({ default: m.BrandStory })));
const BrandStatistics = lazy(() => import("./components/BrandStatistics").then(m => ({ default: m.BrandStatistics })));
const Ingredients = lazy(() => import("./components/Ingredients").then(m => ({ default: m.Ingredients })));
const FeaturedCollection = lazy(() => import("./components/FeaturedCollection").then(m => ({ default: m.FeaturedCollection })));
const WellnessExperience = lazy(() => import("./components/WellnessExperience").then(m => ({ default: m.WellnessExperience })));
const InteractiveScroll = lazy(() => import("./components/InteractiveScroll").then(m => ({ default: m.InteractiveScroll })));
const Testimonials = lazy(() => import("./components/Testimonials").then(m => ({ default: m.Testimonials })));
const TrustBadges = lazy(() => import("./components/TrustBadges").then(m => ({ default: m.TrustBadges })));
const Footer = lazy(() => import("./components/Footer").then(m => ({ default: m.Footer })));
const InstagramSection = lazy(() => import("./components/InstagramSection").then(m => ({ default: m.InstagramSection })));
const HomepageImageShowcase = lazy(() => import("./components/HomepageImageShowcase").then(m => ({ default: m.HomepageImageShowcase })));

// Lazy Loaded Pages
const AboutPage = lazy(() => import("./components/AboutPage").then(m => ({ default: m.AboutPage })));
const SoapCategoryPage = lazy(() => import("./components/SoapCategoryPage").then(m => ({ default: m.SoapCategoryPage })));
const HairOilCategoryPage = lazy(() => import("./components/HairOilCategoryPage").then(m => ({ default: m.HairOilCategoryPage })));
const MukhwasCategoryPage = lazy(() => import("./components/MukhwasCategoryPage").then(m => ({ default: m.MukhwasCategoryPage })));
const TeaMasalaCategoryPage = lazy(() => import("./components/TeaMasalaCategoryPage").then(m => ({ default: m.TeaMasalaCategoryPage })));
const HridhaySpecialCategoryPage = lazy(() => import("./components/HridhaySpecialCategoryPage").then(m => ({ default: m.HridhaySpecialCategoryPage })));
const ProductPage = lazy(() => import("./components/ProductPage").then(m => ({ default: m.ProductPage })));
const CartPage = lazy(() => import("./components/CartPage").then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import("./components/CheckoutPage").then(m => ({ default: m.CheckoutPage })));
const ProfilePage = lazy(() => import("./components/ProfilePage").then(m => ({ default: m.ProfilePage })));
const WishlistPage = lazy(() => import("./components/WishlistPage").then(m => ({ default: m.WishlistPage })));
const ContactPage = lazy(() => import("./components/ContactPage").then(m => ({ default: m.ContactPage })));
import { useSignUp } from "./context/SignUpContext";
import { products } from "./data/products";
import { FloatingWhatsApp } from "./components/FloatingWhatsApp";
import { GlobalToastProvider } from "./components/GlobalToastProvider";

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'about' | 'soap' | 'hair-oil' | 'mukhwas' | 'tea-masala' | 'hridhay-special' | 'product' | 'cart' | 'checkout' | 'profile' | 'wishlist' | 'contact'>('home');
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [showLoader, setShowLoader] = useState(true);
  const { isSignUpOpen, closeSignUp } = useSignUp();
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    // Eagerly prefetch critical homepage data (GetHomeComponent and Category products) immediately on mount
    const prefetchCriticalData = async () => {
      try {
        const { fetchHomepageSectionsFromApi, fetchProductsFromApi } = await import("./api/productService");
        
        // Fetch homepage sections and carousel products in parallel
        await Promise.all([
          fetchHomepageSectionsFromApi().catch(() => []),
          fetchProductsFromApi(0).catch(() => [])
        ]);
        
        setIsDataLoaded(true);
      } catch (err) {
        console.error("Failed to prefetch critical homepage data", err);
        setIsDataLoaded(true); // Proceed anyway on failure to avoid blocking the app
      }
    };
    prefetchCriticalData();
  }, []);

  useEffect(() => {
    // Pre-fetch category products in the background to populate the images cache for the homepage
    const prefetchCategories = async () => {
      try {
        const { fetchProductsFromApi } = await import("./api/productService");
        const { syncProducts } = await import("./data/products");

        // Load in background
        const categories = [15, 16, 17, 18, 0];
        for (const catId of categories) {
          fetchProductsFromApi(catId).then(fetched => {
            if (fetched && fetched.length > 0) {
              syncProducts(fetched);
            }
          }).catch(() => { });
        }
      } catch (err) {
        console.error("Failed to prefetch categories", err);
      }
    };

    // Delay slightly to prioritize critical page load
    const timer = setTimeout(prefetchCategories, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;

      if (hash.startsWith("#product-")) {
        const prodId = hash.replace("#product-", "");
        setSelectedProductId(prodId);
        setCurrentPage(prev => {
          if (prev !== 'product') window.scrollTo({ top: 0, behavior: "smooth" });
          return 'product';
        });
      } else if (hash.startsWith("#about") || hash.startsWith("#/about") || hash === "#story") {
        setCurrentPage(prev => {
          if (prev !== 'about') window.scrollTo({ top: 0, behavior: "smooth" });
          return 'about';
        });
      } else if (hash.startsWith("#soap") || hash.startsWith("#/soap")) {
        setCurrentPage(prev => {
          if (prev !== 'soap') window.scrollTo({ top: 0, behavior: "smooth" });
          return 'soap';
        });
      } else if (hash.startsWith("#hair-oil") || hash.startsWith("#/hair-oil")) {
        setCurrentPage(prev => {
          if (prev !== 'hair-oil') window.scrollTo({ top: 0, behavior: "smooth" });
          return 'hair-oil';
        });
      } else if (hash.startsWith("#mukhwas") || hash.startsWith("#/mukhwas")) {
        setCurrentPage(prev => {
          if (prev !== 'mukhwas') window.scrollTo({ top: 0, behavior: "smooth" });
          return 'mukhwas';
        });
      } else if (hash.startsWith("#tea-masala") || hash.startsWith("#/tea-masala")) {
        setCurrentPage(prev => {
          if (prev !== 'tea-masala') window.scrollTo({ top: 0, behavior: "smooth" });
          return 'tea-masala';
        });
      } else if (hash.startsWith("#hridhay-special") || hash.startsWith("#/hridhay-special")) {
        setCurrentPage(prev => {
          if (prev !== 'hridhay-special') window.scrollTo({ top: 0, behavior: "smooth" });
          return 'hridhay-special';
        });
      } else if (hash.startsWith("#cart") || hash.startsWith("#/cart")) {
        setCurrentPage(prev => {
          if (prev !== 'cart') window.scrollTo({ top: 0, behavior: "smooth" });
          return 'cart';
        });
      } else if (hash.startsWith("#checkout") || hash.startsWith("#/checkout")) {
        setCurrentPage(prev => {
          if (prev !== 'checkout') window.scrollTo({ top: 0, behavior: "smooth" });
          return 'checkout';
        });
      } else if (hash.startsWith("#profile") || hash.startsWith("#/profile") || hash === "#orders" || hash === "#addresses" || hash === "#rewards" || hash === "#notifications" || hash === "#password") {
        setCurrentPage(prev => {
          if (prev !== 'profile') window.scrollTo({ top: 0, behavior: "smooth" });
          return 'profile';
        });
      } else if (hash.startsWith("#wishlist") || hash.startsWith("#/wishlist")) {
        setCurrentPage(prev => {
          if (prev !== 'wishlist') window.scrollTo({ top: 0, behavior: "smooth" });
          return 'wishlist';
        });
      } else if (hash.startsWith("#contact") || hash.startsWith("#/contact")) {
        setCurrentPage(prev => {
          if (prev !== 'contact') window.scrollTo({ top: 0, behavior: "smooth" });
          return 'contact';
        });
      } else if (!hash || hash === "#" || hash === "#home") {
        // Fallback to pathname checking when no hash routing is requested
        if (path === "/about") {
          setCurrentPage(prev => {
            if (prev !== 'about') window.scrollTo({ top: 0, behavior: "smooth" });
            return 'about';
          });
        } else if (path === "/soap" || path === "/home-made-soap") {
          setCurrentPage(prev => {
            if (prev !== 'soap') window.scrollTo({ top: 0, behavior: "smooth" });
            return 'soap';
          });
        } else if (path === "/hair-oil" || path === "/homemade-hair-oil") {
          setCurrentPage(prev => {
            if (prev !== 'hair-oil') window.scrollTo({ top: 0, behavior: "smooth" });
            return 'hair-oil';
          });
        } else if (path === "/mukhwas" || path === "/homemade-mukhwas") {
          setCurrentPage(prev => {
            if (prev !== 'mukhwas') window.scrollTo({ top: 0, behavior: "smooth" });
            return 'mukhwas';
          });
        } else if (path === "/tea-masala" || path === "/homemade-tea-masala") {
          setCurrentPage(prev => {
            if (prev !== 'tea-masala') window.scrollTo({ top: 0, behavior: "smooth" });
            return 'tea-masala';
          });
        } else if (path === "/hridhay-special" || path === "/homemade-hridhay-special") {
          setCurrentPage(prev => {
            if (prev !== 'hridhay-special') window.scrollTo({ top: 0, behavior: "smooth" });
            return 'hridhay-special';
          });
        } else if (path === "/cart") {
          setCurrentPage(prev => {
            if (prev !== 'cart') window.scrollTo({ top: 0, behavior: "smooth" });
            return 'cart';
          });
        } else if (path === "/checkout" || path === "/order-checkout") {
          setCurrentPage(prev => {
            if (prev !== 'checkout') window.scrollTo({ top: 0, behavior: "smooth" });
            return 'checkout';
          });
        } else if (path === "/profile" || path === "/orders" || path === "/addresses" || path === "/rewards") {
          setCurrentPage(prev => {
            if (prev !== 'profile') window.scrollTo({ top: 0, behavior: "smooth" });
            return 'profile';
          });
        } else if (path === "/wishlist") {
          setCurrentPage(prev => {
            if (prev !== 'wishlist') window.scrollTo({ top: 0, behavior: "smooth" });
            return 'wishlist';
          });
        } else if (path === "/contact") {
          setCurrentPage(prev => {
            if (prev !== 'contact') window.scrollTo({ top: 0, behavior: "smooth" });
            return 'contact';
          });
        } else if (path.startsWith("/product/")) {
          const prodId = path.replace("/product/", "");
          setSelectedProductId(prodId);
          setCurrentPage(prev => {
            if (prev !== 'product') window.scrollTo({ top: 0, behavior: "smooth" });
            return 'product';
          });
        } else {
          setCurrentPage(prev => {
            if (prev !== 'home') window.scrollTo({ top: 0, behavior: "smooth" });
            return 'home';
          });
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[var(--color-cream)] text-[var(--color-dark-text)] overflow-hidden font-sans selection:bg-[var(--color-secondary)] selection:text-white">
      {/* Cinematic Loading Screen */}
      <LoadingScreen isDataLoaded={isDataLoaded} onComplete={() => setShowLoader(false)} />

      {/* Noise overlay */}
      <div className="fixed inset-0 noise-overlay z-50 mix-blend-overlay pointer-events-none"></div>

      {/* Cinematic Ambient Background (Hero area) */}
      <div className="absolute top-0 inset-x-0 h-screen z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-[var(--color-primary)]/10 blur-[120px] mix-blend-multiply opacity-60"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[var(--color-accent)]/15 blur-[100px] mix-blend-multiply opacity-50"></div>
      </div>

      <Navigation currentPage={currentPage} />

      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)]"><div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div></div>}>
        {currentPage === 'home' ? (
          <>
            <HeroSection />
            <Marquee />
            <CategoryCarousel />
            <TopCategories />
            <BrandStory />
            <TrendingProducts />
            <NewArrivals />
            <BrandStatistics />
            <FeaturedProducts />
            <BestSellers />
            <OnSaleProducts />

            <Ingredients />
            {/* <FeaturedCollection /> */}
            <InteractiveScroll />
            <WellnessExperience />
            <Testimonials />
            <TrustBadges />
            <HomepageImageShowcase />
            <InstagramSection />
          </>
        ) : currentPage === 'about' ? (
          <AboutPage />
        ) : currentPage === 'contact' ? (
          <ContactPage />
        ) : currentPage === 'soap' ? (
          <SoapCategoryPage />
        ) : currentPage === 'hair-oil' ? (
          <HairOilCategoryPage />
        ) : currentPage === 'mukhwas' ? (
          <MukhwasCategoryPage />
        ) : currentPage === 'tea-masala' ? (
          <TeaMasalaCategoryPage />
        ) : currentPage === 'hridhay-special' ? (
          <HridhaySpecialCategoryPage />
        ) : currentPage === 'product' ? (
          <ProductPage productId={selectedProductId} onBack={() => {
            const prod = products.find(p => p.id === selectedProductId);
            if (prod) {
              window.location.hash = `#${prod.category}`;
            } else {
              window.location.hash = "#home";
            }
          }} />
        ) : currentPage === 'cart' ? (
          <CartPage />
        ) : currentPage === 'checkout' ? (
          <CheckoutPage />
        ) : currentPage === 'profile' ? (
          <ProfilePage />
        ) : currentPage === 'wishlist' ? (
          <WishlistPage />
        ) : null}

        <Footer />
      </Suspense>

      <MiniCartDrawer />

      {/* Premium Sign Up Modal */}
      <SignUpModal isOpen={isSignUpOpen} onClose={closeSignUp} initialMode={useSignUp().initialMode} />

      <FloatingWhatsApp />
      <GlobalToastProvider />
    </div>
  );
}
