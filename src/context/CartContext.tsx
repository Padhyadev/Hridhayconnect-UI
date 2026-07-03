import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, products } from "../data/products";
import { getCaseInsensitiveProperty, normalizeSlug, resolveImageUrl, shouldHideVariant } from "../api/productService";
import { post, del } from "../api/BaseService";

export interface CartItem {
  product: Product;
  quantity: number;
  packingType?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, packingType?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartCount: number;
  cartSubtotal: number;
  // Checkout fields
  checkoutItems: CartItem[];
  checkoutOffers: any[];
  prepareCheckout: (items: CartItem[], offers?: any[]) => void;
  clearCheckout: () => void;
  syncCartWithApi: () => Promise<void>;
  mergeGuestCartToApi: () => Promise<void>;
  isCartLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function safeText(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeProductForCart(product: any): Product {
  return {
    ...product,
    id: safeText(product?.id, ""),
    name: safeText(product?.name, ""),
    category: safeText(product?.category, ""),
    tagline: safeText(product?.tagline, ""),
    desc: safeText(product?.desc, ""),
    longDesc: safeText(product?.longDesc, ""),
    price: safeNumber(product?.price, 0),
    originalPrice: safeNumber(product?.originalPrice, 0),
    images: Array.isArray(product?.images) ? product.images.filter((image: unknown) => typeof image === "string") : [],
    totalAvailableStock: product?.totalAvailableStock === undefined ? undefined : safeNumber(product?.totalAvailableStock, 0)
  };
}

function sanitizeCartItem(item: any): CartItem | null {
  if (!item || typeof item !== "object" || !item.product) return null;

  return {
    product: sanitizeProductForCart(item.product),
    quantity: Math.max(1, safeNumber(item.quantity, 1)),
    packingType: safeText(item.packingType, "") || undefined
  };
}

// Helper to resolve API cart item to local CartItem structure
export function resolveCartItem(apiCartItem: any): CartItem | null {
  console.log("[resolveCartItem] Raw API Cart Item:", apiCartItem);
  const productId = getCaseInsensitiveProperty<any>(apiCartItem, "ProductId") || getCaseInsensitiveProperty<any>(apiCartItem, "id");
  const variantId = getCaseInsensitiveProperty<any>(apiCartItem, "VariantId") || getCaseInsensitiveProperty<any>(apiCartItem, "VarientId");
  const quantity = getCaseInsensitiveProperty<number>(apiCartItem, "Quantity") || getCaseInsensitiveProperty<number>(apiCartItem, "qty") || 1;
  const productName = getCaseInsensitiveProperty<string>(apiCartItem, "ProductName") || getCaseInsensitiveProperty<string>(apiCartItem, "name") || "";
  const price = getCaseInsensitiveProperty<number>(apiCartItem, "Price") || getCaseInsensitiveProperty<number>(apiCartItem, "SellPrice") || 0;
  
  const rawPackingType = getCaseInsensitiveProperty<any>(apiCartItem, "packingType") || getCaseInsensitiveProperty<any>(apiCartItem, "PackingType");
  let packingType = "";
  if (typeof rawPackingType === "string") {
    packingType = rawPackingType.trim();
  } else if (rawPackingType && typeof rawPackingType !== "object") {
    packingType = String(rawPackingType).trim();
  }

  const variantAttributeValuesOnlyRaw = getCaseInsensitiveProperty<any>(apiCartItem, "VariantAttributeValues_Only");
  let variantAttributeValuesOnly = typeof variantAttributeValuesOnlyRaw === "string" ? variantAttributeValuesOnlyRaw.trim() : "";

  if (shouldHideVariant(apiCartItem)) {
    variantAttributeValuesOnly = "";
  }

  const variantAttributeValuesIdRaw = getCaseInsensitiveProperty<any>(apiCartItem, "VariantAttributeValues_Id");
  const variantAttributeValuesId = typeof variantAttributeValuesIdRaw === "string" ? variantAttributeValuesIdRaw.trim() : "";

  // If the attribute ID is 13 (Weight), hide the "Weight :" prefix
  if (variantAttributeValuesId.startsWith("13:") || variantAttributeValuesId === "13") {
    variantAttributeValuesOnly = variantAttributeValuesOnly.replace(/Weight\s*:\s*/i, "").trim();
  }

  const imagePathRaw = getCaseInsensitiveProperty<string>(apiCartItem, "ImagePath") || getCaseInsensitiveProperty<string>(apiCartItem, "imagepath") || "";
  const resolvedImg = imagePathRaw ? resolveImageUrl(imagePathRaw) : null;

  const parsedProductId = (productId && typeof productId !== "object" && !isNaN(Number(productId))) ? Number(productId) : 0;
  const parsedVariantId = (variantId && typeof variantId !== "object" && !isNaN(Number(variantId)) && Number(variantId) !== 0) ? Number(variantId) : undefined;

  console.log(`[resolveCartItem] Extracted values: ProductId=${parsedProductId}, VariantId=${parsedVariantId}, Quantity=${quantity}, ProductName=${productName}, Price=${price}, PackingType=${packingType}, ImagePath=${imagePathRaw}`);

  if (!parsedProductId) {
    console.warn("[resolveCartItem] Falsy ProductId, skipping resolution");
    return null;
  }

  // Search by exact matches on ID or variants containing variantId
  let matchedProduct = products.find(p => {
    if (parsedVariantId && p.variants && p.variants.some(v => Number(v.varientId) === parsedVariantId)) {
      return true;
    }
    return String(p.productId) === String(parsedProductId) || p.id === String(parsedProductId) || normalizeSlug(p.name) === normalizeSlug(productName);
  });

  if (matchedProduct) {
    console.log(`[resolveCartItem] Found matched product in static DB: ${matchedProduct.name} (id: ${matchedProduct.id})`);
    let finalProduct = { ...matchedProduct };

    // Update with dynamic API image if provided
    if (resolvedImg) {
      finalProduct.images = [resolvedImg, ...finalProduct.images.slice(1)];
    }

    // If a specific variant was selected, update product name, price, and image to match that variant
    if (parsedVariantId && finalProduct.variants) {
      const variant = finalProduct.variants.find(v => Number(v.varientId) === parsedVariantId);
      if (variant) {
        console.log(`[resolveCartItem] Resolving variant attributes for variant ID ${parsedVariantId}:`, variant.variantAttributeValues_Only);
        const attrVal = variantAttributeValuesOnly || variant.variantAttributeValues_Only || "";
        finalProduct = {
          ...finalProduct,
          price: price || variant.price,
          name: attrVal ? `${finalProduct.name} (${attrVal})` : finalProduct.name
        };
        // Use variant image if no dynamic image was provided by the API cart item
        if (!resolvedImg && variant.imagePath) {
           finalProduct.images = [resolveImageUrl(variant.imagePath), ...finalProduct.images.slice(1)];
        }
      }
    }

    return {
      product: {
        ...finalProduct,
        id: parsedVariantId ? `${matchedProduct.id}-${parsedVariantId}` : matchedProduct.id,
        productId: parsedProductId,
        variantId: parsedVariantId
      },
      quantity,
      packingType
    };
  }

  // Fallback: If not found in global products list, construct a high-fidelity placeholder product
  console.log(`[resolveCartItem] Product not found in DB. Creating fallback product for: ${productName} (ProductId: ${parsedProductId})`);

  const defaultImg = resolvedImg || "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80";

  const fallbackProduct: Product = {
    id: parsedVariantId 
      ? `${parsedProductId}-${parsedVariantId}${packingType ? `-${packingType.toLowerCase()}` : ""}` 
      : `${parsedProductId}${packingType ? `-${packingType.toLowerCase()}` : ""}`,
    name: variantAttributeValuesOnly ? `${productName} (${variantAttributeValuesOnly})` : productName,
    price: price,
    originalPrice: Math.round(price * 1.8),
    discount: "45% OFF",
    tag: "",
    images: [defaultImg],
    category: "mukhwas", // default category
    tagline: "Indian heritage premium blend",
    rating: 4.8,
    ratingCount: 12,
    desc: productName,
    longDesc: productName,
    benefits: ["100% natural, sugar-saccharin free"],
    ingredients: [],
    usage: [],
    highlights: [],
    reviews: [],
    faqs: [],
    productId: parsedProductId,
    variantId: parsedVariantId
  };

  return {
    product: fallbackProduct,
    quantity,
    packingType
  };
}

// Helper to extract customer ID from JWT token payload
function getCustomerIdFromToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);
    const customerId = decoded.CustomerId || 
                       decoded.customerId || 
                       decoded.Id || 
                       decoded.id || 
                       decoded.nameid || 
                       decoded.sub ||
                       decoded.uid ||
                       decoded.UserId ||
                       decoded.userid ||
                       decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
                       decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
    console.log("[getCustomerIdFromToken] Decoded JWT CustomerId:", customerId);
    return customerId ? String(customerId) : null;
  } catch (e) {
    console.error("[getCustomerIdFromToken] Failed to decode JWT token:", e);
    return null;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [checkoutOffers, setCheckoutOffers] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const isSyncingRef = React.useRef(false);

  // Helper to extract numeric product and variant IDs from a Product object
  const getProductAndVariantIds = (product: Product): { productId: number; variantId: number } => {
    let pId = product.productId;
    let vId = product.variantId;

    let cleanId = product.id;
    if (cleanId) {
      cleanId = cleanId.replace(/-(pouch|bottle)$/i, "");
    }

    if (cleanId && cleanId.includes("-")) {
      const parts = cleanId.split("-");
      if (!pId) pId = Number(parts[0]);
      if (!vId) vId = Number(parts[1]);
    }

    if (!pId) {
      pId = Number(cleanId) || 0;
    }

    if (!vId) {
      if (product.variants && product.variants.length > 0) {
        vId = Number(product.variants[0].varientId);
      } else {
        vId = 0;
      }
    }

    return {
      productId: pId,
      variantId: vId
    };
  };

  // Sync cart with database API
  const syncCartWithApi = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("[syncCartWithApi] No auth token found in localStorage. Skipping sync.");
      return;
    }

    // Resolve customer ID
    let customerId = localStorage.getItem("customerId");
    if (!customerId) {
      customerId = getCustomerIdFromToken(token);
      if (customerId) {
        localStorage.setItem("customerId", customerId);
      }
    }

    if (isSyncingRef.current) {
      console.log("[syncCartWithApi] Cart sync already in progress. Skipping.");
      return;
    }

    try {
      isSyncingRef.current = true;
      setIsCartLoading(true);

      const bodyObj = {
        "Id": customerId ? Number(customerId) : 0,
        "Search": ""
      };

      console.log(`[Cart API Request] POST /Customer/GetAll, body:`, bodyObj);

      const result: any = await post("/Customer/GetAll", bodyObj);
      console.log("[Cart API Response] Raw customer payload:", result);

      const dataObj = getCaseInsensitiveProperty(result, "data") || result;

      // Find table3 array (cart details)
      let table3 = getCaseInsensitiveProperty<any[]>(dataObj, "table3");
      if (!Array.isArray(table3)) {
        for (const key of Object.keys(dataObj)) {
          if (Array.isArray(dataObj[key]) && key.toLowerCase().includes("table3")) {
            table3 = dataObj[key];
            break;
          }
        }
      }

      // If table3 is still not found, try to find the "Third Table" by counting arrays
      if (!Array.isArray(table3)) {
        const arrayKeys = Object.keys(dataObj).filter(k => Array.isArray(dataObj[k]));
        if (arrayKeys.length >= 3) {
          console.log(`[Cart API] table3 not found by name. Using the 3rd array: ${arrayKeys[2]}`);
          table3 = dataObj[arrayKeys[2]];
        } else if (arrayKeys.length > 0) {
          // Fallback to the last array if there are less than 3
          console.log(`[Cart API] Less than 3 arrays found. Using the last array: ${arrayKeys[arrayKeys.length - 1]}`);
          table3 = dataObj[arrayKeys[arrayKeys.length - 1]];
        }
      }

      console.log("[Cart API Response] Found table3 cart items:", table3);

      const resolvedItems: CartItem[] = [];
      if (Array.isArray(table3)) {
        table3.forEach((item: any) => {
          const resolved = resolveCartItem(item);
          if (resolved) {
            resolvedItems.push(resolved);
          }
        });
      }

      console.log("[Cart API Success] Mapped resolved cart items:", resolvedItems);
      saveCart(resolvedItems);
    } catch (e) {
      console.error("[Cart API Error] Failed to sync cart with API:", e);
    } finally {
      isSyncingRef.current = false;
      setIsCartLoading(false);
    }
  };

  // Merge guest (pre-login) cart items into the server cart after login
  // Reads whatever is currently in localStorage, pushes each item to SaveCart API,
  // then does a full sync to get the merged result from the server.
  const mergeGuestCartToApi = async () => {
    const token = localStorage.getItem("authToken");
    const customerId = localStorage.getItem("customerId");
    if (!token || !customerId) {
      console.log("[mergeGuestCartToApi] No auth credentials. Falling back to syncCartWithApi.");
      await syncCartWithApi();
      return;
    }

    // Read the guest cart from localStorage (items added before login)
    let guestItems: CartItem[] = [];
    try {
      const stored = localStorage.getItem("hridhay_cart");
      if (stored) {
        guestItems = JSON.parse(stored);
      }
    } catch (e) {
      console.error("[mergeGuestCartToApi] Failed to parse guest cart from localStorage:", e);
    }

    if (!guestItems || guestItems.length === 0) {
      console.log("[mergeGuestCartToApi] No guest cart items to merge. Syncing server cart.");
      await syncCartWithApi();
      return;
    }

    console.log(`[mergeGuestCartToApi] Found ${guestItems.length} guest item(s). Pushing to server...`);
    setIsCartLoading(true);

    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    // Push each guest item to the SaveCart API sequentially
    for (const item of guestItems) {
      const { productId, variantId } = getProductAndVariantIds(item.product);
      if (!productId || isNaN(productId)) {
        console.warn("[mergeGuestCartToApi] Skipping item with invalid productId:", item.product.name);
        continue;
      }

      const payload = {
        customerId: Number(customerId),
        productId: Number(productId),
        variantId: Number(variantId),
        quantity: Number(item.quantity),
        packingType: item.packingType || ""
      };

      try {
        console.log(`[mergeGuestCartToApi] Saving guest item: ${item.product.name} (qty: ${item.quantity})`, payload);
        const result: any = await post("/Cart/SaveCart", payload);
        console.log(`[mergeGuestCartToApi] SaveCart success for ${item.product.name}:`, result);
      } catch (e) {
        console.error(`[mergeGuestCartToApi] Network error saving ${item.product.name}:`, e);
      }
    }

    setIsCartLoading(false);

    // After all guest items are pushed, do a full sync to get the merged result
    console.log("[mergeGuestCartToApi] All guest items pushed. Syncing merged cart from server...");
    await syncCartWithApi();
  };

  // Load from localStorage on mount and listen to auth changes
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("hridhay_cart");
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        if (Array.isArray(parsedCart)) {
          setCartItems(parsedCart.map(sanitizeCartItem).filter(Boolean) as CartItem[]);
        }
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    }

    try {
      const storedCheckout = localStorage.getItem("hridhay_checkout");
      if (storedCheckout) {
        const parsedCheckout = JSON.parse(storedCheckout);
        if (Array.isArray(parsedCheckout)) {
          setCheckoutItems(parsedCheckout.map(sanitizeCartItem).filter(Boolean) as CartItem[]);
        }
      }
    } catch (e) {
      console.error("Failed to load checkout from localStorage", e);
    }

    try {
      const storedOffers = localStorage.getItem("hridhay_checkout_offers");
      if (storedOffers) {
        setCheckoutOffers(JSON.parse(storedOffers));
      }
    } catch (e) {
      console.error("Failed to load checkout offers from localStorage", e);
    }

    // Trigger initial API cart sync if logged in
    syncCartWithApi();

    const handleAuthChange = () => {
      console.log("[CartProvider] auth-change event detected. Syncing cart with API...");
      syncCartWithApi();
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  // Save to localStorage on any cartItems changes
  const saveCart = (items: CartItem[]) => {
    const sanitizedItems = items.map(sanitizeCartItem).filter(Boolean) as CartItem[];
    setCartItems(sanitizedItems);
    try {
      localStorage.setItem("hridhay_cart", JSON.stringify(sanitizedItems));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  };

  const prepareCheckout = (items: CartItem[], offers: any[] = []) => {
    const sanitizedItems = items.map(sanitizeCartItem).filter(Boolean) as CartItem[];
    setCheckoutItems(sanitizedItems);
    setCheckoutOffers(offers);
    try {
      localStorage.setItem("hridhay_checkout", JSON.stringify(sanitizedItems));
      localStorage.setItem("hridhay_checkout_offers", JSON.stringify(offers));
    } catch (e) {
      console.error("Failed to save checkout to localStorage", e);
    }
  };

  const clearCheckout = () => {
    setCheckoutItems([]);
    setCheckoutOffers([]);
    try {
      localStorage.removeItem("hridhay_checkout");
      localStorage.removeItem("hridhay_checkout_offers");
    } catch (e) {
      console.error("Failed to clear checkout from localStorage", e);
    }
  };

  // Helper to post a cart mutation to the backend
  const saveCartItemToApi = async (productId: number, variantId: number, quantityChange: number, packingType?: string) => {
    const token = localStorage.getItem("authToken");
    const customerId = localStorage.getItem("customerId");
    if (!token || !customerId) return false;

    if (isSyncingRef.current) {
      console.log("[saveCartItemToApi] API request already in progress. Ignoring.");
      return false;
    }

    try {
      isSyncingRef.current = true;
      setIsCartLoading(true);
      const payload = {
        "customerId": Number(customerId),
        "productId": Number(productId),
        "variantId": Number(variantId),
        "quantity": Number(quantityChange),
        "packingType": packingType || ""
      };

      console.log("[saveCartItemToApi] Request payload:", payload);

      const result: any = await post("/Cart/SaveCart", payload);
      console.log("[saveCartItemToApi] Response result:", result);

      const dataArray = getCaseInsensitiveProperty(result, "data") || result;

      if (Array.isArray(dataArray)) {
        console.log("[saveCartItemToApi] API returned updated cart array:", dataArray);
        const resolvedItems: CartItem[] = [];
        dataArray.forEach((item: any) => {
          const resolved = resolveCartItem(item);
          if (resolved) {
            resolvedItems.push(resolved);
          }
        });
        saveCart(resolvedItems);
        return true;
      }
      return false;
    } catch (e) {
      console.error("[saveCartItemToApi] Failed to post cart mutation:", e);
      return false;
    } finally {
      isSyncingRef.current = false;
      setIsCartLoading(false);
    }
  };

  // Helper to post a cart removal to the backend
  const removeCartItemFromApi = async (productId: number, variantId: number, quantity: number, packingType?: string) => {
    const token = localStorage.getItem("authToken");
    const customerId = localStorage.getItem("customerId");
    if (!token || !customerId) return false;

    if (isSyncingRef.current) {
      console.log("[removeCartItemFromApi] API request already in progress. Ignoring.");
      return false;
    }

    try {
      isSyncingRef.current = true;
      setIsCartLoading(true);
      const payload = {
        "customerId": Number(customerId),
        "productId": Number(productId),
        "variantId": Number(variantId),
        "quantity": Number(quantity),
        "packingType": packingType || ""
      };

      console.log("[removeCartItemFromApi] Request payload:", payload);

      const result: any = await del("/Cart/RemoveCart", { body: JSON.stringify(payload) });
      console.log("[removeCartItemFromApi] Response result:", result);

      const dataArray = getCaseInsensitiveProperty(result, "data") || result;

      if (Array.isArray(dataArray)) {
        console.log("[removeCartItemFromApi] API returned updated cart array:", dataArray);
        const resolvedItems: CartItem[] = [];
        dataArray.forEach((item: any) => {
          const resolved = resolveCartItem(item);
          if (resolved) {
            resolvedItems.push(resolved);
          }
        });
        saveCart(resolvedItems);
        return true;
      }
      return false;
    } catch (e) {
      console.error("[removeCartItemFromApi] Failed to post cart removal:", e);
      return false;
    } finally {
      isSyncingRef.current = false;
      setIsCartLoading(false);
    }
  };

  const addToCart = async (product: Product, quantity = 1, packingType?: string) => {
    if (isCartLoading || isSyncingRef.current) {
      console.log("[addToCart] Cart is loading/syncing. Ignoring request.");
      return;
    }

    const token = localStorage.getItem("authToken");
    const customerId = localStorage.getItem("customerId");

    // Determine numerical productId and variantId from product
    const { productId: resolvedProductId, variantId: resolvedVariantId } = getProductAndVariantIds(product);

    if (token && customerId && !isNaN(resolvedProductId)) {
      console.log(`[addToCart] Logged in. Syncing addition of ${product.name} (qty: ${quantity}) to API...`);
      const success = await saveCartItemToApi(resolvedProductId, resolvedVariantId, quantity, packingType);
      if (success) {
        setIsCartOpen(true);
        return;
      }
    }

    // Local fallback
    // Modify product ID locally if packaging is specified to distinguish the cart items
    const localProduct = packingType 
      ? { ...product, id: `${product.id}-${packingType.toLowerCase()}` } 
      : product;

    const existingIdx = cartItems.findIndex(item =>
      item.product.id === localProduct.id &&
      Number(item.product.variantId || 0) === Number(localProduct.variantId || 0) &&
      (item.packingType || "") === (packingType || "")
    );
    let newItems = [...cartItems];

    if (existingIdx > -1) {
      newItems[existingIdx].quantity += quantity;
    } else {
      newItems.push({ product: localProduct, quantity, packingType });
    }

    saveCart(newItems);
    setIsCartOpen(true); // Open the drawer as feedback
  };

  const removeFromCart = async (productId: string) => {
    if (isCartLoading || isSyncingRef.current) {
      console.log("[removeFromCart] Cart is loading/syncing. Ignoring request.");
      return;
    }

    const item = cartItems.find(item => item.product.id === productId);
    if (item) {
      const token = localStorage.getItem("authToken");
      const customerId = localStorage.getItem("customerId");

      const { productId: resolvedProductId, variantId: resolvedVariantId } = getProductAndVariantIds(item.product);

      if (token && customerId && !isNaN(resolvedProductId)) {
        console.log(`[removeFromCart] Logged in. Syncing deletion of ${item.product.name} (qty: ${item.quantity}) to API...`);
        const success = await removeCartItemFromApi(resolvedProductId, resolvedVariantId, item.quantity, item.packingType);
        if (success) return;
      }
    }

    // Local fallback
    const newItems = cartItems.filter(item => item.product.id !== productId);
    saveCart(newItems);
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (isCartLoading || isSyncingRef.current) {
      console.log("[updateQuantity] Cart is loading/syncing. Ignoring request.");
      return;
    }

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cartItems.find(item => item.product.id === productId);
    if (item) {
      const token = localStorage.getItem("authToken");
      const customerId = localStorage.getItem("customerId");

      const { productId: resolvedProductId, variantId: resolvedVariantId } = getProductAndVariantIds(item.product);

      if (token && customerId && !isNaN(resolvedProductId)) {
        const quantityChange = quantity - item.quantity;
        console.log(`[updateQuantity] Logged in. Syncing quantity change of ${item.product.name} (${quantityChange}) to API...`);
        const success = await saveCartItemToApi(resolvedProductId, resolvedVariantId, quantityChange, item.packingType);
        if (success) return;
      }
    }

    // Local fallback
    const newItems = cartItems.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    saveCart(newItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleSetIsCartOpen = (open: boolean) => {
    setIsCartOpen(open);
    if (open) {
      syncCartWithApi();
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen: handleSetIsCartOpen,
        cartCount,
        cartSubtotal,
        checkoutItems,
        checkoutOffers,
        prepareCheckout,
        clearCheckout,
        syncCartWithApi,
        mergeGuestCartToApi,
        isCartLoading
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
