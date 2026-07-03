import { products, Product, syncProducts } from "../data/products";
import { API_BASE_URL, post } from "./BaseService";

export interface ApiProductImage {
  imagePath: string;
  isPrimary: boolean;
}

export interface ApiProduct {
  ProductId: number;
  ProductDescription: string;
  VarientId: number;
  ProductName: string;
  CategoryId: number;
  CategoryName: string;
  ParentCategoryId: number;
  IsWishlist: boolean;
  VariantAttributeValues_Only: any;
  VariantAttributes: any;
  SKU: string;
  Price: number;
  SellPrice: number;
  DiscountPercent: number;
  IsPercentagePricing: boolean;
  ImagePath: any;
  Images: ApiProductImage[];
  TotalAvailableStock: number;
}

export interface ApiResponse {
  data: {
    table1: Array<{ TotalRecords: number; FilteredRecords: number }>;
    table2: ApiProduct[];
  };
}

// Function to normalize strings for comparison (e.g. "Beet Radiance" -> "beet-radiance")
export function normalizeSlug(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Robust case-insensitive helper to retrieve properties from an API object.
 * Handles exact matches, common CamelCase/PascalCase variations, and fallback to case-insensitive key scanning.
 */
export function getCaseInsensitiveProperty<T = any>(obj: any, key: string): T | undefined {
  if (!obj || typeof obj !== "object") return undefined;

  // Try direct access first (fastest)
  if (obj[key] !== undefined) return obj[key];

  // Try standard camelCase / PascalCase variations
  const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
  if (obj[camelKey] !== undefined) return obj[camelKey];

  const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
  if (obj[pascalKey] !== undefined) return obj[pascalKey];

  // Fallback to searching keys case-insensitively
  const lowerTarget = key.toLowerCase();
  const foundKey = Object.keys(obj).find(k => k.toLowerCase() === lowerTarget);
  return foundKey ? obj[foundKey] : undefined;
}

/**
 * Safely extracts a numeric property, avoiding returning objects or NaN
 */
export function getNumericProperty(obj: any, key: string): number | undefined {
  const val = getCaseInsensitiveProperty(obj, key);
  if (val === undefined || val === null || typeof val === 'object' || Array.isArray(val)) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}

/**
 * Checks if a variant should be hidden based on attribute conditions.
 * Hides variants where VariantAttributesId = '12:62' or VariantAttributeValues_Id = '62'.
 */
export function shouldHideVariant(item: any): boolean {
  if (!item) return false;

  const variantAttributesIdRaw = getCaseInsensitiveProperty<any>(item, "VariantAttributesId")
    || getCaseInsensitiveProperty<any>(item, "VariantAttributes_Id")
    || getCaseInsensitiveProperty<any>(item, "VariantAttributesId");
  const variantAttributeValuesIdRaw = getCaseInsensitiveProperty<any>(item, "VariantAttributeValues_Id")
    || getCaseInsensitiveProperty<any>(item, "VariantAttributeValues_ID")
    || getCaseInsensitiveProperty<any>(item, "VariantAttributeValueId");

  const variantAttributesId = variantAttributesIdRaw ? String(variantAttributesIdRaw).trim() : "";
  const variantAttributeValuesId = variantAttributeValuesIdRaw ? String(variantAttributeValuesIdRaw).trim() : "";

  // Exact matches
  if (variantAttributesId === "12:62" || variantAttributeValuesId === "62") {
    return true;
  }

  // Composite matches (in case values are comma/colon-separated lists)
  if (variantAttributeValuesId.split(":").includes("62") || variantAttributeValuesId.split(",").includes("62")) {
    return true;
  }

  if (variantAttributesId.split(",").includes("12:62") || variantAttributesId.split(";").includes("12:62")) {
    return true;
  }

  return false;
}

/**
 * Robustly parses API response structure to find the table2 products array.
 * Supports wrapped "data"/"Data" and lowercase/PascalCase tables.
 */
export function getApiProducts(result: any): any[] {
  if (!result || typeof result !== "object") return [];

  // Get data object (which might be wrapped in data/Data or be the root result itself)
  const data = getCaseInsensitiveProperty(result, "data") || result;

  // Get table2 array (supports table2 / Table2 / Table1 vs Table2)
  const table2 = getCaseInsensitiveProperty(data, "table2");
  if (Array.isArray(table2)) return table2;

  // If table2 is not found directly, scan all array properties for any table2 matching name
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key]) && key.toLowerCase().includes("table2")) {
      return data[key];
    }
  }

  // Fallback to finding any array that is not table1/Table1
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key]) && !key.toLowerCase().includes("table1")) {
      return data[key];
    }
  }

  // Finally, if the data object itself is an array, return it
  if (Array.isArray(data)) return data;

  return [];
}

