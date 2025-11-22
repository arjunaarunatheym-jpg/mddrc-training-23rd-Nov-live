// Base URL for your backend.
// Uses environment variable if set, otherwise falls back to Emergent URL.
const API_URL =
  process.env.REACT_APP_API_URL || "https://drivescore.emergent.host/api";

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  };

  const res = await fetch(url, defaultOptions);

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    console.error("Failed to parse JSON:", e);
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}

// Login helper – email/IC goes into "username" field
export async function login(identifier, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: identifier,
      password: password,
    }),
  });
}


// Login helper – email/IC goes into "username" field
export async function login(identifier, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: identifier,
      password: password,
    }),
  });
}

