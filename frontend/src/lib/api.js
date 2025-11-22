// Base URL for your backend.
// Uses environment variable if set, otherwise falls back to Emergent URL.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export async function apiLogin(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  return response.json();

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

