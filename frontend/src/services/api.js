const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "bf_token";

export const tokenStore = {
  get() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set(token) { try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage blocked */ } },
  clear() { try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ } },
};

function parseError(status, body) {
  if (status === 429) {
    return { message: "অনেক বেশি চেষ্টা হয়েছে, একটু পরে আবার করুন। (Too many requests)", fields: {} };
  }
  if (Array.isArray(body?.detail)) {
    const fields = {};
    for (const d of body.detail) {
      const key = d.loc?.[d.loc.length - 1];
      if (typeof key === "string" && !(key in fields)) {
        fields[key] = String(d.msg).replace(/^Value error,\s*/, "");
      }
    }
    return { message: "ফর্মের তথ্য ঠিক করে আবার চেষ্টা করুন।", fields };
  }
  if (typeof body?.detail === "string") return { message: body.detail, fields: {} };
  return { message: "কিছু ভুল হয়েছে, আবার চেষ্টা করুন। (Something went wrong)", fields: {} };
}

async function request(path, { method = "GET", json, formData, auth = false } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (formData) {
    body = formData; // the browser sets the multipart boundary itself
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { method, headers, body });
  } catch {
    throw new Error("সার্ভারে সংযোগ করা যাচ্ছে না। (Cannot reach the server)");
  }

  if (response.status === 204) return null;

  let data = null;
  try { data = await response.json(); } catch { /* empty body */ }

  if (!response.ok) {
    if (auth && response.status === 401) {
      tokenStore.clear();
      window.dispatchEvent(new Event("auth:expired"));
    }
    const { message, fields } = parseError(response.status, data);
    const error = new Error(message);
    error.status = response.status;
    error.fields = fields;
    throw error;
  }
  return data;
}

// ---------- Public ----------
export function getProperties(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== "" && value !== null && value !== undefined) params.set(key, String(value));
  }
  return request(`/properties?${params.toString()}`);
}
export const getProperty = (id) => request(`/properties/${id}`);
export const getAreas = () => request("/areas");
export const createInquiry = (data) => request("/inquiries", { method: "POST", json: data });

// ---------- Auth ----------
export const register = (data) => request("/auth/register", { method: "POST", json: data });
export const login = (data) => request("/auth/login", { method: "POST", json: data });
export const getMe = () => request("/auth/me", { auth: true });

// ---------- Landlord ----------
export const getMyProperties = () => request("/landlord/properties", { auth: true });
export const getMyProperty = (id) => request(`/landlord/properties/${id}`, { auth: true });
export const createMyProperty = (data) =>
  request("/landlord/properties", { method: "POST", json: data, auth: true });
export const updateMyProperty = (id, data) =>
  request(`/landlord/properties/${id}`, { method: "PUT", json: data, auth: true });
export const deleteMyProperty = (id) =>
  request(`/landlord/properties/${id}`, { method: "DELETE", auth: true });
export const markRented = (id) =>
  request(`/landlord/properties/${id}/mark-rented`, { method: "POST", auth: true });
export const markAvailable = (id) =>
  request(`/landlord/properties/${id}/mark-available`, { method: "POST", auth: true });
export function uploadImages(id, files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return request(`/landlord/properties/${id}/images`, { method: "POST", formData, auth: true });
}
export const deleteImage = (id, imageId) =>
  request(`/landlord/properties/${id}/images/${imageId}`, { method: "DELETE", auth: true });
export const getMyInquiries = () => request("/landlord/inquiries", { auth: true });