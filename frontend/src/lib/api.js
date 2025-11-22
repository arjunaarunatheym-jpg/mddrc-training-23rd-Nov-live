const API_URL = process.env.REACT_APP_API_URL;

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

export async function login(email, password) {
  return apiFetch("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
