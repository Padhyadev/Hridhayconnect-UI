import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import {
  ArrowLeft, Heart, Star, Sparkles, Plus, Minus,
  ChevronDown, Check, Share2, ShoppingBag, ShieldCheck,
  RotateCcw, Truck, Maximize2, Sparkle, Award, Eye
} from "lucide-react";
import { products, Product, syncProducts } from "../data/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { fetchProductsFromApi } from "../api/productService";
import { ProductReviews } from "./ProductReviews";
import { reviewService } from "../api/reviewService";

interface ProductPageProps {
  productId: string;
  onBack?: () => void;
}

export function ProductPage({ productId, onBack }: ProductPageProps) {
  // Helper to parse target product ID/slug, variant ID, and packaging from props
  const parsePropsId = (rawId: string) => {
    const parts = rawId.split("-");

    let targetPacking: string | null = null;
    let targetVariantId: number | null = null;
    let targetProductId = rawId;

    let partsToProcess = [...parts];

    // Check if the last part is "Pouch" or "Bottle" (case-insensitive)
    if (partsToProcess.length > 0) {
      const last = partsToProcess[partsToProcess.length - 1].trim();
      if (last.toLowerCase() === "pouch" || last.toLowerCase() === "bottle") {
        targetPacking = last.charAt(0).toUpperCase() + last.slice(1).toLowerCase(); // Normalize case to "Pouch" or "Bottle"
        partsToProcess.pop(); // remove it
      }
    }

    // Now look at the new last part to see if it is a numeric variant ID
    if (partsToProcess.length > 0) {
      const last = partsToProcess[partsToProcess.length - 1];
      const lastNum = Number(last);
      if (!isNaN(lastNum)) {
        // Double check if there is an exact string match for the whole remaining parts
        const remainingId = partsToProcess.join("-");
        const fullMatch = products.find(p => p.id === remainingId);
        if (!fullMatch) {
          targetVariantId = lastNum;
          partsToProcess.pop(); // remove it
        }
      }
    }

    targetProductId = partsToProcess.join("-");

    return { targetProductId, targetVariantId, targetPacking };
  };

  const { targetProductId, targetVariantId, targetPacking } = parsePropsId(productId);

  const findProduct = (id: string) => {
    const numeric = Number(id);
    return products.find(p => p.id === id || (p.productId && p.productId === numeric));
  };

  const [currentProduct, setCurrentProduct] = useState<Product>(() => {
    const { targetProductId } = parsePropsId(productId);
    return findProduct(targetProductId) || products[0];
  });

  const [packaging, setPackaging] = useState(() => {
    const { targetPacking } = parsePropsId(productId);
    return targetPacking || "Pouch";
  });

  const { addToCart, prepareCheckout } = useCart();

  const [isPageLoading, setIsPageLoading] = useState(() => {
    const { targetProductId } = parsePropsId(productId);
    return !products.some(p => p.id === targetProductId || (p.productId && p.productId === Number(targetProductId)));
  });
  const [selectedVariant, setSelectedVariant] = useState<any>(() => {
    const { targetProductId, targetVariantId } = parsePropsId(productId);
    const prod = findProduct(targetProductId);
    if (prod && prod.variants && prod.variants.length > 0) {
      return prod.variants.find(v => Number(v.varientId) === targetVariantId) || prod.variants[0];
    }
    return null;
  });
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: "center center", display: "none" });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'benefits' | 'faq' | 'reviews'>('desc');
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [cartAdded, setCartAdded] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});

  const [reviewStats, setReviewStats] = useState<{ averageRating: number; totalReviews: number }>({ averageRating: 0, totalReviews: 0 });

  const renderProductDescription = (desc: string) => {
    if (!desc) return null;
    const hasHtml = /<[a-z][\s\S]*>/i.test(desc);
    if (hasHtml) {
      return <div dangerouslySetInnerHTML={{ __html: desc }} />;
    }
    return <div className="whitespace-pre-line">{desc}</div>;
  };

  const fetchReviewStats = async () => {
    try {
      const numericId = Number(currentProduct.productId || currentProduct.id);
      if (isNaN(numericId) || numericId <= 0) return;
      const response = await reviewService.getAll({
        productId: numericId,
        search: "",
        start: 0,
        length: 1,
        sortColumnIndex: 7,
        sortDirection: "desc"
      });
      if (response && response.isSuccess) {
        const table1 = response.data?.table1 || [];
        const table2 = response.data?.table2 || [];
        const totalReviews = table1[0]?.FilteredRecords ?? table1[0]?.TotalRecords ?? 0;
        const averageRating = table2[0]?.AverageRating ?? 0;
        setReviewStats({
          averageRating: typeof averageRating === 'number' ? averageRating : Number(averageRating) || 0,
          totalReviews: typeof totalReviews === 'number' ? totalReviews : Number(totalReviews) || 0
        });
      }
    } catch (error) {
      console.error("Error fetching review stats:", error);
    }
  };

  useEffect(() => {
    fetchReviewStats();
  }, [currentProduct.productId, currentProduct.id]);

  // Helper to parse "Weight : 200, Packaging : Pouch" into { Weight: "200", Packaging: "Pouch" }
  const parseAttributes = (attrStr: any): Record<string, string> => {
    const result: Record<string, string> = {};
    if (!attrStr || typeof attrStr !== "string") return result;
    attrStr.split(",").forEach(part => {
      const colonIdx = part.indexOf(":");
      if (colonIdx !== -1) {
        const key = part.substring(0, colonIdx).trim();
        const value = part.substring(colonIdx + 1).trim();
        if (key && value) {
          result[key] = value;
        }
      }
    });
    return result;
  };

  // Sync selected attributes state whenever selectedVariant changes
  useEffect(() => {
    if (selectedVariant) {
      setSelectedAttrs(parseAttributes(selectedVariant.variantAttributes));
    }
  }, [selectedVariant]);

  useEffect(() => {
    const maxStock = selectedVariant?.totalAvailableStock ?? currentProduct.totalAvailableStock ?? Infinity;
    if (quantity > maxStock) {
      setQuantity(Math.max(1, maxStock));
    }
  }, [selectedVariant, currentProduct, quantity]);

  const handleAttrSelect = (name: string, value: string) => {
    const newAttrs = { ...selectedAttrs, [name]: value };
    setSelectedAttrs(newAttrs);

    // Find the variant that matches this new combination of attributes
    const matchingVariant = (currentProduct.variants || []).find(v => {
      const vAttrs = parseAttributes(v.variantAttributes);
      return Object.keys(newAttrs).every(k => vAttrs[k] === newAttrs[k]);
    });

    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
    } else {
      // Fallback: select a variant that matches the clicked value, and as many other attributes as possible
      const alternatives = (currentProduct.variants || []).filter(v => {
        const vAttrs = parseAttributes(v.variantAttributes);
        return vAttrs[name] === value;
      });

      if (alternatives.length > 0) {
        let bestMatch = alternatives[0];
        let maxOverlap = -1;

        alternatives.forEach(alt => {
          const altAttrs = parseAttributes(alt.variantAttributes);
          let overlap = 0;
          Object.keys(newAttrs).forEach(k => {
            if (k !== name && altAttrs[k] === newAttrs[k]) {
              overlap++;
            }
          });
          if (overlap > maxOverlap) {
            maxOverlap = overlap;
            bestMatch = alt;
          }
        });

        setSelectedVariant(bestMatch);
      }
    }
  };

  const heroSectionRef = useRef<HTMLDivElement>(null);

  // Scroll triggers for sticky bar
  useEffect(() => {
    const handleScroll = () => {
      if (heroSectionRef.current) {
        const heroBottom = heroSectionRef.current.getBoundingClientRect().bottom;
        setShowStickyBar(heroBottom < 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reset states and fetch latest details when product changes
  useEffect(() => {
    const { targetProductId, targetVariantId, targetPacking } = parsePropsId(productId);
    const local = findProduct(targetProductId);
    let isMounted = true;

    if (!local) {
      setIsPageLoading(true);
      async function fetchAndFind() {
        try {
          // Fetch all categories in parallel to locate this dynamic product
          const [soaps, oils, mukhwas, tea, specials] = await Promise.all([
            fetchProductsFromApi(15),
            fetchProductsFromApi(16),
            fetchProductsFromApi(17),
            fetchProductsFromApi(18),
            fetchProductsFromApi(19)
          ]);
          if (isMounted) {
            if (soaps.length > 0) syncProducts(soaps);
            if (oils.length > 0) syncProducts(oils);
            if (mukhwas.length > 0) syncProducts(mukhwas);
            if (tea.length > 0) syncProducts(tea);
            if (specials.length > 0) syncProducts(specials);
            const found = findProduct(targetProductId);
            if (found) {
              setCurrentProduct({ ...found });
              setSelectedVariant(found.variants && found.variants.length > 0 ? (found.variants.find(v => Number(v.varientId) === targetVariantId) || found.variants[0]) : null);
              if (targetPacking) {
                setPackaging(targetPacking);
              } else {
                setPackaging("Pouch");
              }
              document.title = `${found.name} | Hridhay Connect`;
              setIsPageLoading(false);
            } else {
              setCurrentProduct(products[0]);
              setIsPageLoading(false);
            }
          }
        } catch (error) {
          console.error("Failed to fetch and find dynamic product:", error);
          if (isMounted) {
            setCurrentProduct(products[0]);
            setIsPageLoading(false);
          }
        }
      }
      fetchAndFind();
    } else {
      setIsPageLoading(false);
      setCurrentProduct(local);
      setSelectedVariant(local.variants && local.variants.length > 0 ? (local.variants.find(v => Number(v.varientId) === targetVariantId) || local.variants[0]) : null);
      if (targetPacking) {
        setPackaging(targetPacking);
      } else {
        setPackaging("Pouch");
      }
      setActiveImageIdx(0);
      setQuantity(1);
      setActiveTab('desc');
      setOpenFaqIdx(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.title = `${local.name} | Hridhay Connect`;

      const categoryMap: Record<string, number> = {
        'soap': 15,
        'hair-oil': 16,
        'mukhwas': 17,
        'tea-masala': 18,
        'hridhay-special': 19
      };
      const catId = categoryMap[local.category];
      if (catId) {
        async function syncLatest() {
          try {
            const fetched = await fetchProductsFromApi(catId);
            if (fetched && fetched.length > 0 && isMounted) {
              syncProducts(fetched);
              const updated = findProduct(targetProductId) || products[0];
              setCurrentProduct({ ...updated });
              document.title = `${updated.name} | Hridhay Connect`;
              if (updated.variants && updated.variants.length > 0) {
                setSelectedVariant(prev => {
                  const targetMatch = updated.variants?.find(v => Number(v.varientId) === targetVariantId);
                  if (targetMatch) return targetMatch;
                  const stillExists = updated.variants?.find(v => v.varientId === prev?.varientId);
                  return stillExists || updated.variants?.[0] || null;
                });
              }
            }
          } catch (error) {
            console.error("Failed to sync latest product info:", error);
          }
        }
        syncLatest();
      }
    }

    return () => { isMounted = false; };
  }, [productId]);

  // Image Zoom on Hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      display: "block"
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle(prev => ({ ...prev, display: "none" }));
  };

  const handleVariantSelect = (variant: any) => {
    setSelectedVariant(variant);
  };

  const handleAddToCart = () => {
    const productToAdd = selectedVariant ? {
      ...currentProduct,
      price: selectedVariant.price,
      name: `${currentProduct.name} (${selectedVariant.variantAttributeValues_Only})`,
      variantId: selectedVariant.varientId
    } : currentProduct;

    addToCart(productToAdd, quantity, currentProduct.category === "mukhwas" ? packaging : undefined);
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
  };

  const handleBuyNow = () => {
    const productToAdd = selectedVariant ? {
      ...currentProduct,
      price: selectedVariant.price,
      name: `${currentProduct.name} (${selectedVariant.variantAttributeValues_Only})`,
      variantId: selectedVariant.varientId
    } : currentProduct;

    prepareCheckout([{
      product: productToAdd,
      quantity,
      packingType: currentProduct.category === "mukhwas" ? packaging : undefined
    }]);
    window.location.hash = "#checkout";
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };



  if (isPageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] bg-[var(--color-cream)] text-[var(--color-primary)]">
        <Sparkle className="w-12 h-12 animate-spin mb-4 text-[var(--color-primary)]" />
        <span className="text-sm uppercase tracking-[0.2em] font-medium font-general">Loading product details...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[var(--color-cream)] text-[var(--color-dark-text)] overflow-hidden font-sans pt-[90px]">

      {/* Cinematic Ambient Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] rounded-full bg-[var(--color-primary)]/5 blur-[120px]" />
        <div className="absolute top-[40%] right-[5%] w-[35vw] h-[35vw] rounded-full bg-[var(--color-accent)]/5 blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">

        {/* Navigation & Breadcrumbs */}
        <div className="flex justify-between items-center py-6 border-b border-[var(--color-primary)]/5 mb-10">
          <button
            onClick={onBack || (() => { window.location.hash = `#${currentProduct.category || ''}` })}
            className="group flex items-center gap-2 text-xs font-semibold uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Category</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--color-dark-text)]/40">
            <a href="#" className="hover:text-[var(--color-primary)] transition-colors">Home</a>
            <span>/</span>
            {currentProduct.category && (
              <>
                <a href={`#${currentProduct.category}`} className="hover:text-[var(--color-primary)] transition-colors capitalize">{currentProduct.category.replace("-", " ")}</a>
                <span>/</span>
              </>
            )}
            <span className="text-[var(--color-primary)] font-semibold">{currentProduct.name}</span>
          </div>
        </div>

        {/* 1. Cinematic Hero Section */}
        <div ref={heroSectionRef} className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-16 items-start mb-16 md:mb-24 w-full">

          {/* Left Column: Image Gallery */}
          <div className="w-full lg:col-span-7 flex flex-col lg:grid lg:grid-cols-12 gap-4">

            {/* Main Interactive Zoom Box */}
            <div className={`w-full ${(currentProduct.images || []).length > 1 ? 'lg:col-span-10' : 'lg:col-span-12'} order-1 lg:order-2 relative aspect-[4/5] bg-[var(--color-beige)]/30 rounded-[2.5rem] overflow-hidden border border-white/50 shadow-md group`}>

              <div
                className="w-full h-full overflow-hidden cursor-zoom-in relative"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={(currentProduct.images || [])[activeImageIdx] || currentProduct.img || "/Image/Noimage.jpg"}
                  alt={currentProduct.name}
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                  className="w-full h-full object-contain object-center transition-transform duration-300"
                />

                {/* Immersive Zoom View Layer */}
                <div
                  className="absolute inset-0 bg-no-repeat pointer-events-none scale-150 transition-transform duration-75"
                  style={{
                    backgroundImage: `url(${(currentProduct.images || [])[activeImageIdx] || currentProduct.img || "/Image/Noimage.jpg"})`,
                    backgroundPosition: "center center",
                    backgroundSize: "200%",
                    ...zoomStyle
                  }}
                />
              </div>

              {/* Floating Buttons */}
              <div className="absolute top-5 left-5 z-10 flex flex-col gap-2">
                <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-semibold tracking-widest uppercase text-[var(--color-primary)] border border-[var(--color-primary)]/5 shadow-sm">
                  {currentProduct.tag}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const pId = Number((currentProduct as any).productId || currentProduct.id || 0);
                  const vId = Number(selectedVariant?.varientId || currentProduct.variants?.[0]?.varientId || (currentProduct as any).variantId || 0);
                  const packingType = currentProduct.category === "mukhwas" ? packaging : undefined;
                  toggleWishlist(pId, vId, packingType);
                }}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-sm text-[var(--color-dark-text)] hover:text-[var(--color-primary)] hover:scale-105 transition-all duration-300 z-10 cursor-pointer"
                aria-label="Add to Wishlist"
              >
                <Heart className={`w-5 h-5 transition-all duration-300 ${isInWishlist(Number((currentProduct as any).productId || currentProduct.id || 0), Number(selectedVariant?.varientId || currentProduct.variants?.[0]?.varientId || (currentProduct as any).variantId || 0), currentProduct.category === "mukhwas" ? packaging : undefined) ? "fill-[var(--color-primary)] text-[var(--color-primary)] scale-110" : ""}`} />
              </button>

              <button
                onClick={() => setIsFullscreen(true)}
                className="absolute bottom-5 right-5 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-sm text-black hover:text-[var(--color-primary)] hover:scale-105 transition-all duration-300 cursor-pointer"
                aria-label="Enlarge Image"
              >
                <Maximize2 className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Horizontal or Vertical Thumbnails */}
            {(currentProduct.images || []).length > 1 && (
              <div className="w-full lg:col-span-2 order-2 lg:order-1 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none">
                {(currentProduct.images || []).map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-full lg:h-auto lg:aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 flex-shrink-0 ${activeImageIdx === idx ? 'border-[var(--color-primary)] scale-[1.02] shadow-sm' : 'border-black/5 hover:border-black/20 opacity-80 hover:opacity-100'}`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Detail CTAs */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-start w-full px-1 sm:px-0">

            {/* Tagline & Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 rounded-full text-[9px] font-semibold tracking-widest uppercase">
                <Sparkles className="w-3 h-3 text-[var(--color-primary)]" />
                <span>Ritual Essential</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-black leading-tight mb-2 tracking-tight">
              {currentProduct.name}
            </h1>

            {/* Tagline sentence */}
            <p className="text-xs uppercase tracking-wider text-[var(--color-primary)] font-semibold mb-6">
              {currentProduct.tagline}
            </p>

            {/* Ratings & Reviews */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex gap-0.5 text-amber-500">
                {[...Array(5)].map((_, i) => {
                  const roundedRating = Math.round(reviewStats.averageRating || 0);
                  return (
                    <Star key={i} className={`w-4 h-4 ${i < roundedRating ? 'fill-current' : ''}`} />
                  );
                })}
              </div>
              <span className="text-xs font-medium text-[var(--color-dark-text)]/60 font-general">
                {reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : "0.0"} / 5.0 ({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'})
              </span>
            </div>

            {/* Pricing Section */}
            {(() => {
              const variantSellPrice = selectedVariant ? (selectedVariant.sellPrice ?? selectedVariant.price) : (currentProduct.sellPrice ?? currentProduct.price);
              const variantOriginalPrice = selectedVariant ? selectedVariant.price : (currentProduct.originalPrice ?? currentProduct.price);
              const variantDiscountPercent = selectedVariant ? (selectedVariant.discountPercent ?? 0) : (currentProduct.discountPercent ?? 0);
              const showBothPrices = variantSellPrice !== variantOriginalPrice;
              const showDiscountBadge = showBothPrices && variantDiscountPercent > 0;

              return (
                <div className="flex items-baseline gap-4 mb-8 bg-gradient-to-r from-[var(--color-primary)]/5 via-transparent to-transparent p-4 rounded-2xl border-l-2 border-[var(--color-primary)]/30">
                  <span className="text-3xl font-serif font-bold text-[var(--color-primary)]">
                    ₹{variantSellPrice}
                  </span>
                  {showBothPrices && (
                    <span className="text-sm text-[var(--color-dark-text)]/40 line-through">₹{variantOriginalPrice}</span>
                  )}
                  {showDiscountBadge && (
                    <span className="bg-[var(--color-primary)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">
                      {Math.round(variantDiscountPercent)}% OFF
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Short Editorial Description */}
            <div className="text-sm sm:text-base text-[var(--color-dark-text)]/75 font-light font-satoshi leading-relaxed mb-8 break-words">
              {renderProductDescription(currentProduct.longDesc)}
            </div>

            {/* Variant Selector Pills */}
            {currentProduct.variants && currentProduct.variants.length > 1 && (() => {
              const variants = currentProduct.variants || [];
              const hasParsedAttrs = variants.some(v => v.variantAttributes && v.variantAttributes.includes(":"));

              if (hasParsedAttrs) {
                // Parse all variants
                const parsedVariants = variants.map(v => ({
                  variant: v,
                  attrs: parseAttributes(v.variantAttributes)
                }));

                // Find all unique attribute keys (e.g., ["Weight", "Packaging"])
                const attributeKeys: string[] = Array.from(
                  new Set(parsedVariants.flatMap(pv => Object.keys(pv.attrs)))
                );

                // Map each key to its unique values across all variants
                const attributeMap: Record<string, string[]> = {};
                attributeKeys.forEach(key => {
                  attributeMap[key] = Array.from(
                    new Set(parsedVariants.map(pv => pv.attrs[key]).filter(Boolean))
                  );
                });

                return (
                  <div className="mb-8 space-y-6">
                    {attributeKeys.map((key) => {
                      const currentSelectedValue = selectedAttrs[key];
                      const values = attributeMap[key] || [];
                      return (
                        <div key={key} className="flex flex-col">
                          <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-dark-text)]/50 font-semibold block mb-2.5 font-general">
                            Select {key}
                          </span>
                          <div className="flex flex-wrap gap-2.5">
                            {values.map((val) => {
                              const isSelected = currentSelectedValue === val;
                              return (
                                <button
                                  key={val}
                                  onClick={() => handleAttrSelect(key, val)}
                                  className={`px-5 py-2.5 text-xs font-semibold rounded-full border transition-all duration-300 cursor-pointer ${isSelected
                                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md shadow-[var(--color-primary)]/10"
                                    : "bg-white/80 text-[var(--color-dark-text)]/80 border-black/10 hover:border-black/30 hover:bg-white"
                                    }`}
                                >
                                  {val}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              // Fallback to original variant selector
              return (
                <div className="mb-8">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-dark-text)]/50 font-semibold block mb-3 font-general">
                    Select Option
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {variants.map((v) => {
                      const isSelected = selectedVariant?.varientId === v.varientId;
                      return (
                        <button
                          key={v.varientId}
                          onClick={() => handleVariantSelect(v)}
                          className={`px-5 py-2.5 text-xs font-semibold rounded-full border transition-all duration-300 cursor-pointer ${isSelected
                            ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md shadow-[var(--color-primary)]/10"
                            : "bg-white/80 text-[var(--color-dark-text)]/80 border-black/10 hover:border-black/30 hover:bg-white"
                            }`}
                        >
                          {v.variantAttributeValues_Only || `Variant ${v.varientId}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {currentProduct.category === "mukhwas" && (
              <div className="mb-8 flex flex-col">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-dark-text)]/50 font-semibold block mb-2.5 font-general">
                  Select Packaging
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {["Pouch", "Bottle"].map((type) => {
                    const isSelected = packaging === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setPackaging(type)}
                        className={`px-5 py-2.5 text-xs font-semibold rounded-full border transition-all duration-300 cursor-pointer ${isSelected
                          ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md shadow-[var(--color-primary)]/10"
                          : "bg-white/80 text-[var(--color-dark-text)]/80 border-black/10 hover:border-black/30 hover:bg-white"
                          }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock status indicator */}
            {(() => {
              const baseStock = selectedVariant?.totalAvailableStock ?? currentProduct.totalAvailableStock;
              if (baseStock === undefined) return null;

              const displayStock = Math.max(0, baseStock - quantity);

              if (displayStock > 10) return null;

              return (
                <div className="mb-8">
                  <div className="inline-flex items-center gap-1.5 text-red-600 font-semibold text-xs uppercase tracking-wider bg-red-50 px-4 py-2.5 rounded-2xl border border-red-100">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span>Available only: {displayStock}</span>
                  </div>
                </div>
              );
            })()}

            {/* Quantity Selector & CTAs */}
            <div className="space-y-6 mb-8">

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-dark-text)]/50 font-semibold font-general">
                  Quantity
                </span>
                <div className="flex items-center bg-white/80 backdrop-blur-xl border border-[#5B2A86]/10 rounded-full p-1.5 shadow-sm max-w-[160px]">
                  <motion.button
                    whileTap={quantity <= 1 ? {} : { scale: 0.9 }}
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-dark-text)] transition-all ${quantity <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--color-primary)]/5 cursor-pointer'}`}
                  >
                    <Minus className="w-4 h-4 text-[#5B2A86]" />
                  </motion.button>
                  <span className="flex-1 text-center text-base font-semibold font-general text-[#1B1720]">
                    {quantity}
                  </span>
                  <motion.button
                    whileTap={quantity >= (selectedVariant?.totalAvailableStock ?? currentProduct.totalAvailableStock ?? Infinity) ? {} : { scale: 0.9 }}
                    onClick={() => setQuantity(prev => Math.min(prev + 1, selectedVariant?.totalAvailableStock ?? currentProduct.totalAvailableStock ?? Infinity))}
                    disabled={quantity >= (selectedVariant?.totalAvailableStock ?? currentProduct.totalAvailableStock ?? Infinity)}
                    aria-label="Increase quantity"
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-dark-text)] transition-all cursor-pointer ${quantity >= (selectedVariant?.totalAvailableStock ?? currentProduct.totalAvailableStock ?? Infinity) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--color-primary)]/5'}`}
                  >
                    <Plus className="w-4 h-4 text-[#5B2A86]" />
                  </motion.button>
                </div>
              </div>

              {/* Action Buttons: Responsive vertical stack on mobile, horizontal on desktop */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full">

                {/* Add to Cart */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className="flex-1 bg-gradient-to-r from-white to-[#F7F3FA] hover:to-[#EDE5F5] border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] text-[var(--color-primary)] rounded-full py-4 px-6 text-xs sm:text-sm font-semibold uppercase tracking-widest transition-colors duration-300 shadow-sm cursor-pointer flex items-center justify-center gap-2.5"
                >
                  {cartAdded ? (
                    <>
                      <Check className="w-4 h-4 animate-bounce text-[var(--color-primary)]" />
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[var(--color-primary)]" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </motion.button>

                {/* Buy Now with custom cinematic purple gradient and soft glow */}
                <motion.button
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 10px 25px -5px rgba(91, 42, 134, 0.4)"
                  }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBuyNow}
                  className="flex-1 bg-gradient-to-r from-[#5B2A86] via-[#7A49A5] to-[#A678D6] text-white rounded-full py-4 px-6 text-xs sm:text-sm font-semibold uppercase tracking-widest transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center shadow-[rgba(91,42,134,0.25)]_0px_10px_20px_-2px"
                >
                  Buy Now
                </motion.button>
              </div>

              {/* Share */}
              <div className="flex items-center justify-start gap-8 pt-6 border-t border-[var(--color-primary)]/10 mt-6">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="flex items-center gap-3 py-2 px-1 text-xs uppercase tracking-wider text-[var(--color-dark-text)]/70 hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium font-general">{copiedLink ? 'Link Copied!' : 'Share Product'}</span>
                </motion.button>
              </div>

            </div>

            {/* Trust Badges Details */}
            <div className="bg-white/60 backdrop-blur-md rounded-3xl p-5 border border-white/80 grid grid-cols-3 gap-3 text-center text-[10px] text-[var(--color-dark-text)]/60 font-general uppercase tracking-wider shadow-sm">
              <div className="flex flex-col items-center gap-2 p-2 hover:text-[var(--color-primary)] transition-colors duration-300">
                <Truck className="w-5 h-5 text-[var(--color-primary)]" />
                <span>Free Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-2 border-x border-black/5 hover:text-[var(--color-primary)] transition-colors duration-300">
                <ShieldCheck className="w-5 h-5 text-[var(--color-primary)]" />
                <span>Organic Certified</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-2 hover:text-[var(--color-primary)] transition-colors duration-300">
                <RotateCcw className="w-5 h-5 text-[var(--color-primary)]" />
                <span>Easy Returns</span>
              </div>
            </div>

          </div>

        </div>

        {/* 2. Product Information Tabs Showcase */}
        <section className="mb-24">
          <div className="flex justify-center border-b border-[var(--color-primary)]/10 mb-12">
            <div className="flex gap-8 sm:gap-12 overflow-x-auto pb-4 scrollbar-none font-serif text-lg sm:text-xl">
              <button
                onClick={() => setActiveTab('desc')}
                className={`relative py-2 text-left cursor-pointer transition-colors ${activeTab === 'desc' ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-dark-text)]/40 hover:text-[var(--color-dark-text)]/80'}`}
              >
                <span>Description</span>
                {activeTab === 'desc' && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-primary)]" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('ingredients')}
                className={`relative py-2 text-left cursor-pointer transition-colors ${activeTab === 'ingredients' ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-dark-text)]/40 hover:text-[var(--color-dark-text)]/80'}`}
              >
                <span>Ingredients</span>
                {activeTab === 'ingredients' && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-primary)]" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('benefits')}
                className={`relative py-2 text-left cursor-pointer transition-colors ${activeTab === 'benefits' ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-dark-text)]/40 hover:text-[var(--color-dark-text)]/80'}`}
              >
                <span>Benefits</span>
                {activeTab === 'benefits' && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-primary)]" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('faq')}
                className={`relative py-2 text-left cursor-pointer transition-colors ${activeTab === 'faq' ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-dark-text)]/40 hover:text-[var(--color-dark-text)]/80'}`}
              >
                <span>FAQs</span>
                {activeTab === 'faq' && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-primary)]" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`relative py-2 text-left cursor-pointer transition-colors ${activeTab === 'reviews' ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-dark-text)]/40 hover:text-[var(--color-dark-text)]/80'}`}
              >
                <span>Reviews</span>
                {activeTab === 'reviews' && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-primary)]" />
                )}
              </button>
            </div>
          </div>

          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              {activeTab === 'desc' && (
                <motion.div
                  key="descTab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col md:grid md:grid-cols-12 gap-10 items-start w-full"
                >
                  <div className="w-full md:col-span-7 space-y-6">
                    <h3 className="text-2xl sm:text-3xl font-serif text-black font-light leading-snug">
                      The botanical recipe built for <br />
                      <span className="italic text-[var(--color-primary)]">cellular skin transformation.</span>
                    </h3>

                    <div className="text-sm text-[var(--color-dark-text)]/75 font-light leading-relaxed space-y-4 font-satoshi">
                      {renderProductDescription(currentProduct.longDesc)}
                      <p>
                        We prepare our formulations inside traditional apothecaries. The ingredients are hand-stirred in micro-batches to safeguard active plant nutrients from heat degradation. This produces a raw, nutrient-rich formula loaded with cellular benefits.
                      </p>
                    </div>
                  </div>

                  <div className="w-full md:col-span-5 space-y-6">
                    <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm">
                      <h4 className="text-xs uppercase tracking-widest font-semibold text-[var(--color-primary)] mb-4">Application Ritual</h4>
                      <ol className="space-y-4 font-satoshi text-xs text-[var(--color-dark-text)]/80">
                        {currentProduct.usage?.map((step: string, idx: number) => (
                          <li key={idx} className="flex gap-4">
                            <span className="w-5 h-5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold font-general flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ingredients' && (
                <motion.div
                  key="ingsTab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  {currentProduct.ingredients?.map((ing: any, idx: number) => (
                    <div key={idx} className="bg-white/40 border border-white/60 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between group/card">
                      <div>
                        <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden mb-6 relative">
                          <img
                            src={ing.img}
                            alt={ing.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-[1s]"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <h4 className="text-lg font-serif font-medium text-black">{ing.name}</h4>
                          <span className="text-[9px] uppercase tracking-widest bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2.5 py-0.5 rounded-full font-semibold">{ing.benefit}</span>
                        </div>
                        <p className="text-xs text-[var(--color-dark-text)]/70 font-light leading-relaxed font-satoshi">
                          {ing.desc}
                        </p>
                      </div>
                      <div className="border-t border-black/5 pt-4 mt-6 flex justify-between items-center text-[10px] text-[var(--color-dark-text)]/40 uppercase tracking-wider font-general">
                        <span>Source</span>
                        <span className="font-semibold text-[var(--color-dark-text)]/70">{ing.source}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'benefits' && (
                <motion.div
                  key="benefitsTab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-6"
                >
                  {currentProduct.benefits?.map((benefit: string, idx: number) => (
                    <div key={idx} className="bg-white/40 border border-white/60 p-8 rounded-[2rem] shadow-sm backdrop-blur-md flex flex-col items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                        <Award className="w-5 h-5" />
                      </div>
                      <h4 className="font-serif text-lg text-black font-semibold mt-2">Active Benefit {idx + 1}</h4>
                      <p className="text-xs text-[var(--color-dark-text)]/70 font-light leading-relaxed font-satoshi">
                        {benefit}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'faq' && (
                <motion.div
                  key="faqTab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="max-w-3xl mx-auto space-y-4 font-satoshi w-full"
                >
                  {currentProduct.faqs?.map((faq: any, idx: number) => {
                    const isOpen = openFaqIdx === idx;
                    return (
                      <div key={idx} className="bg-white/40 border border-white/50 rounded-2xl overflow-hidden shadow-sm">
                        <button
                          onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                          className="flex justify-between items-center w-full p-5 text-left text-black font-serif font-medium text-base cursor-pointer"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown className={`w-4 h-4 text-[var(--color-primary)] transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <p className="p-5 pt-0 text-xs text-[var(--color-dark-text)]/70 font-light leading-relaxed border-t border-black/5">
                                {faq.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div
                  key="reviewsTab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="w-full"
                >
                  <ProductReviews
                    productId={Number(currentProduct.productId || currentProduct.id)}
                    onReviewSubmitted={fetchReviewStats}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>



      </div>

      {/* 5. Sticky Purchase Bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 inset-x-0 bg-white/90 backdrop-blur-xl border-b border-black/5 py-3.5 shadow-md z-[999] hidden sm:block"
          >
            <div className="max-w-7xl mx-auto px-8 flex justify-between items-center w-full">

              <div className="flex items-center gap-3">
                <img
                  src={selectedVariant ? selectedVariant.imagePath : currentProduct.images[0]}
                  alt={currentProduct.name}
                  loading="lazy"
                  decoding="async"
                  className="w-10 h-10 rounded-lg object-contain"
                />
                <div>
                  <h4 className="text-xs font-serif font-bold text-black">
                    {selectedVariant ? `${currentProduct.name} (${selectedVariant.variantAttributeValues_Only})` : currentProduct.name}
                  </h4>
                  <span className="text-[10px] text-[var(--color-primary)] font-semibold uppercase tracking-widest">{currentProduct.tagline}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-sm font-serif font-bold text-[var(--color-primary)]">
                  ₹{selectedVariant ? selectedVariant.price : currentProduct.price}
                </span>

                <div className="flex items-center bg-black/5 rounded-full p-1 shadow-sm scale-90">
                  <button
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    aria-label="Decrease quantity"
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--color-dark-text)] hover:bg-black/5 transition-all cursor-pointer"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-semibold font-general">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(prev => prev + 1)}
                    aria-label="Increase quantity"
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--color-dark-text)] hover:bg-black/5 transition-all cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-[10px] font-semibold uppercase tracking-widest px-6 py-2.5 rounded-full transition-all duration-300 shadow-sm cursor-pointer"
                >
                  {cartAdded ? 'Added to Cart' : 'Add to Cart'}
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Fullscreen Image Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setIsFullscreen(false)}
          >
            <div className="relative max-w-5xl max-h-[90vh] aspect-[4/5] bg-transparent">
              <img
                src={currentProduct.images[activeImageIdx]}
                alt={currentProduct.name}
                className="w-full h-full object-contain mx-auto"
              />
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 text-white hover:text-[var(--color-primary)] transition-colors text-xs font-semibold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
