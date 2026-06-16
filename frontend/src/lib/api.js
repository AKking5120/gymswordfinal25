import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gs_token");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap the { success, message, data, pagination, ... } envelope from sendSuccess
// so callers receive the inner payload directly via `{ data }` destructuring.
api.interceptors.response.use((response) => {
  const body = response.data;
  if (body && typeof body === "object" && "success" in body) {
    // If the envelope contains a `data` key, hoist it to response.data
    // so existing code like `.then(({ data }) => ...)` gets the array/object.
    if ("data" in body) {
      response.data = body.data;
      // Preserve pagination on the response object for pages that need it
      if (body.pagination) response.pagination = body.pagination;
    } else {
      // No `data` key — expose the rest of the envelope (minus success/message)
      const { success: _s, message: _m, ...rest } = body;
      response.data = rest;
    }
  }
  return response;
}, (error) => {
  if (error.response?.data && typeof error.response.data === 'object') {
    const body = error.response.data;
    if ('message' in body && !body.detail) {
      body.detail = body.message;
    }
  }
  return Promise.reject(error);
});

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export function resolveImage(url) {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${BACKEND_URL}${url}`;
}

export const PRODUCT_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23F5F5F7'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23A0A0A8' font-family='Arial,sans-serif' font-size='18'%3ENo image%3C/text%3E%3C/svg%3E";
