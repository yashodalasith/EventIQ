const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function parseJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
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
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && !(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    const detail = payload?.detail;
    const detailMessage =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail
              .map((item) => {
                if (typeof item === "string") {
                  return item;
                }
                if (item && typeof item === "object") {
                  const loc = Array.isArray(item.loc)
                    ? item.loc.join(".")
                    : item.loc;
                  const msg = item.msg || item.message;
                  if (msg && loc) {
                    return `${loc}: ${msg}`;
                  }
                  return msg || null;
                }
                return null;
              })
              .filter(Boolean)
              .join("; ")
          : detail && typeof detail === "object"
            ? detail.message || detail.error || null
            : null;

    const validationErrors = Array.isArray(payload?.errors)
      ? payload.errors
      : [];

    const validationMessages = validationErrors
      .map((item) => {
        const field = item?.path || item?.param;
        const text = item?.msg || item?.message;
        if (!text) {
          return null;
        }
        return field ? `${field}: ${text}` : String(text);
      })
      .filter(Boolean);

    const message =
      payload?.message ||
      payload?.error ||
      detailMessage ||
      (validationMessages.length > 0
        ? "Please fix the highlighted fields and try again."
        : `Request failed with status ${response.status}`);

    const error = new Error(message);
    error.status = response.status;
    error.validationErrors = validationMessages;
    error.payload = payload;
    throw error;
  }

  return payload;
}

const authHeader = (token) => {
  if (!token) {
    throw new Error("Session expired. Please sign in again.");
  }

  return { Authorization: `Bearer ${token}` };
};

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

export async function updateProfile(token, input) {
  return request("/auth/profile", {
    method: "PATCH",
    headers: authHeader(token),
    body: JSON.stringify(input),
  });
}

export async function addAdminEmployeeId(token, employeeId) {
  return request("/auth/admin/employee-ids", {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify({ employeeId }),
  });
}

export async function listAdminEmployeeIds(token) {
  return request("/auth/admin/employee-ids", {
    headers: authHeader(token),
  });
}

export async function revokeAdminEmployeeId(token, employeeId) {
  return request(`/auth/admin/employee-ids/${encodeURIComponent(employeeId)}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

export async function deleteProfile(token, password) {
  // Use POST for broad client/proxy compatibility with JSON request bodies.
  return request("/auth/profile/delete", {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify({ password }),
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

export async function listResources(token, filters = {}) {
  return request(`/resources${buildQueryString(filters)}`, {
    headers: authHeader(token),
  });
}

export async function createResource(token, input) {
  return request("/resources", {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(input),
  });
}

export async function getResourceSummary(token) {
  return request("/resources/summary", {
    headers: authHeader(token),
  });
}

export async function createAllocation(token, input) {
  return request("/allocate", {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(input),
  });
}

export async function listAllocations(token, filters = {}) {
  return request(`/allocations${buildQueryString(filters)}`, {
    headers: authHeader(token),
  });
}

export async function releaseAllocation(token, allocationId, reason) {
  return request(`/allocations/${allocationId}/release`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify({ reason }),
  });
}

export async function cancelAllocation(token, allocationId, reason) {
  return request(`/allocations/${allocationId}/cancel`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify({ reason }),
  });
}

export { API_BASE_URL };
