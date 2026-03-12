const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function parseJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }
  return response.json();
}

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    const message =
      payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

export async function registerUser(input) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginUser(input) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function refreshSession(refreshToken) {
  return request("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logoutUser(refreshToken) {
  return request("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logoutAllSessions(token) {
  return request("/auth/logout-all", {
    method: "POST",
    headers: authHeader(token),
  });
}

export async function getProfile(token) {
  return request("/auth/profile", {
    headers: authHeader(token),
  });
}

export async function listEvents(token) {
  return request("/events", {
    headers: authHeader(token),
  });
}

export async function listMyEvents(token) {
  return request("/events/mine", {
    headers: authHeader(token),
  });
}

export async function createEvent(token, input) {
  return request("/events", {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(input),
  });
}

export async function publishEvent(token, eventId) {
  return request(`/events/${eventId}/publish`, {
    method: "POST",
    headers: authHeader(token),
  });
}

export async function registerForEvent(token, eventId) {
  return request(`/events/${eventId}/register`, {
    method: "POST",
    headers: authHeader(token),
  });
}

export async function listNotifications(token, filters = {}) {
  return request(`/notifications${buildQueryString(filters)}`, {
    headers: authHeader(token),
  });
}

export async function createNotification(token, input) {
  return request("/notify", {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(input),
  });
}

export { API_BASE_URL };
