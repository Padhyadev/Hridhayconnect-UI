import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Trash2, ShoppingBag, ArrowRight, Check, PackageOpen } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

export function WishlistPage() {
  const { wishlistItems, loading, removeFromWishlist } = useWishlist();
  const { addToCart, cartItems } = useCart();

  // Show a premium empty state if there are no items
  if (!loading && wishlistItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 relative bg-gradient-to-br from-[#fffaf5] to-[#f8f4ff] overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-200/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/20 blur-3xl pointer-events-none" />
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mb-8 z-10"
        >
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center justify-center border border-gray-50 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-50 to-transparent opacity-50" />
            <PackageOpen className="w-20 h-20 md:w-28 md:h-28 text-gray-300 relative z-10 stroke-[1.5]" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-50">
            <Heart className="w-6 h-6 text-red-500 fill-red-500 animate-pulse" />
          </div>
        </motion.div>

        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-4 text-center z-10"
        >
          Your Wishlist is Empty
        </motion.h2>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-gray-500 text-lg mb-10 text-center max-w-md z-10"
        >
          Curate your collection of premium favorites. They will be waiting here for you when you're ready to indulge.
        </motion.p>

        <motion.a 
          href="#home"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gray-900 text-white px-8 py-4 rounded-full font-semibold tracking-wide flex items-center gap-3 hover:bg-gray-800 transition-colors shadow-xl shadow-gray-900/20 z-10"
        >
          Explore Collection <ArrowRight className="w-5 h-5" />
        </motion.a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffaf5] to-[#f8f4ff] pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-200/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/20 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-end justify-between mb-10 border-b border-gray-200/60 pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-2">My Wishlist</h1>
            <p className="text-gray-500 font-medium">
              {wishlistItems.length} premium {wishlistItems.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
        </div>

        {loading && wishlistItems.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white/90 backdrop-blur-sm rounded-[20px] p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-pulse">
                <div className="w-full aspect-square bg-gray-200 rounded-[16px]"></div>
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="flex gap-1.5 sm:gap-2">
                    <div className="h-5 sm:h-6 bg-gray-200 rounded-full w-12 sm:w-16"></div>
                    <div className="h-5 sm:h-6 bg-gray-200 rounded-full w-16 sm:w-20"></div>
                  </div>
                  <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/4 mt-1 sm:mt-2"></div>
                  <div className="h-10 sm:h-12 bg-gray-200 rounded-full w-full mt-1 sm:mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <AnimatePresence>
              {wishlistItems.map((item, index) => {
                const stock = item.TotalAvailableStock || 15; // Fallback to 15 if undefined
                const isInCart = cartItems.some(c => c.product.productId === item.ProductId && (c.product.variantId || 0) === (item.VariantId || 0));

                return (
                  <motion.div
                    key={item.Id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      const cleanPackingType = (typeof item.PackingType === 'string' && item.PackingType.trim()) 
                        ? item.PackingType.trim() 
                        : '';
                      const hashParts = [`#product-${item.ProductId}`, item.VariantId];
                      if (cleanPackingType && cleanPackingType.toLowerCase() !== '[object object]') {
                        hashParts.push(cleanPackingType);
                      }
                      window.location.hash = hashParts.join("-");
                    }}
                    className="bg-white/90 backdrop-blur-sm rounded-[20px] p-3 sm:p-4 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group relative cursor-pointer border border-white"
                  >
                    {/* Remove Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWishlist(item.Id);
                      }}
                      className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white shadow-md hover:bg-gray-50 transition-colors rounded-full p-2 z-20 group/btn"
                      aria-label="Remove from wishlist"
                    >
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 fill-red-500 group-hover/btn:scale-110 transition-transform" />
                    </button>

                    <div className="w-full aspect-square rounded-[16px] overflow-hidden bg-[var(--color-beige)]/20 relative mb-3 sm:mb-4">
                      <img 
                        src={`https://hridhayconnectreact.bsite.net${item.ImagePath}`} 
                        alt={typeof item.ProductName === 'string' ? item.ProductName : 'Product'}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.png'; // fallback if image fails
                        }}
                      />
                      {typeof item.DiscountPercent === 'number' && item.DiscountPercent > 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] font-bold shadow-md z-10">
                          -{item.DiscountPercent}%
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                          {typeof item.CategoryName === 'string' ? item.CategoryName : 'Category'}
                        </span>
                        
                        {/* Stock Status Indicator */}
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${stock > 10 ? 'bg-green-500' : stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`} />
                          <span className="text-[10px] sm:text-xs font-medium text-gray-500 hidden sm:inline-block">
                            {stock > 10 ? 'In Stock' : stock > 0 ? 'Low Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-serif text-sm sm:text-lg font-bold text-gray-900 leading-tight group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                        {typeof item.ProductName === 'string' ? item.ProductName : ''}
                      </h3>
                      
                      <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-3">
                        {typeof item.VariantAttributeValues_Only === 'string' && item.VariantAttributeValues_Only && (
                          <span className="text-[10px] sm:text-xs font-medium bg-gray-50 border border-gray-100 text-gray-600 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                            Wt: {item.VariantAttributeValues_Only}
                          </span>
                        )}
                        {typeof item.PackingType === 'string' && item.PackingType && (
                          <span className="text-[10px] sm:text-xs font-medium bg-gray-50 border border-gray-100 text-gray-600 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                            {item.PackingType}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 mb-4 sm:mb-5">
                        <span className="text-base sm:text-xl font-bold text-gray-900">
                          ₹{typeof item.SellPrice === 'object' ? '' : item.SellPrice}
                        </span>
                        {item.Price !== item.SellPrice && (
                          <span className="text-xs sm:text-sm text-gray-400 line-through">
                            ₹{typeof item.Price === 'object' ? '' : item.Price}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto pt-2 border-t border-gray-100">
                        {isInCart ? (
                          <button
                            disabled
                            className="w-full bg-green-800 text-white py-2 sm:py-3 rounded-full font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-colors text-xs sm:text-sm opacity-90 cursor-not-allowed"
                          >
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                            <span>Already In Cart</span>
                          </button>
                        ) : (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const mockProduct: any = {
                                id: item.ProductId.toString(),
                                name: typeof item.ProductName === 'string' ? item.ProductName : '',
                                price: typeof item.Price === 'number' ? item.Price : 0,
                                sellPrice: typeof item.SellPrice === 'number' ? item.SellPrice : 0,
                                originalPrice: typeof item.Price === 'number' ? item.Price : 0,
                                discountPercent: typeof item.DiscountPercent === 'number' ? item.DiscountPercent : 0,
                                image: `https://hridhayconnectreact.bsite.net${item.ImagePath}`,
                                images: [`https://hridhayconnectreact.bsite.net${item.ImagePath}`],
                                category: typeof item.CategoryName === 'string' ? item.CategoryName.toLowerCase().replace(/ /g, '-') : 'category',
                                productId: item.ProductId,
                                variantId: item.VariantId,
                                variants: [{ id: item.VariantId.toString(), size: typeof item.VariantAttributeValues_Only === 'string' ? item.VariantAttributeValues_Only : '', price: typeof item.SellPrice === 'number' ? item.SellPrice : 0, originalPrice: typeof item.Price === 'number' ? item.Price : 0 }]
                              };
                              const cleanPackingType = (typeof item.PackingType === 'string' && item.PackingType.trim()) 
                                ? item.PackingType.trim() 
                                : '';
                              const rawPackingType = cleanPackingType || (typeof item.VariantAttributeValues_Only === 'string' ? item.VariantAttributeValues_Only : '');
                              const packingTypeToPass = (typeof rawPackingType === 'string' && (rawPackingType.toLowerCase() === 'bottle' || rawPackingType.toLowerCase() === 'pouch')) ? rawPackingType : undefined;
                              await addToCart(mockProduct, 1, packingTypeToPass);
                              import('../utils/toastService').then(module => {
                                module.showToast('success', 'Product added to cart successfully');
                              });
                            }}
                            className="w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white py-2 sm:py-3 rounded-full font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 text-xs sm:text-sm z-10 relative"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Move to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
