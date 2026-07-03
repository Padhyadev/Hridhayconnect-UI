import React, { useState } from "react";
import { ShoppingBag, Heart } from "lucide-react";
import { HomeSection } from "../api/productService";
import { products, Product } from "../data/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export function SectionGrid({ section }: { section: HomeSection }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const items = section.items;

  return (
    <section className="px-2 sm:px-4 md:px-12 max-w-[1600px] mx-auto w-full py-12 md:py-16">
      <div className="relative flex items-center justify-center mb-8 md:mb-14">
        <h2 className="text-3xl md:text-5xl font-serif text-[var(--color-dark-text)] text-center tracking-wide">
          {section.title}
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-8">
        {items.map((item, idx) => {
          const localProd = item as Product;
          const mockProd = products.find(p => p.id === localProd.id);
          const product = mockProd ? { ...mockProd, ...localProd } : localProd;
          return (
            <div
              key={product.id || idx}
              className="group cursor-pointer"
              onClick={() => window.location.hash = `#product-${product.id}`}
            >
              <div className="bg-[var(--color-beige)]/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-[var(--color-primary)]/10 transition-all duration-700 relative aspect-square mb-5">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 ${product.images[1] ? 'group-hover:opacity-0' : ''}`}
                />
                {product.images[1] && (
                  <img
                    src={product.images[1]}
                    alt={`${product.name} alternate`}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out opacity-0 group-hover:opacity-100 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Floating Badges */}
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-2 items-start z-[60]">
                  {(() => {
                    const dp = typeof product.discountPercent === 'number' ? product.discountPercent : 0;
                    const sp = typeof product.sellPrice === 'number' ? product.sellPrice : product.price;
                    const op = typeof product.originalPrice === 'number' ? product.originalPrice : product.price;
                    if (dp > 0 && sp !== op) {
                      return (
                        <div className="bg-[var(--color-primary)] text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] font-bold tracking-wider shadow-sm">
                          {Math.round(dp)}% OFF
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Wishlist Toggle Button */}
                {(!product.variants || product.variants.length <= 1) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(Number(product.productId || 0), Number(product.variants?.[0]?.varientId || product.variantId || 0));
                    }}
                    aria-label={isInWishlist(Number(product.productId || 0)) ? "Remove from wishlist" : "Add to wishlist"}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[60] p-1.5 sm:p-2 rounded-full bg-white/80 backdrop-blur-md shadow-sm hover:bg-white hover:scale-110 transition-all duration-300 group/wishlist"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-300 ${isInWishlist(Number(product.productId || 0))
                        ? 'fill-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'text-[var(--color-dark-text)]/60 group-hover/wishlist:text-[var(--color-primary)]'
                        }`}
                    />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product, 1, product.category === 'mukhwas' ? 'Pouch' : undefined);
                  }}
                  aria-label={`Add ${product.name} to cart`}
                  className="absolute bottom-2 right-2 sm:bottom-5 sm:right-5 bg-white/95 backdrop-blur-md p-2.5 sm:p-3.5 rounded-full shadow-xl opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-500 hover:bg-[var(--color-primary)] hover:text-white text-[var(--color-dark-text)]"
                >
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <div className="px-1 text-center md:text-left">
                <h3 className="font-serif text-sm sm:text-base md:text-xl text-[var(--color-dark-text)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                  {product.name}
                </h3>
                <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3 mt-1 sm:mt-2">
                  <span className="text-[var(--color-primary)] font-semibold text-sm sm:text-base md:text-lg">
                    ₹{typeof product.sellPrice === 'object' ? (product.price || 0) : (product.sellPrice ?? product.price)}
                  </span>
                  {(product.originalPrice ?? product.price) !== (product.sellPrice ?? product.price) && (
                    <span className="text-xs sm:text-sm text-[var(--color-dark-text)]/40 line-through">
                      ₹{typeof product.originalPrice === 'object' ? (product.price || 0) : product.originalPrice}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
