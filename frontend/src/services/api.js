const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error("Cannot reach the server. Please try again.");
  }

  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    if (response.status === 429) {
      message = "Too many requests. Please wait a minute and try again.";
    } else {
      try {
        const body = await response.json();
        if (typeof body.detail === "string") message = body.detail;
      } catch {
        /* keep the default message */
      }
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export function getProperties(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== "" && value !== null && value !== undefined) {
      params.set(key, String(value));
    }
  }
  return request(`/properties?${params.toString()}`);
}

export function getProperty(id) {
  return request(`/properties/${id}`);
}

export function createInquiry(data) {
  return request("/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function getAreas() {
  return request("/areas");
}