/**
 * Resolves a raw image path from the API into a full URL.
 * Handles absolute URLs, relative paths, and fallback to a no-image placeholder.
 */
export function resolveImageUrl(rawPath: string | undefined | null): string {
  if (rawPath && typeof rawPath === "string" && rawPath.trim()) {
    const pathStr = rawPath.trim();
    if (pathStr.startsWith("http://") || pathStr.startsWith("https://")) {
      return pathStr;
    } else {
      const cleanPath = pathStr.replace(/\\/g, "/").replace(/^\/+/, "");
      const apiBase = import.meta.env.VITE_API_BASE_URL || "https://hridhayconnectreact.bsite.net/api";
      const domain = apiBase.split("/api")[0] || "https://hridhayconnectreact.bsite.net";
      return `${domain}/${cleanPath}`;
    }
  }
  return "/Image/Noimage.jpg";
}

/**
 * Extracts all resolved image URLs from a variant's Images array.
 * Returns images sorted with isPrimary=true first.
 * Falls back to the legacy single ImagePath field if Images array is empty.
 */
function extractImagesFromVariant(apiVar: any): string[] {
  const imagesArray = getCaseInsensitiveProperty<any[]>(apiVar, "Images");

  if (Array.isArray(imagesArray) && imagesArray.length > 0) {
    // Sort: primary images first
    const sorted = [...imagesArray].sort((a, b) => {
      const aP = a.isPrimary || a.IsPrimary ? 1 : 0;
      const bP = b.isPrimary || b.IsPrimary ? 1 : 0;
      return bP - aP;
    });

    return sorted
      .map((img: any) => {
        const path = img.imagePath || img.ImagePath || "";
        return resolveImageUrl(path);
      })
      .filter((url: string) => url !== "/Image/Noimage.jpg");
  }

  // Fallback to legacy single ImagePath field
  const legacyPath = getCaseInsensitiveProperty<string>(apiVar, "ImagePath") || "";
  const resolved = resolveImageUrl(legacyPath);
  if (resolved !== "/Image/Noimage.jpg") {
    return [resolved];
  }

  return [];
}

let productsCache: Record<number, Product[]> = {};
let productsPromiseCache: Record<number, Promise<Product[]>> = {};

/**
 * Fetches products for a specific category ID from the backend API.
 * Maps and merges them with the local high-fidelity products metadata.
 */
export async function fetchProductsFromApi(categoryId: number, forceRefresh = false): Promise<Product[]> {
  if (forceRefresh) {
    delete productsCache[categoryId];
    delete productsPromiseCache[categoryId];
  }

  if (!forceRefresh && productsCache[categoryId]) {
    return productsCache[categoryId];
  }
  if (!forceRefresh && productsPromiseCache[categoryId]) {
    return productsPromiseCache[categoryId];
  }

  productsPromiseCache[categoryId] = (async () => {
    const body = {
      Id: -2,
      CategoryId: categoryId,
      Search: "",
      Start: 0,
      Length: 9999,
      SortColumnIndex: 0,
      SortDirection: "DESC"
    };
    console.log(`[API Request] Fetching from /Product/GetAll`, body);

    try {
      const result: any = await post("/Product/GetAll", body);
      console.log(`[API Response] Successfully fetched categoryId ${categoryId} data:`, result);
      const apiProducts = getApiProducts(result);

      if (apiProducts.length === 0) {
        productsCache[categoryId] = [];
        return [];
      }

      // Group the API products by ProductId to collect variants
      const groupedProducts: Record<number, any[]> = {};
      apiProducts.forEach(apiProd => {
        const prodId = getCaseInsensitiveProperty<number>(apiProd, "ProductId");
        if (prodId !== undefined && prodId !== null) {
          const prodIdNum = Number(prodId);
          if (!groupedProducts[prodIdNum]) {
            groupedProducts[prodIdNum] = [];
          }
          groupedProducts[prodIdNum].push(apiProd);
        }
      });

      const parsed = Object.keys(groupedProducts).map((prodIdStr) => {
        const group = groupedProducts[Number(prodIdStr)];
        return parseApiProductGroup(group);
      });

      productsCache[categoryId] = parsed;
      return parsed;
    } catch (error) {
      console.error(`Error fetching products for categoryId ${categoryId}:`, error);
      // Clear from promise cache on failure so future attempts can retry
      delete productsPromiseCache[categoryId];
      return [];
    }
  })();

  return productsPromiseCache[categoryId];
}

