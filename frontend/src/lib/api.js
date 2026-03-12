const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function parseJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }
  return response.json();
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

export async function getProfile(token) {
  return request("/auth/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listEvents(token) {
  return request("/events", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listMyEvents(token) {
  return request("/events/mine", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createEvent(token, input) {
  return request("/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
}

export async function publishEvent(token, eventId) {
  return request(`/events/${eventId}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function registerForEvent(token, eventId) {
  return request(`/events/${eventId}/register`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export { API_BASE_URL };
