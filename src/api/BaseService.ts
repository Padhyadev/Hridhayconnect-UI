// Centralized API configuration for Hridhay Connect
// export const API_BASE_URL = "https://localhost:7103/api";
// export const RAZORPAY_KEY_ID = "rzp_test_T86G614Jko29cT";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://hridhayconnectreact.bsite.net/api").trim();
export const RAZORPAY_KEY_ID = (import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SNR6THeI8rRQIr").trim();

// Mapping of category page slugs to their respective API category IDs
export const CATEGORY_IDS = {
  soap: 15,
  "hair-oil": 16,
  mukhwas: 17,
  "tea-masala": 18,
  "hridhay-special": 19,
};

let lastApiResponseData: any = null;

async function fetchApi(url: string, options: RequestInit = {}) {
  // Use the authToken established in your auth flow
  const token = localStorage.getItem("authToken");

  const headers = new Headers(options.headers || {});

  // Only attach auth header when a token exists
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Content-Type is needed only for body requests
  const method = (options.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);

    // Attempt to parse response body
    let responseData = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      lastApiResponseData = responseData;
      // Simulate axios error structure for compatibility
      return Promise.reject({ response: { data: responseData, status: response.status } });
    }

    lastApiResponseData = responseData;
    return responseData;
  } catch (error) {
    lastApiResponseData = error;
    return Promise.reject(error);
  }
}

export async function get(url: string, config: RequestInit = {}) {
  return fetchApi(url, { ...config, method: "GET" });
}

export async function post(url: string, data: any, config: RequestInit = {}) {
  return fetchApi(url, { ...config, method: "POST", body: JSON.stringify(data) });
}

export async function put(url: string, data: any, config: RequestInit = {}) {
  return fetchApi(url, { ...config, method: "PUT", body: JSON.stringify(data) });
}

export async function del(url: string, config: RequestInit = {}) {
  return fetchApi(url, { ...config, method: "DELETE" });
}

export async function getBlob(url: string, config: RequestInit = {}) {
  const token = localStorage.getItem("authToken");
  const headers = new Headers(config.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...config,
    method: "GET",
    headers,
  });

  if (!response.ok) {
    return Promise.reject(new Error(`Error fetching blob: ${response.statusText}`));
  }
  return response.blob();
}

// Generic Lov dropdown helper
export async function getLovDropdownList(lovColumn: string) {
  return get(`/Dropdown/LovMaster?Lov_column=${encodeURIComponent(lovColumn)}`);
}

// Centralized JWT Customer ID Decoder
export function getCustomerIdFromToken(token: string): string | null {
  if (!token) return null;
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
    return customerId ? String(customerId) : null;
  } catch (e) {
    console.error("[getCustomerIdFromToken] Failed to decode JWT token:", e);
    return null;
  }
}