/**
 * Parses a group of API variants (with the same ProductId) into a single high-fidelity Product object.
 */
export function parseApiProductGroup(group: any[]): Product {
  const primaryApiProd = group[0]; // Use first variant as default details

  const prodName = getCaseInsensitiveProperty<string>(primaryApiProd, "ProductName") || "";
  const prodSku = getCaseInsensitiveProperty<string>(primaryApiProd, "SKU") || "";
  const prodId = getCaseInsensitiveProperty<number>(primaryApiProd, "ProductId");
  const prodDesc = (getCaseInsensitiveProperty<string>(primaryApiProd, "ProductDescription") || "").trim();
  const categoryIdVal = getNumericProperty(primaryApiProd, "CategoryId");
  const categoryNameVal = getCaseInsensitiveProperty<string>(primaryApiProd, "CategoryName") || "";
  const priceVal = getNumericProperty(primaryApiProd, "Price") || 0;
  const sellPriceVal = getNumericProperty(primaryApiProd, "SellPrice");
  const discountPercentVal = getNumericProperty(primaryApiProd, "DiscountPercent");
  const isPercentagePricingVal = getCaseInsensitiveProperty<boolean>(primaryApiProd, "IsPercentagePricing");
  const totalStock = getNumericProperty(primaryApiProd, "TotalAvailableStock") || 0;

  const apiSlug = normalizeSlug(prodName);
  const apiSkuSlug = normalizeSlug(prodSku);

  // Find a matching static product in local storage to enrich
  const localProduct = products.find((p) => {
    const localSlug = normalizeSlug(p.name);
    const localId = normalizeSlug(p.id);
    return (
      localId === apiSlug ||
      localId === apiSkuSlug ||
      localSlug === apiSlug ||
      localSlug === apiSkuSlug ||
      p.id.replace(/-100|-200/g, "") === apiSlug ||
      p.id.replace(/-100|-200/g, "") === apiSkuSlug
    );
  });

  // Map the variants
  const variants = group.map(apiVar => {
    const varientId = getNumericProperty(apiVar, "VarientId") || 0;
    let variantAttributeValues_Only = getCaseInsensitiveProperty<string>(apiVar, "VariantAttributeValues_Only") || "";
    let variantAttributes = getCaseInsensitiveProperty<string>(apiVar, "VariantAttributes") || "";

    if (shouldHideVariant(apiVar)) {
      variantAttributeValues_Only = "";
      variantAttributes = "";
    }
    const sku = getCaseInsensitiveProperty<string>(apiVar, "SKU") || "";
    const price = getNumericProperty(apiVar, "Price") || 0;
    const varSellPrice = getNumericProperty(apiVar, "SellPrice");
    const varDiscountPercent = getNumericProperty(apiVar, "DiscountPercent");
    const varIsPercentagePricing = getCaseInsensitiveProperty<boolean>(apiVar, "IsPercentagePricing");
    const totalAvailableStock = getNumericProperty(apiVar, "TotalAvailableStock") || 0;

    // Extract images from the new Images array format
    const variantImageUrls = extractImagesFromVariant(apiVar);

    return {
      varientId,
      variantAttributeValues_Only,
      variantAttributes,
      sku,
      price,
      sellPrice: varSellPrice ?? price,
      discountPercent: varDiscountPercent ?? 0,
      isPercentagePricing: varIsPercentagePricing ?? false,
      imagePath: variantImageUrls[0] || "/Image/Noimage.jpg",
      totalAvailableStock
    };
  });

  // Gather product images from the first variant's Images array
  // (all variants for the same product share the same images)
  const productImages = extractImagesFromVariant(primaryApiProd);

  // Also collect any unique variant-specific images as fallback
  const variantOnlyImages = variants.map(v => v.imagePath).filter(Boolean);

  // Only use dynamic database/API images (productImages and variantOnlyImages) to avoid showing placeholder images
  const allImages = Array.from(new Set([...productImages, ...variantOnlyImages]))
    .filter(url => url !== "/Image/Noimage.jpg");

  // Determine category string
  const catMap: Record<number, string> = {
    15: "soap",
    16: "hair-oil",
    17: "mukhwas",
    18: "tea-masala",
    19: "hridhay-special"
  };
  const resolvedCategory = localProduct?.category ?? (categoryIdVal ? catMap[categoryIdVal] : "soap");

  // Compute dynamic pricing fields
  const resolvedSellPrice = sellPriceVal ?? priceVal;
  const resolvedDiscountPercent = discountPercentVal ?? 0;
  const resolvedIsPercentagePricing = isPercentagePricingVal ?? false;

  // Derive originalPrice and discount string from API data
  const computedOriginalPrice = priceVal; // Price from API is the MRP/original price
  const computedDiscount = resolvedDiscountPercent > 0
    ? `${Math.round(resolvedDiscountPercent)}% OFF`
    : (priceVal !== resolvedSellPrice ? `${Math.round((1 - resolvedSellPrice / priceVal) * 100)}% OFF` : "");

  return {
    id: localProduct?.id || apiSlug || apiSkuSlug || String(prodId),
    name: prodName || (localProduct?.name ?? ""),
    price: resolvedSellPrice,
    originalPrice: computedOriginalPrice,
    discount: computedDiscount,
    tag: localProduct?.tag ?? "",
    images: allImages.length > 0 ? allImages : ["/Image/Noimage.jpg"],
    category: resolvedCategory as any,
    tagline: localProduct?.tagline ?? prodDesc ?? "",
    rating: localProduct?.rating ?? 4.8,
    ratingCount: localProduct?.ratingCount ?? 120,
    desc: prodDesc || (localProduct?.desc ?? ""),
    longDesc: prodDesc || (localProduct?.longDesc ?? ""),
    benefits: localProduct?.benefits ?? [
      "Deeply nourishes & brightens skin",
      "Keeps skin soft, plump & hydrated"
    ],
    ingredients: localProduct?.ingredients ?? [],
    usage: localProduct?.usage ?? [],
    highlights: localProduct?.highlights ?? [],
    reviews: localProduct?.reviews ?? [],
    faqs: localProduct?.faqs ?? [],
    variants: variants,
    totalAvailableStock: totalStock,
    productId: prodId ? Number(prodId) : undefined,
    categoryName: categoryNameVal,
    sellPrice: resolvedSellPrice,
    discountPercent: resolvedDiscountPercent,
    isPercentagePricing: resolvedIsPercentagePricing
  };
}

export interface HomeSection {
  id: number; // table2.Id
  componentId: number; // table2.ComponentId
  title: string;
  refType: string;
  displayOrder: number;
  items: any[]; // Product[] or { id, name, categoryId, image }[]
}

let homeSectionsCache: HomeSection[] | null = null;
let homeSectionsPromise: Promise<HomeSection[]> | null = null;

function prefetchImage(url: string) {
  if (typeof window !== "undefined" && url && url !== "/Image/Noimage.jpg") {
    const img = new Image();
    img.src = url;
  }
}

/**
 * Fetches dynamic homepage sections (table1, table2, table3 format) with caching.
 */
export async function fetchHomepageSectionsFromApi(forceRefresh = false): Promise<HomeSection[]> {
  if (!forceRefresh && homeSectionsCache) return homeSectionsCache;
  if (!forceRefresh && homeSectionsPromise) return homeSectionsPromise;

  homeSectionsPromise = (async () => {
    try {
      const result: any = await post("/Home/GetHomeComponent", {}, { priority: "high" } as any);
      const data = getCaseInsensitiveProperty(result, "data") || result;

      const table2 = getCaseInsensitiveProperty<any[]>(data, "table2") || [];
      const table3 = getCaseInsensitiveProperty<any[]>(data, "table3") || [];

      if (!Array.isArray(table2) || !Array.isArray(table3)) return [];

      const sections: HomeSection[] = [];

      // Sort table2 by DisplayOrder (if available) or by ID
      const sortedSections = [...table2].sort((a, b) => {
        const orderA = getCaseInsensitiveProperty<number>(a, "DisplayOrder") ?? 999;
        const orderB = getCaseInsensitiveProperty<number>(b, "DisplayOrder") ?? 999;
        return orderA - orderB;
      });

      for (const t2 of sortedSections) {
        const primaryId = getCaseInsensitiveProperty<number>(t2, "Id") ?? 0;
        const logicalComponentId = getCaseInsensitiveProperty<number>(t2, "ComponentId") ?? 0;
        const title = getCaseInsensitiveProperty<string>(t2, "Title") ?? "";
        const refType = getCaseInsensitiveProperty<string>(t2, "RefType") ?? "";
        const displayOrder = getCaseInsensitiveProperty<number>(t2, "DisplayOrder") ?? 0;

        const rawItems = table3.filter((t3: any) => {
          const cid = getCaseInsensitiveProperty<number>(t3, "ComponentItemId");
          return cid === primaryId; // Match table3.ComponentItemId with table2.Id
        });

        let parsedItems: any[] = [];

        if (refType.toLowerCase() === "category") {
          parsedItems = rawItems.map((r: any) => {
            const catId = getCaseInsensitiveProperty<number>(r, "CategoryId");
            const catName = getCaseInsensitiveProperty<string>(r, "CategoryName");
            const imgPath = getCaseInsensitiveProperty<string>(r, "ImagePath");

            let resolvedCat = "soap";
            if (catId === 15) resolvedCat = "soap";
            else if (catId === 16) resolvedCat = "hair-oil";
            else if (catId === 17) resolvedCat = "mukhwas";
            else if (catId === 18) resolvedCat = "tea-masala";
            else if (catId === 19) resolvedCat = "hridhay-special";

            return {
              id: resolvedCat,
              categoryId: catId,
              name: catName || resolvedCat,
              image: resolveImageUrl(imgPath)
            };
          });
        } else {
          const grouped: Record<number, any[]> = {};
          rawItems.forEach((r: any) => {
            const pId = getCaseInsensitiveProperty<number>(r, "ProductId");
            if (pId) {
              if (!grouped[pId]) grouped[pId] = [];
              grouped[pId].push(r);
            }
          });

          parsedItems = Object.keys(grouped).map(pIdStr => {
            return parseApiProductGroup(grouped[Number(pIdStr)]);
          });

          syncProducts(parsedItems);
        }

        if (parsedItems.length > 0) {
          sections.push({
            id: primaryId,
            componentId: logicalComponentId,
            title,
            refType,
            displayOrder,
            items: parsedItems
          });
        }
      }

      homeSectionsCache = sections;

      // Eagerly prefetch the first few images of each section to make them load instantly in the browser
      try {
        sections.forEach(sec => {
          // Prefetch up to 4 items from each section
          sec.items.slice(0, 4).forEach((item: any) => {
            if (item.image) {
              prefetchImage(item.image);
            } else if (Array.isArray(item.images) && item.images[0]) {
              prefetchImage(item.images[0]);
            }
          });
        });
      } catch (err) {
        console.warn("Failed to prefetch section images", err);
      }

      return sections;
    } catch (error) {
      console.error("Failed to fetch homepage sections", error);
      return [];
    }
  })();

  return homeSectionsPromise;
}
